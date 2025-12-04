import React from "react";
import { useState, useEffect } from "react";
import AudioRecorder from "../features/recordings/components/AudioRecorder";
import WaveAnimation from "../features/recordings/components/WaveAnimation";
import Header from "../features/Header/Header";
import "./OnboardingPage.css";
import RecordingCard from "../features/recordings/components/RecordingCard";
import { useTranslation } from "react-i18next";

function OnboardingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const { t } = useTranslation();

  const scrollToRecord = (e) => {
    e.preventDefault();
    const recordSection = document.getElementById("record");
    recordSection?.scrollIntoView({ behavior: "smooth" });
  };

  const handleRecordingStart = () => {
    setAnalysisResult(null);
    setIsRecording(true);
  };

  useEffect(() => {
    const prompts = t("onboarding.prompts", { returnObjects: true });
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
  }, [t]);

  return (
    <div className="container">
      <Header />
      <div className="gradient-ball"></div>
      <div className="gradient-ball-2"></div>
      <div className="gradient-ball-3"></div>
      <div className="gradient-ball-4"></div>
      <div className="gradient-ball-5"></div>

      <header className="main-header">
        <p className="logo0">{t("onboarding.tagline")}</p>
        <h1 className="logo">{t("onboarding.title")}</h1>
        <p className="subtitle">{t("onboarding.subtitle")}</p>
      </header>

      <section className="features">
        <div className="card">
          <h3>{t("onboarding.features.journaling.title")}</h3>
          <p>{t("onboarding.features.journaling.subtitle")}</p>
          <p>{t("onboarding.features.journaling.description")}</p>{" "}
        </div>
        <div className="card">
          <h3>{t("onboarding.features.analysis.title")}</h3>
          <p>{t("onboarding.features.analysis.subtitle")}</p>
          <p>{t("onboarding.features.analysis.description")}</p>{" "}
        </div>
        <div className="card">
          <h3>{t("onboarding.features.calendar.title")}</h3>
          <p>{t("onboarding.features.calendar.subtitle")}</p>
          <p>{t("onboarding.features.calendar.description")}</p>{" "}
        </div>
      </section>

      <div className="cta-button">
        <button className="try-now-btn" onClick={scrollToRecord}>
          {t("onboarding.cta")}
        </button>
      </div>

      <section className="try-block">
        <div className="Instr">
          <h2>{t("onboarding.trySection.title")}</h2>
          <p>{t("onboarding.trySection.description")}</p>
        </div>
        <div className="how-works">
          <h2>{t("onboarding.howItWorks.title")}</h2>
          <h4>{t("onboarding.howItWorks.record.title")}</h4>
          <p>{t("onboarding.howItWorks.record.description")}</p>{" "}
          <h4>{t("onboarding.howItWorks.analyze.title")}</h4>
          <p>{t("onboarding.howItWorks.analyze.description")}</p>{" "}
        </div>
      </section>

      <div id="record" className="record-section-container">
        <div className="prompt-message">
          <p>{currentPrompt}</p>
        </div>

        <AudioRecorder
          setIsRecording={setIsRecording}
          onRecordingStart={handleRecordingStart}
          onResult={(result) => {
            setAnalysisResult(result);
            setTimeout(() => {
              const cardElement = document.querySelector(".recording-card");
              if (cardElement) {
                cardElement.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 300);
          }}
        />

        {analysisResult && <RecordingCard result={analysisResult} />}
      </div>
      <WaveAnimation className="wave-container" isRecording={isRecording} />
    </div>
  );
}

export default OnboardingPage;
