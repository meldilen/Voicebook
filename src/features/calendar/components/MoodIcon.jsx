import React from "react";
import { useTranslation } from "react-i18next";

const MoodIcon = ({ mood }) => {
  const { t } = useTranslation();

  const moodOptions = [
    { value: 'happy', emoji: '😊', label: t("moodIcon.labels.happy"), color: '#2ed573' },
    { value: 'surprised', emoji: '😲', label: t("moodIcon.labels.surprised"), color: '#2ed573' },
    { value: 'sadness', emoji: '😢', label: t("moodIcon.labels.sadness"), color: '#bdd5ee' },
    { value: 'fearful', emoji: '😨', label: t("moodIcon.labels.fearful"), color: '#bdd5ee' },
    { value: 'disgust', emoji: '🤢', label: t("moodIcon.labels.disgust"), color: '#bdd5ee' },
    { value: 'angry', emoji: '😠', label: t("moodIcon.labels.angry"), color: '#ff4757' },
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