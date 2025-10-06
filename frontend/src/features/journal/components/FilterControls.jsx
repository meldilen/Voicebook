import "./FilterControls.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCallback, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

function FilterControls({ dateFilter, limitFilter, onDateChange, onLimitChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const { t } = useTranslation();

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
    { value: 0, label: t("filterControls.options.allRecords") },
    { value: 5, label: t("filterControls.options.5records") },
    { value: 10, label: t("filterControls.options.10records") },
    { value: 15, label: t("filterControls.options.15records") },
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
          {t("filterControls.quickFilters.today")}
        </button>
        <button
          className={`quick-filter-btn ${getQuickFilterActiveState(7) ? "active" : ""}`}
          onClick={() => handleQuickFilter(7)}
        >
          {t("filterControls.quickFilters.last7days")}
        </button>
        <button
          className={`quick-filter-btn ${getQuickFilterActiveState(30) ? "active" : ""}`}
          onClick={() => handleQuickFilter(30)}
        >
          {t("filterControls.quickFilters.last30days")}
        </button>
      </div>

      <div className="filter-main-controls">
        <div className="filter-group">
          <label htmlFor="date-filter">{t("filterControls.labels.filterByDate")}</label>
          <div className="datepicker-wrapper">
            <DatePicker
              id="date-filter"
              selected={dateFilter ? new Date(dateFilter) : null}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              placeholderText={t("filterControls.placeholders.datePicker")}
              className="custom-datepicker-input"
              popperClassName="custom-datepicker-popper"
              popperPlacement="bottom-start"
              showPopperArrow={false}
              isClearable
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="limit-filter">{t("filterControls.labels.showLast")}</label>
          <div className="select-wrapper" ref={selectRef}>
            <div
              className={`custom-select ${isOpen ? "open" : ""}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {selectedOption?.label || t("filterControls.placeholders.select")}
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
            {t("filterControls.buttons.clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterControls;