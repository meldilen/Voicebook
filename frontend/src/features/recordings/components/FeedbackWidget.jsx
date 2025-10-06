import React, { useState } from "react";
import "./FeedbackWidget.css";
import { useTranslation } from "react-i18next";

const FeedbackWidget = ({ onSubmit }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { t } = useTranslation();

  const ratings = [
    { value: 1, emoji: "😠", label: t("feedback.ratings.veryPoor") },
    { value: 2, emoji: "😕", label: t("feedback.ratings.poor") },
    { value: 3, emoji: "😐", label: t("feedback.ratings.average") },
    { value: 4, emoji: "🙂", label: t("feedback.ratings.good") },
    { value: 5, emoji: "😊", label: t("feedback.ratings.excellent") },
  ];

  const handleRatingClick = (rating) => {
    setSelectedRating(rating);
    onSubmit(rating);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="feedback-container">
        <div className="thank-you-message">{t("feedback.thankYou")}</div>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <h3>{t("feedback.title")}</h3>
      <p className="instruction">{t("feedback.instruction")}</p>
      <div className="rating-container">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            className={`rating-option ${
              (hoverRating || selectedRating) >= rating.value ? "active" : ""
            }`}
            onMouseEnter={() => setHoverRating(rating.value)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => handleRatingClick(rating.value)}
            aria-label={rating.label}
          >
            <span className="emoji">{rating.emoji}</span>
            <span className="label">{rating.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeedbackWidget;
