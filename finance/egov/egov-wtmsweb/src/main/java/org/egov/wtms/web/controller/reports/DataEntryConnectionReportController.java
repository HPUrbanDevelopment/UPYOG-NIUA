/**
 * eGov suite of products aim to improve the internal efficiency,transparency,
   accountability and the service delivery of the government  organizations.

    Copyright (C) <2015>  eGovernments Foundation

    The updated version of eGov suite of products as by eGovernments Foundation
    is available at http://www.egovernments.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see http://www.gnu.org/licenses/ or
    http://www.gnu.org/licenses/gpl.html .

    In addition to the terms of the GPL license to be adhered to in using this
    program, the following additional terms are to be complied with:

        1) All versions of this program, verbatim or modified must carry this
           Legal Notice.

        2) Any misrepresentation of the origin of the material is prohibited. It
           is required that all modified versions of this material be marked in
           reasonable ways as different from the original version.

        3) This license does not grant any rights to any user of the program
           with regards to rights under trademark law for use of the trade names
           or trademarks of eGovernments Foundation.

  In case of any queries, you can reach eGovernments Foundation at contact@egovernments.org.
 */
package org.egov.wtms.web.controller.reports;

import static org.egov.ptis.constants.PropertyTaxConstants.REVENUE_HIERARCHY_TYPE;
import static org.springframework.web.bind.annotation.RequestMethod.GET;

import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.egov.demand.dao.DemandGenericDao;
import org.egov.infra.admin.master.entity.Boundary;
import org.egov.infra.admin.master.service.BoundaryService;
import org.egov.wtms.application.entity.WaterConnectionDetails;
import org.egov.wtms.application.service.ConnectionDemandService;
import org.egov.wtms.application.service.DataEntryConnectionReport;
import org.egov.wtms.application.service.DataEntryConnectionReportService;
import org.egov.wtms.application.service.WaterConnectionDetailsService;
import org.egov.wtms.utils.WaterTaxUtils;
import org.egov.wtms.utils.constants.WaterTaxConstants;
import org.hibernate.SQLQuery;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

@Controller
@RequestMapping("/report/dataEntryConnectionReport/search")
public class DataEntryConnectionReportController {

    @Autowired
    private BoundaryService boundaryService;

    @Autowired
    private DataEntryConnectionReportService dataEntryConnectionReportService;

    @Autowired
    public WaterConnectionDetailsService waterConnectionDetailsService;

    @Autowired
    public ConnectionDemandService connectionDemandService;

    @Autowired
    private DemandGenericDao demandGenericDao;

    @Autowired
    private WaterTaxUtils waterTaxUtils;

    @RequestMapping(method = GET)
    public String search(final Model model) {
        model.addAttribute("currentDate", new Date());
        return "dataEntryReport-search";
    }

    @ModelAttribute
    public DataEntryConnectionReport reportModel() {
        return new DataEntryConnectionReport();
    }

    public @ModelAttribute("revenueWards") List<Boundary> revenueWardList() {
        return boundaryService.getActiveBoundariesByBndryTypeNameAndHierarchyTypeName(WaterTaxConstants.REVENUE_WARD,
                REVENUE_HIERARCHY_TYPE);
    }

    @RequestMapping(value = "/result/", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public @ResponseBody void searchResult(final HttpServletRequest request, final HttpServletResponse response)
            throws IOException, ParseException {
        String ward = "";
        if (null != request.getParameter("ward"))
            ward = request.getParameter("ward");
        List<DataEntryConnectionReport> dataEntryConnectionReportlist = new ArrayList<DataEntryConnectionReport>();
        final SQLQuery query = dataEntryConnectionReportService.getDataEntryConnectionReportDetails(ward);
        dataEntryConnectionReportlist = query.list();
        String result = null;
        for (final DataEntryConnectionReport dataEntryReport : dataEntryConnectionReportlist) {
            final WaterConnectionDetails waterConnectionDetails = waterConnectionDetailsService
                    .findByApplicationNumberOrConsumerCode(dataEntryReport.getHscNo());
            if (waterConnectionDetails.getExistingConnection()!=null)
            dataEntryReport.setMonthlyFee(waterConnectionDetails.getExistingConnection().getMonthlyFee());
        }
        result = new StringBuilder("{ \"data\":").append(toJSON(dataEntryConnectionReportlist)).append("}").toString();
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        IOUtils.write(result, response.getWriter());
    }

    private Object toJSON(final Object object) {
        final GsonBuilder gsonBuilder = new GsonBuilder();
        final Gson gson = gsonBuilder.registerTypeAdapter(DataEntryConnectionReport.class,
                new DataEntryConnectionReportAdaptor()).create();
        final String json = gson.toJson(object);
        return json;
    }
}