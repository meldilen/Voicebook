import { useState, useCallback } from "react";
import { useGetRecordingsQuery } from "../features/recordings/recordingsApi";
import { useSelector } from "react-redux";
import "./JournalTab.css";
import FilterControls from "../features/journal/components/FilterControls";
import RecordingsList from "../features/recordings/components/RecordingsList";

function JournalTab() {
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
    { userId: user?.ID, date: dateFilter, limit: limitFilter },
    { skip: !user?.ID, refetchOnMountOrArgChange: true }
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
        <p>Loading your journal entries...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="journal-tab error">
        <p>Error loading journal entries. Please try again.</p>
        {error && <p>Details: {error.message}</p>}
      </div>
    );
  }

  return (
    <div className="journal-tab">
      <div className="journal-header">
        <h1>Your Journal</h1>
        <p>Review your past recordings and insights</p>
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
  );
}

export default JournalTab;