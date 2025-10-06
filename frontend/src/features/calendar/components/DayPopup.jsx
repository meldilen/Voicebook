import './DayPopup.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const DayPopup = ({ currentDayData, selectedDay, monthName, year }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const moodOptions = [
    { value: 'joy', label: t("dayPopup.moods.joy"), class: 'positive' },
    { value: 'surprise', label: t("dayPopup.moods.surprise"), class: 'positive' },
    { value: 'sadness', label: t("dayPopup.moods.sadness"), class: 'negative' },
    { value: 'fear', label: t("dayPopup.moods.fear"), class: 'negative' },
    { value: 'disgust', label: t("dayPopup.moods.disgust"), class: 'negative' },
    { value: 'anger', label: t("dayPopup.moods.anger"), class: 'aggressive' },
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

  return (
    <div className="voice-note-panel">
      <div className="popup-header">
        <h3>{selectedDay ? `${monthName} ${selectedDay}, ${year}` : t("dayPopup.title")}</h3>
        <div className="divider"></div>
      </div>

      {currentDayData ? (
        <div className="note-content">
          <div className="mood-section">
            <h4>{t("dayPopup.yourMood")}</h4>
            <div className="mood-display">
              <span className={`emotion-pill ${getMoodClass(currentDayData.mood)}`}>
                {getMoodLabel(currentDayData.mood)}
              </span>
            </div>
          </div>

          {currentDayData.summary && (
            <div className="summary-section">
              <h4>{t("dayPopup.dailySummary")}</h4>
              <div className="summary-text">
                <p>{currentDayData.summary}</p>
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