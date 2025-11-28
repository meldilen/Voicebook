import { useTranslation } from "react-i18next";

const MoodIcon = ({ mood }) => {
  const { t } = useTranslation();

  const moodOptions = [
    { value: 'joy', emoji: '😊', label: t("moodIcon.labels.joy"), color: '#2ed573' },
    { value: 'surprise', emoji: '😲', label: t("moodIcon.labels.surprise"), color: '#2ed573' },
    { value: 'sadness', emoji: '😢', label: t("moodIcon.labels.sadness"), color: '#bdd5ee' },
    { value: 'fear', emoji: '😨', label: t("moodIcon.labels.fear"), color: '#bdd5ee' },
    { value: 'disgust', emoji: '🤢', label: t("moodIcon.labels.disgust"), color: '#bdd5ee' },
    { value: 'anger', emoji: '😠', label: t("moodIcon.labels.anger"), color: '#ff4757' },
    { value: 'neutral', emoji: '😐', label: t("moodIcon.labels.neutral"), color: '#ffa500' }
  ];

  const moodMap = moodOptions.reduce((acc, option) => {
    acc[option.value] = {
      emoji: option.emoji,
      label: option.label,
      color: option.color
    };
    return acc;
  }, {});

  const currentMood = moodMap[mood] || moodMap.neutral;

  return (
    <span
      className="mood-icon"
      title={currentMood.label}
      style={{ color: currentMood.color }}
    >
      {currentMood.emoji}
    </span>
  );
};

export { MoodIcon };