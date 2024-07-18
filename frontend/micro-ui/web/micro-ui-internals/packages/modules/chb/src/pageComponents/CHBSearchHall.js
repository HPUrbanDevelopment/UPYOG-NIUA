import React, {useRef, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import ApplicationTable from "../components/inbox/ApplicationTable";
import {
  FormStep,
  CardHeader,
  CardLabel,
  Dropdown,
  SubmitBar,
  Calender,
  Toast,
  InfoIcon,
  Card
} from "@nudmcdgnpm/digit-ui-react-components";
import { DateRangePicker, createStaticRanges } from "react-date-range";
import { addDays, startOfDay, endOfDay, format, differenceInCalendarDays } from 'date-fns';
import ChbCommunityHallDetails from "../components/ChbCommunityHallDetails";

const CommunityHallSearch = ({ t, onSelect, config, userType, formData }) => {
  const { pathname: url } = useLocation();
  let index = 0;
  const [bookingSlotDetails, setBookingSlotDetails] = useState(
    (formData.slotlist && formData.slotlist[index] && formData.slotlist[index].bookingSlotDetails) ||
    formData?.slotlist?.bookingSlotDetails ||
    []
  );
  const [selectedHall, setSelectedHall] = useState(
    (formData.slotlist && formData.slotlist[index] && formData.slotlist[index].selectedHall) ||
    formData?.slotlist?.selectedHall ||
    ""
  );
  const [showToast, setShowToast] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const dateRangePickerRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [hallCode, setHallCode] = useState(
    (formData.slotlist && formData.slotlist[index] && formData.slotlist[index].hallCode) ||
    formData?.slotlist?.hallCode ||
    ""
  );
  const stateId = Digit.ULBService.getStateId();
  const [dateRange, setDateRange] = useState([{
    startDate: null,
    endDate: null,
    key: 'selection'
  }]);
  const { data: hallList } = Digit.Hooks.chb.useChbCommunityHalls(stateId, "CHB", "ChbCommunityHalls");
  const { data: Hall } = Digit.Hooks.chb.useChbHallCode(stateId, "CHB", "ChbHallCode");
  
  let initialData = [];
  let HallName = [];
  let HallId = [];

  hallList && hallList.map((slot) => {
    initialData.push({ communityHallId: slot.communityHallId, name: slot.name, code: slot.code, address: slot.address });
  });
  hallList && hallList.map((slot) => {
    HallName.push({ i18nKey: `${slot.code}`, code: `${slot.code}`, value: `${slot.name}`, communityHallId: slot.communityHallId });
  });
  Hall && Hall.map((slot) => {
    HallId.push({ i18nKey: `${slot.code}`, code: `${slot.code}`, value: `${slot.code}`, communityHallId: slot.communityHallId });
  });
  const hallCodeId = HallId.map((slot) => {
    if (selectedHall.communityHallId === slot.communityHallId) {
      return {
        i18nKey: slot.code,
        code: slot.code,
        value: slot.code,
        communityHallId: slot.communityHallId
      };
    }
  }).filter(item => item !== undefined);
  const Searchdata = initialData.reduce((acc, slot) => {
    if ((slot.code === selectedHall.code && slot.communityHallId === hallCode.communityHallId) || slot.code === selectedHall.code) {
      acc.push({
        communityHallCode: slot.name,
        hallCode: slot.communityHallId || hallCode.name,
        hallAddress: slot.address
      });
    }
    return acc;
  }, []);

  // Define the slot_search hook to refetch data on search
  const { data: slotSearchData, refetch } = Digit.Hooks.chb.useChbSlotSearch({
    tenantId: "pg.citya",
    filters: {
      communityHallCode: Searchdata.length ? Searchdata[0].communityHallCode : "",
      bookingStartDate: dateRange[0].startDate ? format(dateRange[0].startDate, 'dd-MM-yyyy') : "",
      bookingEndDate: dateRange[0].endDate ? format(dateRange[0].endDate, 'dd-MM-yyyy') : "",
      hallCode: Searchdata.length ? Searchdata[0].hallCode : ""
    }
  });

  useEffect(() => {
    if (slotSearchData && slotSearchData.hallSlotAvailabiltityDetails) {
      const newData = slotSearchData.hallSlotAvailabiltityDetails.map((slot, index) => ({
        slotId: index + 1,
        name: slot.communityHallCode,
        address: Searchdata.length ? Searchdata[0].hallAddress : "",
        hallCode: Searchdata[0].hallCode,
        bookingDate: slot.bookingDate,
        status: slot.slotStaus === "AVAILABLE" ? (
          <div className="sla-cell-success">Available</div>
        ) : (
          <div className="sla-cell-error">Booked</div>
        )
      }));

      // Only update state if newData is different from current state
      setData((prevData) => {
        if (JSON.stringify(prevData) !== JSON.stringify(newData)) {
          return newData;
        }
        return prevData;
      });

      setShowTable((prevShowTable) => {
        if (!prevShowTable) {
          return true;
        }
        return prevShowTable;
      });
    }
  }, [slotSearchData, Searchdata]);

  const [data, setData] = useState("");
  const [showTable, setShowTable] = useState(false); // State to control table visibility
  const [isCheckboxSelected, setIsCheckboxSelected] = useState(false);

  const columns = [
    { Header: `${t("CHB_HALL_NAME")}` + "/" + `${t("CHB_PARK")}`, accessor: "name" },
    { Header: `${t("CHB_ADDRESS")}`, accessor: "address" },
    { Header: `${t("CHB_HALL_CODE")}`, accessor: "hallCode" },
    { Header: `${t("CHB_BOOKING_DATE")}`, accessor: "bookingDate" },
    { Header: `${t("CHB_STATUS")}`, accessor: "status" },
  ];

  const { control } = useForm();

  const goNext = () => {
    let owner = formData.slotlist && formData.slotlist[index];
    let ownerStep;
    if (userType === "citizen") {
      ownerStep = { ...owner, bookingSlotDetails, selectedHall, hallCode };
      onSelect(config.key, { ...formData[config.key], ...ownerStep }, false, index);
    } else {
      ownerStep = { ...owner, bookingSlotDetails, selectedHall, hallCode };
      onSelect(config.key, ownerStep, false, index);
    }
  };

  const onSkip = () => onSelect();

  useEffect(() => {
    if (userType === "citizen") {
      goNext();
    }
  }, [bookingSlotDetails, selectedHall, hallCode]);
  
  const handleViewReportClick = () => {
    if (selectedHall) {
      // Trigger the popup
      setShowDetails(prevShowDetails => !prevShowDetails); 
    } else {
      // Show toast message
      setShowToast({ error: true, label: 'Please select a hall name.' });
    }
  };

  const handleRowSelection = (rowIndex) => {
    setBookingSlotDetails((prevSelectedRows) => {
      const updatedSelectedRows = prevSelectedRows.some(row => row.slotId === data[rowIndex].slotId) ?
        prevSelectedRows.filter(row => row.slotId !== data[rowIndex].slotId) :
        [...prevSelectedRows, data[rowIndex]];
      setIsCheckboxSelected(updatedSelectedRows.length > 0);
      return updatedSelectedRows;
    });
  };

  const checkboxColumn = {
    id: "selection",
    Header: ({ getToggleAllRowsSelectedProps }) => (
      <div style={{ paddingLeft: '50px' }}>
        <input
          type="checkbox"
          checked={bookingSlotDetails.length === data.length}
          onChange={() => {
            if (bookingSlotDetails.length === data.length) {
              setBookingSlotDetails([]);
              setIsCheckboxSelected(false);
            } else {
              const allRows = data;
              setBookingSlotDetails(allRows);
              setIsCheckboxSelected(true);
            }
          }}
        />
      </div>
    ),
    Cell: ({ row }) => (
      <div style={{ paddingLeft: '50px' }}>
        <input
          type="checkbox"
          checked={bookingSlotDetails.some(selectedRow => selectedRow.slotId === row.original.slotId)}
          onChange={() => handleRowSelection(row.index)}
        />
      </div>
    ),
  };

  const enhancedColumns = [checkboxColumn, ...columns];
  const staticRanges = createStaticRanges([
    {
      label: 'Today',
      range: () => ({
        startDate: startOfDay(new Date()),
        endDate: endOfDay(new Date())
      })
    },
    {
      label: 'Tomorrow',
      range: () => ({
        startDate: startOfDay(addDays(new Date(), 1)),
        endDate: endOfDay(addDays(new Date(), 1))
      })
    },
    {
      label: 'Next 2 Days',
      range: () => ({
        startDate: startOfDay(new Date()),
        endDate: endOfDay(addDays(new Date(), 2))
      })
    },
  ]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangePickerRef.current && !dateRangePickerRef.current.contains(event.target) && !event.target.closest('.calendar-icon')) {
        setShowDateRangePicker(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const handleDateRangeChange = (item) => {
    const { startDate, endDate } = item.selection;
    const dayDifference = differenceInCalendarDays(endDate, startDate);

    if (dayDifference < 3) { // Limit the date range to 3 days
      setDateRange([item.selection]);
      if (startDate && endDate) {
        setShowDateRangePicker(false); // Close date range picker when both dates are selected
      }
    } else {
      setShowToast({ error: true, label: 'You can only select a date range of up to 3 days.' });
    }
  };

  const handleSearch = () => {
    if ((selectedHall.code && dateRange[0].startDate && dateRange[0].endDate && hallCode.code) || (dateRange[0].startDate && dateRange[0].endDate && selectedHall.code)) {
      refetch(); // Fetch data using refetch
    } else {
      setShowToast({ error: true, label: 'Please select either Community Hall Name with Date or both.' });
    }
  };

  const handleBookClick = () => {
    if (!isCheckboxSelected) {
      setShowToast({ error: true, label: 'Please select at least one hall slot to book.' });
    } else {
      goNext();
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(null);
      }, 1500); // Close toast after 1.5 seconds

      return () => clearTimeout(timer); // Clear timer on cleanup
    }
  }, [showToast]);

  return (
    <React.Fragment>
      {window.location.href.includes("/citizen")}
      <FormStep
        config={config}
        onSelect={goNext}
        onSkip={onSkip}
        t={t}
      >
        <CardHeader>{`${t("CHB_SEARCH_COMMUNITY_HALL_HEADER")}`}/{`${t("CHB_PARK")}`}</CardHeader>
        <div>
          <CardLabel>{`${t("CHB_SELECT_HALL_NAME")}`} <span style={{ color: 'red' }}>*</span></CardLabel>
          <div style={{ display: "flex", flexDirection: "row", gap: "10px"}}>
            <Controller
              control={control}
              name={"selectedHall"}
              defaultValue={selectedHall}
              rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
              render={(props) => (
                <Dropdown
                  className="form-field"
                  selected={selectedHall}
                  select={setSelectedHall}
                  placeholder={"Select Community Hall"}
                  option={HallName}
                  optionKey="i18nKey"
                  t={t}
                />
              )}
            />
            <div onClick={handleViewReportClick} style={{ cursor: "pointer",display: "flex", marginTop:"10px"}}>
              <InfoIcon/>
              {showDetails &&(
              <ChbCommunityHallDetails hallId={selectedHall.communityHallId} />
              )}
            </div>
          </div>
          <div className="filter-label"><CardLabel>{`${t("CHB_SELECT_DATE")}`} <span style={{ color: 'red' }}>*</span></CardLabel></div>
          <div className="employee-select-wrap" style={{ width: "50%" }}>
            <div className="select">
              <input
                className="employee-select-wrap--elipses"
                type="text"
                placeholder={"Select Date"}
                value={
                  dateRange[0].startDate && dateRange[0].endDate
                    ? `${format(dateRange[0].startDate, 'dd/MM/yyyy')} - ${format(dateRange[0].endDate, 'dd/MM/yyyy')}`
                    : ""
                }
                readOnly
              />
             <Calender
              className="cursorPointer calendar-icon"
              onClick={(e) => {
                e.stopPropagation();  // Prevent the event from bubbling up to the document
                setShowDateRangePicker((prevState) => !prevState);
              }}
            />
            </div>
            {showDateRangePicker && (
              <div ref={dateRangePickerRef} className="date-range-picker-wrapper">
                <DateRangePicker
                  className="pickerShadow"
                  ranges={dateRange}
                  onChange={handleDateRangeChange}
                  showSelectionPreview={true}
                  rangeColors={["#9E9E9E"]}
                  moveRangeOnFirstSelection={false}
                  staticRanges={staticRanges}
                  inputRanges={[]}
                  placeholder={"Select Community Hall"}
                  minDate={addDays(new Date(), 1)}  // This sets the minimum date to tomorrow
                />
              </div>
            )}
          </div>
          <CardLabel>{`${t("CHB_HALL_CODE")}`}</CardLabel>
          <Controller
            control={control}
            name={"hallCode"}
            defaultValue={hallCode}
            rules={{ required: t("CORE_COMMON_REQUIRED_ERRMSG") }}
            render={(props) => (
              <Dropdown
                className="form-field"
                selected={hallCode}
                select={setHallCode}
                option={hallCodeId}
                placeholder={"Select Hall Code"}
                optionKey="i18nKey"
                t={t}
              />
            )}
          />
        </div>
        <div>
          <SubmitBar label={t("ES_COMMON_SEARCH")} onSubmit={handleSearch} />
          <SubmitBar label={t("CHB_BOOK")} onSubmit={handleBookClick} style={{ margin: "20px" }} disabled={!isCheckboxSelected} />
        </div>
      </FormStep>
      {showTable && ( // Only show table when showTable is true
       <Card>
         <ApplicationTable
           t={t}
           data={data}
           columns={enhancedColumns}
           getCellProps={(cellInfo) => ({
             style: {
               minWidth: "140px",
               padding: "20px",
               fontSize: "16px",
             },
           })}
           isPaginationRequired={false}
           totalRecords={data.length}
         />
         </Card>
        )}
      {showToast && (
        <Toast
          error={showToast.error}
          warning={showToast.warning}
          label={t(showToast.label)}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default CommunityHallSearch;
