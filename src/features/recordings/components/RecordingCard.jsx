import React from "react";
import "./RecordingCard.css";
import { useTranslation } from "react-i18next";

function RecordingCard({ result }) {
  const { t } = useTranslation();

  if (!result) return null;

  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formattedDate = new Date(result.created_at).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const renderInsightSection = (title, content, renderFn) => {
    if (!content || (Array.isArray(content) && content.length === 0))
      return null;
    return (
      <div className="card-section">
        <h3>
          <span className="section-icon">
            {title === t("recordingCard.sections.emotionalAnalysis") && "🧠"}
            {title === t("recordingCard.sections.physicalResponse") && "💪"}
            {title === t("recordingCard.sections.copingStrategies") && "🛡️"}
            {title === t("recordingCard.sections.support") && "🤝"}
            {title === t("recordingCard.sections.recommendations") && "💡"}
          </span>
          {title}
        </h3>
        {renderFn(content)}
      </div>
    );
  };

  const hasCopingStrategies = (strategies) => {
    return strategies?.effective || strategies?.ineffective;
  };

  return (
    <div className="recording-card">
      <div className="card-header">
        <h2>{t("recordingCard.title")}</h2>
        <span
          className={`emotion-pill ${
            ["joy", "surprise"].includes(result.emotion)
              ? "positive"
              : ["sadness", "fear", "disgust"].includes(result.emotion)
              ? "negative"
              : ["anger"].includes(result.emotion)
              ? "aggressive"
              : "neutral"
          }`}
        >
          {t(`emotions.${result.emotion}`, result.emotion)}
        </span>
      </div>

      <div className="card-section">
        <h3>{t("recordingCard.sections.summary")}</h3>
        <p className="summary-text">{capitalizeFirst(result.summary)}</p>
      </div>

      {result.insights ? (
        <>
          {renderInsightSection(
            t("recordingCard.sections.emotionalAnalysis"),
            result.insights.emotional_dynamics,
            (content) => (
              <div className="insights-grid">
                <div className="insight-item">
                  <h4>📈 {t("recordingCard.insights.pattern")}</h4>
                  <p>
                    {capitalizeFirst(content) ||
                      t("recordingCard.noData.pattern")}
                  </p>
                </div>
                {result.insights.key_triggers?.length > 0 && (
                  <div className="insight-item">
                    <h4>🔑 {t("recordingCard.insights.keyTriggers")}</h4>
                    <ul>
                      {result.insights.key_triggers.map((trigger, index) => (
                        <li key={index}>{capitalizeFirst(trigger)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}

          {renderInsightSection(
            t("recordingCard.sections.physicalResponse"),
            result.insights.physical_reaction,
            (support) => (
              <div className="physical-response">
                <p>
                  {capitalizeFirst(support) ||
                    t("recordingCard.noData.physicalReaction")}
                </p>
              </div>
            )
          )}

          {hasCopingStrategies(result.insights.coping_strategies) && (
            <div className="card-section">
              <h3>{t("recordingCard.sections.copingStrategies")}</h3>
              <div className="strategy-boxes">
                {result.insights.coping_strategies.effective && (
                  <div className="strategy successful">
                    <h4>✅ {t("recordingCard.copingStrategies.effective")}</h4>
                    <p>
                      {capitalizeFirst(
                        result.insights.coping_strategies.effective
                      )}
                    </p>
                  </div>
                )}
                {result.insights.coping_strategies.ineffective && (
                  <div className="strategy unsuccessful">
                    <h4>❌ {t("recordingCard.copingStrategies.ineffective")}</h4>
                    <p>{capitalizeFirst(result.insights.coping_strategies.ineffective)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {renderInsightSection(
            t("recordingCard.sections.support"),
            result.insights.support,
            (reaction) => (
              <div className="physical-response">
                <p>
                  {capitalizeFirst(reaction) || 
                   t("recordingCard.noData.support")}
                </p>
              </div>
            )
          )}

          {result.insights.recommendations?.length > 0 && (
            <div className="card-section">
              <h3>{t("recordingCard.sections.recommendations")}</h3>
              <ol className="recommendations-list">
                {result.insights.recommendations.map((rec, index) => (
                  <li key={index}>{capitalizeFirst(rec)}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      ) : (
        <div className="card-section">
          <p>{t("recordingCard.processing")}</p>
        </div>
      )}

      <div className="card-footer">
        <p className="record-date">
          {t("recordingCard.recorded")}: {formattedDate}
        </p>
      </div>
      <div className="watermark">{t("recordingCard.watermark")}</div>
    </div>
  );
}

export default RecordingCard;
