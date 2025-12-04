import React from "react";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useGetRecordingsQuery } from "../features/recordings/recordingsApi";
import { useSelector } from "react-redux";
import "./JournalPage.css";
import FilterControls from "../features/journal/components/FilterControls";
import Header from "../features/Header/Header";
import RecordingsList from "../features/recordings/components/RecordingsList";

function JournalPage() {
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
    setExpandedRecord((prev) => (prev === recordId ? null : recordId));
  }, []);

  if (isLoading || isFetching) {
    return (
      <>
        <Header />
        <div className="journal-page loading">
          <div className="gradient-ball"></div>
          <div className="gradient-ball-2"></div>
          <div className="gradient-ball-3"></div>
          <div className="gradient-ball-4"></div>
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
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Header />
        <div className="journal-page error">
          <p>{t("journal.error.message")}</p>
          {error && <p>{t("journal.error.details")} {error.message}</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="journal-page">
        <div className="gradient-ball"></div>
        <div className="gradient-ball-2"></div>
        <div className="gradient-ball-3"></div>
        <div className="gradient-ball-4"></div>

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

        <RecordingsList
          recordings={recordings}
          expandedRecord={expandedRecord}
          toggleExpandRecord={toggleExpandRecord}
        />
      </div>
    </>
  );
}

export default JournalPage;