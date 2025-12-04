import React from "react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useGetRecordingsQuery } from "../features/recordings/recordingsApi";
import { useSelector } from "react-redux";
import "./JournalTab.css";
import FilterControls from "../features/journal/components/FilterControls";
import RecordingsList from "../features/recordings/components/RecordingsList";

function JournalTab() {
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const [dateFilter, setDateFilter] = useState("");
  const [limitFilter, setLimitFilter] = useState(0);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const {
    data: recordings = [],
    isLoading,
    isError,
    isFetching,
    error,
  } = useGetRecordingsQuery(
    {
      skip: 0,
      limit: limitFilter || 100,
      start_date: dateFilter ? new Date(dateFilter).toISOString() : undefined,
    },
    { skip: !user?.id, refetchOnMountOrArgChange: true }
  );

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleLimitChange = (e) => {
    setLimitFilter(Number(e.target.value));
  };

  const toggleExpandRecord = useCallback((recordId) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId);
  }, []);

  const removeDateFilter = () => setDateFilter("");
  const removeLimitFilter = () => setLimitFilter(0);

  const hasActiveFilters = dateFilter || limitFilter > 0;

  if (isLoading || isFetching) {
    return (
      <div className="journal-tab loading">
        <div className="dots-loading">
          <div
            className="dot"
            style={{ "--delay": "0s", "--color": "#653c45" }}
          ></div>
          <div
            className="dot"
            style={{ "--delay": "0.2s", "--color": "#7a4b56" }}
          ></div>
          <div
            className="dot"
            style={{ "--delay": "0.4s", "--color": "#cac1f9" }}
          ></div>
        </div>
        <p>{t("journal.loading")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="journal-tab error">
        <p>{t("journal.error.message")}</p>
        {error && <p>{t("journal.error.details")} {error.message}</p>}
      </div>
    );
  }

  return (
    <div className="journal-tab">
      <div className="journal-header">
        <h1>{t("journal.title")}</h1>
        <p>{t("journal.subtitle")}</p>
      </div>

      <FilterControls
        dateFilter={dateFilter}
        limitFilter={limitFilter}
        onDateChange={handleDateChange}
        onLimitChange={handleLimitChange}
      />

      {hasActiveFilters && (
        <div className="active-filters">
          {dateFilter && (
            <span className="filter-tag">
              {t("journal.filters.date")}: {dateFilter}
              <button onClick={removeDateFilter}>×</button>
            </span>
          )}
          {limitFilter > 0 && (
            <span className="filter-tag">
              {t("journal.filters.limit")}: {limitFilter} {t("journal.filters.records")}
              <button onClick={removeLimitFilter}>×</button>
            </span>
          )}
        </div>
      )}

      {recordings.length > 0 && (
        <div className="results-counter">
          {t("journal.results.showing")} {recordings.length}{" "}
          {recordings.length === 1 
            ? t("journal.results.recording") 
            : t("journal.results.recordings")
          }
          {dateFilter && ` ${t("journal.results.forDate")} ${dateFilter}`}
          {limitFilter > 0 && ` ${t("journal.results.limitedTo")} ${limitFilter}`}
        </div>
      )}

      <RecordingsList 
        recordings={recordings}
        expandedRecord={expandedRecord}
        toggleExpandRecord={toggleExpandRecord}
      />
    </div>
  );
}

export default JournalTab;