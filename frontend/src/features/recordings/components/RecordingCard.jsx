import "./RecordingCard.css";

function RecordingCard({ result }) {
  if (!result) return null;

  const capitalizeFirst = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formattedDate = new Date(result.record_date).toLocaleDateString(
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
            {title === "Emotional Analysis" && "🧠"}
            {title === "Physical Response" && "💪"}
            {title === "Coping Strategies" && "🛡️"}
            {title === "Support" && "🤝"}
            {title === "Recommendations" && "💡"}
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
        <h2>Your Emotional Report</h2>
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
          {result.emotion}
        </span>
      </div>

      <div className="card-section">
        <h3>Summary</h3>
        <p className="summary-text">{capitalizeFirst(result.summary)}</p>
      </div>

      {result.insights ? (
        <>
          {renderInsightSection(
            "Emotional Analysis",
            result.insights.emotional_dynamics,
            (content) => (
              <div className="insights-grid">
                <div className="insight-item">
                  <h4>📈 Pattern</h4>
                  <p>{capitalizeFirst(content) || "No pattern data available"}</p>
                </div>
                {result.insights.key_triggers?.length > 0 && (
                  <div className="insight-item">
                    <h4>🔑 Key Triggers</h4>
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
            "Physical Response",
            result.insights.physical_reaction,
            (support) => (
              <div className="physical-response">
                <p>{capitalizeFirst(support) || "No supprotive advice available"}</p>
              </div>
            )
          )}

          {hasCopingStrategies(result.insights.coping_strategies) && (
            <div className="card-section">
              <h3>Coping Strategies</h3>
              <div className="strategy-boxes">
                {result.insights.coping_strategies.effective && (
                  <div className="strategy successful">
                    <h4>✅ Effective</h4>
                    <p>{capitalizeFirst(result.insights.coping_strategies.effective)}</p>
                  </div>
                )}
                {result.insights.coping_strategies.ineffective && (
                  <div className="strategy unsuccessful">
                    <h4>❌ Ineffective</h4>
                    <p>{capitalizeFirst(result.insights.coping_strategies.ineffective)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {renderInsightSection(
            "Support",
            result.insights.support,
            (reaction) => (
              <div className="physical-response">
                <p>{capitalizeFirst(reaction) || "No physical reaction data available"}</p>
              </div>
            )
          )}

          {result.insights.recommendations?.length > 0 && (
            <div className="card-section">
              <h3>Recommendations</h3>
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
          <p>Detailed analysis is being processed...</p>
        </div>
      )}

      <div className="card-footer">
        <p className="record-date">Recorded: {formattedDate}</p>
      </div>
      <div className="watermark">AI-generated, for reference only</div>
    </div>
  );
}

export default RecordingCard;