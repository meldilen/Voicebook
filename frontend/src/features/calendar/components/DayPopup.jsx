import './DayPopup.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { useGetCalendarDayQuery } from '../calendarApi';

const DayPopup = ({ selectedDate, dayData, onClose }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data: detailedData, isLoading } = useGetCalendarDayQuery(
    { date: selectedDate },
    { skip: !selectedDate }
  );

  const displayData = detailedData || dayData;

  const moodOptions = [
    { value: 'happy', label: t("dayPopup.moods.happy"), class: 'positive' },
    { value: 'surprised', label: t("dayPopup.moods.surprised"), class: 'positive' },
    { value: 'sadness', label: t("dayPopup.moods.sadness"), class: 'negative' },
    { value: 'fearful', label: t("dayPopup.moods.fearful"), class: 'negative' },
    { value: 'disgust', label: t("dayPopup.moods.disgust"), class: 'negative' },
    { value: 'angry', label: t("dayPopup.moods.angry"), class: 'aggressive' },
    { value: 'neutral', label: t("dayPopup.moods.neutral"), class: 'neutral' }
  ];

  const getMoodClass = (mood) => {
    const moodObj = moodOptions.find(option => option.value === mood);
    return moodObj ? moodObj.class : 'neutral';
  };

  const getMoodLabel = (mood) => {
    const moodObj = moodOptions.find(option => option.value === mood);
    return moodObj ? moodObj.label : t("dayPopup.moods.neutral");
  };

  const handleAddReflection = () => {
    navigate('/homepage');
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Если дата некорректна, парсим вручную
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          const validDate = new Date(year, month - 1, day);
          return validDate.toLocaleDateString(i18n.language, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        }
        return dateString;
      }
      return date.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <div className="voice-note-panel">
      <div className="popup-header">
        <h3>{formatDate(selectedDate)}</h3>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="divider"></div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <p>{t("dayPopup.loading")}</p>
        </div>
      ) : displayData ? (
        <div className="note-content">
          <div className="stats-overview">
            <div className="stat-item">
              <span className="stat-label">{t("dayPopup.recordsCount")}</span>
              <span className="stat-value">{displayData.records_count || 0}</span>
            </div>
          </div>

          {displayData.dominant_emotion && (
            <div className="mood-section">
              <h4>{t("dayPopup.yourMood")}</h4>
              <div className="mood-display">
                <span className={`emotion-pill ${getMoodClass(displayData.dominant_emotion)}`}>
                  {getMoodLabel(displayData.dominant_emotion)}
                </span>
              </div>
            </div>
          )}

          {displayData.daily_summary && (
            <div className="summary-section">
              <h4>{t("dayPopup.dailySummary")}</h4>
              <div className="summary-text">
                <p>{displayData.daily_summary}</p>
              </div>
            </div>
          )}

          {displayData.emotion_distribution && (
            <div className="emotion-distribution">
              <h4>{t("dayPopup.emotionDistribution")}</h4>
              <div className="emotion-bars">
                {Object.entries(displayData.emotion_distribution).map(([emotion, count]) => (
                  <div key={emotion} className="emotion-bar">
                    <span className="emotion-name">{getMoodLabel(emotion)}</span>
                    <span className="emotion-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-note">
          <p>{t("dayPopup.noData")}</p>
          <button 
            className="add-note-cta"
            onClick={handleAddReflection}
          >
            {t("dayPopup.addReflection")}
          </button>
        </div>
      )}
    </div>
  );
};

export default DayPopup;