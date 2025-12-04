import React from "react";
import { useState, useEffect, useRef } from "react";
import AudioRecorder from "../features/recordings/components/AudioRecorder";
import WaveAnimation from "../features/recordings/components/WaveAnimation";
import RecordingCard from "../features/recordings/components/RecordingCard";
import FeedbackWidget from "../features/recordings/components/FeedbackWidget";
import Calendar from "../features/calendar/components/MoodCalendar";
import Header from "../features/Header/Header";
import BottomSheet from "../features/BottomSheet/BottomSheet";
import BottomSheetNavigator from "../features/BottomSheet/BottomSheetNavigator";
import "./HomePage.css";
import { useSetRecordingFeedbackMutation } from "../features/recordings/recordingsApi";
import { useTranslation } from "react-i18next";

function HomePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bottomSheetState, setBottomSheetState] = useState("peek");
  const resultRef = useRef(null);
  const [setFeedback] = useSetRecordingFeedbackMutation();
  const { t } = useTranslation();

  useEffect(() => {
    const prompts = t("onboarding.prompts", { returnObjects: true });
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
  }, [t]);

  useEffect(() => {
    const prompts = t("onboarding.prompts", { returnObjects: true });
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);

    // Хоткей ctr + b для открытия bottom sheet на десктопе
    const handleKeyPress = (e) => {
      if (e.key === "b" && e.ctrlKey) {
        setBottomSheetState((prev) => {
          if (prev === "peek" || prev === "closed") {
            return "full";
          } else {
            return "peek";
          }
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [t]);

  const handleBottomSheetToggle = () => {
    if (bottomSheetState === "peek" || bottomSheetState === "closed") {
      setBottomSheetState("full");
    } else {
      setBottomSheetState("peek");
    }
  };

  const handleBottomSheetClose = () => {
    setBottomSheetState("closed");
  };

  const handleBottomSheetOpen = () => {
    setBottomSheetState("full");
  };

  useEffect(() => {
    if (analysisResult && resultRef.current) {
      setTimeout(() => {
        const yOffset = -120;
        const y =
          resultRef.current.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 100);
    }
  }, [analysisResult]);

  const handleRecordingStart = () => {
    setAnalysisResult(null);
    setShowFeedback(false);
    setIsRecording(true);
  };

  const handleFeedbackSubmit = async (rating) => {
    try {
      if (!analysisResult?.record_id) {
        console.error(t("home.feedback.error"));
        return;
      }

      await setFeedback({
        recordId: analysisResult.record_id,
        feedback: rating,
      }).unwrap();
      
      console.log(t("home.feedback.success"));
    } catch (error) {
      console.error(t("home.feedback.error"), error);
    }
  };

  return (
    <div className={`home-page ${showCalendar ? "calendar-mode" : ""}`}>
      <div className="gradient-ball"></div>
      <div className="gradient-ball-2"></div>
      <div className="gradient-ball-3"></div>
      <div className="gradient-ball-4"></div>
      <div className="gradient-ball-5"></div>

      <Header
        onCalendarToggle={() => setShowCalendar(!showCalendar)}
        availableRecordings={5}
        emocoinsBalance={150}
        onBottomSheetToggle={handleBottomSheetToggle}
      />

      <div className="home-content">
        <h1 className="main-title">{t("home.title")}</h1>
        <p className="subtitle">{t("home.subtitle")}</p>

        <div className="prompt-section">
          <p className="prompt-message">{currentPrompt}</p>
          <AudioRecorder
            setIsRecording={setIsRecording}
            onRecordingStart={handleRecordingStart}
            onResult={(result) => {
              setAnalysisResult(result);
              setShowFeedback(true);
            }}
          />
        </div>
      </div>

      <WaveAnimation className="wave-container" isRecording={isRecording} />

      {analysisResult && (
        <div ref={resultRef} className="result-container">
          <RecordingCard result={analysisResult} />
          {showFeedback && <FeedbackWidget onSubmit={handleFeedbackSubmit} />}
        </div>
      )}

      <BottomSheet
        isOpen={bottomSheetState === "full"}
        isPeek={bottomSheetState === "peek"}
        onClose={handleBottomSheetClose}
        onOpen={handleBottomSheetOpen}
        onTogglePeek={() =>
          setBottomSheetState(bottomSheetState === "peek" ? "full" : "peek")
        }
      >
        <BottomSheetNavigator />
      </BottomSheet>

      {showCalendar && (
        <div className="calendar-slide-panel">
          <button
            className="close-btn"
            onClick={() => setShowCalendar(false)}
            aria-label={t("home.calendar.close")}
          >
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
          <div className="calendar-container">
            <Calendar />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;