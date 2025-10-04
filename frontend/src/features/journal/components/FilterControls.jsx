import "./FilterControls.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useState, useEffect, useRef } from "react";

function FilterControls({ dateFilter, limitFilter, onDateChange, onLimitChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const handleDateChange = useCallback(
    (date) => {
      const formattedDate = date ? date.toISOString().split("T")[0] : "";
      onDateChange({ target: { value: formattedDate } });
    },
    [onDateChange]
  );

  const handleReset = () => {
    onDateChange({ target: { value: "" } });
    onLimitChange({ target: { value: 0 } });
  };

  const handleQuickFilter = (days) => {
    if (days === 0) {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      onDateChange({ target: { value: formattedDate } });
    } else {
      const date = new Date();
      date.setDate(date.getDate() - days);
      const formattedDate = date.toISOString().split("T")[0];
      onDateChange({ target: { value: formattedDate } });
    }
  };

  const getQuickFilterActiveState = (days) => {
    if (!dateFilter) return false;

    const today = new Date();
    const filterDate = new Date(dateFilter);

    if (days === 0) {
      return today.toISOString().split("T")[0] === dateFilter;
    } else {
      const expectedDate = new Date();
      expectedDate.setDate(today.getDate() - days);
      return expectedDate.toISOString().split("T")[0] === dateFilter;
    }
  };

  const hasActiveFilters = dateFilter || limitFilter > 0;

  const options = [
    { value: 0, label: "All records" },
    { value: 5, label: "5 records" },
    { value: 10, label: "10 records" },
    { value: 15, label: "15 records" },
  ];

  const selectedOption = options.find((o) => o.value === Number(limitFilter));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="filter-controls">
      <div className="quick-filters">
        <button
          className={`quick-filter-btn ${getQuickFilterActiveState(0) ? "active" : ""}`}
          onClick={() => handleQuickFilter(0)}
        >
          Today
        </button>
        <button
          className={`quick-filter-btn ${getQuickFilterActiveState(7) ? "active" : ""}`}
          onClick={() => handleQuickFilter(7)}
        >
          Last 7 days
        </button>
        <button
          className={`quick-filter-btn ${getQuickFilterActiveState(30) ? "active" : ""}`}
          onClick={() => handleQuickFilter(30)}
        >
          Last 30 days
        </button>
      </div>

      <div className="filter-main-controls">
        <div className="filter-group">
          <label htmlFor="date-filter">Filter by date:</label>
          <div className="datepicker-wrapper">
            <DatePicker
              id="date-filter"
              selected={dateFilter ? new Date(dateFilter) : null}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select date or use quick filters"
              className="custom-datepicker-input"
              popperClassName="custom-datepicker-popper"
              popperPlacement="bottom-start"
              showPopperArrow={false}
              isClearable
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="limit-filter">Show last:</label>
          <div className="select-wrapper" ref={selectRef}>
            <div
              className={`custom-select ${isOpen ? "open" : ""}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedOption?.label || "Select..."}
              <span className="select-arrow"></span>
            </div>
            {isOpen && (
              <div className="custom-options">
                {options.map((opt) => (
                  <div
                    key={opt.value}
                    className={`custom-option ${opt.value === Number(limitFilter) ? "active" : ""}`}
                    onClick={() => {
                      onLimitChange({ target: { value: opt.value } });
                      setIsOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <button className="reset-filters-btn" onClick={handleReset}>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterControls;
