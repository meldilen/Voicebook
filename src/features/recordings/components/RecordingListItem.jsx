import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import "./RecordingListItem.css";
import { useDeleteRecordingMutation } from "../recordingsApi";
import { useGenerateCalendarDayMutation } from "../../calendar/calendarApi";

function RecordingListItem({ recording, isExpanded, onToggleExpand }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRecording] = useDeleteRecordingMutation();
  const [generateCalendarDay] = useGenerateCalendarDayMutation();
  const { t } = useTranslation();

  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formattedDate = recording.created_at
    ? format(new Date(recording.created_at), "MMM d, yyyy - h:mm a")
    : t("common.unknownDate", "Unknown date");

  const handleDelete = async () => {
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const recordDate = recording.created_at
        ? parseISO(recording.created_at)
        : new Date();

      const zonedDate = toZonedTime(recordDate, userTimeZone);
      const utcDate = format(zonedDate, "yyyy-MM-dd");

      await deleteRecording(recording.id).unwrap();
      
      try {
        await generateCalendarDay({
          date: utcDate,
        }).unwrap();
      } catch (calendarError) {
        console.warn("Calendar stats regeneration failed:", calendarError);
      }

      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to delete recording:", err);
    }
  };

  const renderInsightSection = (title, content, renderFn) => {
    if (!content || (Array.isArray(content) && content.length === 0))
      return null;
    return (
      <div className="detail-section">
        <h4>
          <span className="section-icon">
            {title === t("recordingListItem.sections.emotionalAnalysis") && "🧠"}
            {title === t("recordingListItem.sections.physicalResponse") && "💪"}
            {title === t("recordingListItem.sections.copingStrategies") && "🛡️"}
            {title === t("recordingListItem.sections.recommendations") && "💡"}
          </span>
          {title}
        </h4>
        {renderFn(content)}
      </div>
    );
  };

  const hasCopingStrategies = (strategies) => {
    return strategies?.effective || strategies?.ineffective;
  };

  const renderInsights = () => {
    const insights = recording.insights || {};

    return (
      <>
        {renderInsightSection(
          t("recordingListItem.sections.emotionalAnalysis"),
          insights.emotional_dynamics || insights.emotion,
          (content) => (
            <div className="insight-card">
              <p>
                {capitalizeFirst(content) ||
                  t("recordingListItem.noData.emotionalDynamics")}
              </p>
              {insights.key_triggers?.length > 0 && (
                <div className="insight-subsection">
                  <h5>{t("recordingListItem.insights.keyTriggers")}</h5>
                  <ul>
                    {insights.key_triggers.map((trigger, index) => (
                      <li key={index}>{capitalizeFirst(trigger)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}

        {renderInsightSection(
          t("recordingListItem.sections.physicalResponse"),
          insights.physical_reaction,
          (reaction) => (
            <div className="insight-card">
              <p>
                {capitalizeFirst(reaction) ||
                  t("recordingListItem.noData.physicalReaction")}
              </p>
            </div>
          )
        )}

        {hasCopingStrategies(insights.coping_strategies) &&
          renderInsightSection(
            t("recordingListItem.sections.copingStrategies"),
            insights.coping_strategies,
            (strategies) => (
              <div className="strategy-container">
                {strategies.effective && (
                  <div className="strategy-card effective">
                    <div className="strategy-header">
                      <span className="strategy-icon">✅</span>
                      <h5>{t("recordingListItem.copingStrategies.effective")}</h5>
                    </div>
                    <p>{capitalizeFirst(strategies.effective)}</p>
                  </div>
                )}
                {strategies.ineffective && (
                  <div className="strategy-card ineffective">
                    <div className="strategy-header">
                      <span className="strategy-icon">❌</span>
                      <h5>{t("recordingListItem.copingStrategies.ineffective")}</h5>
                    </div>
                    <p>{capitalizeFirst(strategies.ineffective)}</p>
                  </div>
                )}
              </div>
            )
          )}

        {insights.recommendations?.length > 0 &&
          renderInsightSection(
            t("recordingListItem.sections.recommendations"),
            insights.recommendations,
            (recommendations) => (
              <div className="recommendations-card">
                <ol>
                  {recommendations.map((rec, index) => (
                    <li key={index}>{capitalizeFirst(rec)}</li>
                  ))}
                </ol>
              </div>
            )
          )}
      </>
    );
  };

  return (
    <div
      className={`recording-item ${isExpanded ? "expanded" : ""}`}
      aria-expanded={isExpanded}
    >
      <div className="recording-header" onClick={onToggleExpand}>
        <svg
          className="expand-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="recording-summary">
          <div className="recording-meta">
            <span
              className={`emotion-badge ${recording.emotion?.toLowerCase()}`}
            >
              {t(`emotions.${recording.emotion}`, recording.emotion)}
            </span>
            <span className="date">{formattedDate}</span>
            {recording.feedback !== undefined &&
              recording.feedback !== null && (
                <span className="feedback">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`star ${
                        i < recording.feedback ? "filled" : ""
                      }`}
                    >
                      {i < recording.feedback ? "★" : "☆"}
                    </span>
                  ))}
                </span>
              )}
          </div>
          <div className="recording-preview">
            <p>{capitalizeFirst(recording.summary)}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="recording-details">
          {renderInsights()}

          <div className="buttons">
            <button
              className="delete"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("recordingListItem.buttons.delete")}
            </button>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>{t("recordingListItem.deleteConfirmation.title")}</h3>
            <p>
              {t("recordingListItem.deleteConfirmation.message")}
            </p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("recordingListItem.buttons.cancel")}
              </button>
              <button className="confirm-delete-button" onClick={handleDelete}>
                {t("recordingListItem.buttons.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordingListItem;