import React from "react";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import RecordingListItem from "./RecordingListItem";

const RecordingsList = memo(({ recordings, expandedRecord, toggleExpandRecord }) => {
  const { t } = useTranslation();

  return (
    <div className="recordings-list">
      {recordings?.length > 0 ? (
        recordings.map((recording) => (
          <RecordingListItem
            key={recording.record_id}
            recording={recording}
            isExpanded={expandedRecord === recording.record_id}
            onToggleExpand={() => toggleExpandRecord(recording.record_id)}
          />
        ))
      ) : (
        <div className="no-records">
          <p>{t("recordingsList.noRecords")}</p>
        </div>
      )}
    </div>
  );
});

export default RecordingsList;