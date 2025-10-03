import { useRef, useEffect } from "react";
import {
  FaMicrophone,
  FaPause,
  FaStop,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaPlay,
} from "react-icons/fa";
import "./AudioRecorder.css";
import useAudioRecorder from "../hooks/useAudioRecorder";

const AudioRecorder = ({ setIsRecording, onRecordingStart, onResult }) => {
  const particlesRef = useRef(null);

  const {
    isRecording,
    isPaused,
    recordTime,
    audioBlob,
    permission,
    showControls,
    isLoading,
    showDeleteConfirm,
    isActionInProgress,
    togglePause,
    cancelRecording,
    handleDeleteClick,
    handleDeleteCancel,
    saveRecording,
    formatTime,
    handleMainButtonClick,
    stopRecording,
  } = useAudioRecorder({ setIsRecording, onRecordingStart, onResult });

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement("div");
      const particleType = Math.floor(Math.random() * 6) + 1;

      particle.className = "floating-particle";
      particle.setAttribute("data-type", particleType.toString());

      const size = Math.random() * 4 + 1;
      const opacity = Math.random() * 0.3 + 0.1;

      particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      opacity: ${opacity};
      left: ${Math.random() * 100}%;
      top: 100vh; /* Начинать снизу экрана */
      background: ${
        Math.random() > 0.5
          ? "rgba(60, 96, 101, 0.76)"
          : "rgba(199, 193, 249, 0.83)"
      };
      animation-delay: ${Math.random() * 2}s;
    `;

      container.appendChild(particle);

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 40000);
    };

    for (let i = 0; i < 20; i++) {
      createParticle();
    }

    const interval = setInterval(createParticle, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="audio-recorder-wrapper">
      <div ref={particlesRef} className="floating-particles-container"></div>

      <div className="audio-recorder-container">
        {permission === "denied" && (
          <div className="notification-banner warning">
            <FaExclamationTriangle className="banner-icon warning" />
            <div className="banner-content">
              <div className="banner-title">Microphone Access Blocked</div>
              <div className="banner-message">
                Please enable microphone access in your browser settings to use
                this feature.
              </div>
            </div>
          </div>
        )}

        <div
          className={`voice-recorder ${isRecording ? "recording" : ""} ${
            isPaused ? "paused" : ""
          }`}
        >
          <button
            className="voice-button"
            onClick={handleMainButtonClick}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            disabled={
              permission === "denied" ||
              isActionInProgress ||
              (audioBlob && !isRecording)
            }
          >
            <FaMicrophone className="voice-icon" />
          </button>
        </div>

        {isRecording && showControls && (
          <div className="recording-controls-below">
            <span className="timer">{formatTime(recordTime)}</span>
            <button
              className={`control-button pause-button ${
                isPaused ? "resume-state" : ""
              }`}
              onClick={togglePause}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? <FaPlay /> : <FaPause />}
            </button>
            <button
              className="control-button stop-button"
              onClick={stopRecording}
              aria-label="Stop recording"
            >
              <FaStop />
            </button>
          </div>
        )}

        {isLoading && (
          <div className="loading-state">
            <div className="gentle-loading">
              <div className="loading-circle"></div>
              <div className="loading-circle"></div>
              <div className="loading-circle"></div>
            </div>
            <p className="analysis-note">
              Voice recording is being analyzed...
            </p>
          </div>
        )}

        {permission === "prompt" && !isRecording && (
          <div className="permission-prompt">
            <p>Click the microphone to start recording</p>
            <small>We'll ask for microphone permission</small>
          </div>
        )}

        {audioBlob && !isRecording && !showDeleteConfirm && (
          <div className="post-recording-actions">
            <div className="action-buttons-container">
              <button
                className="action-button delete-button"
                onClick={handleDeleteClick}
                aria-label="Delete recording"
              >
                <FaTrash />
                <span className="button-label">Delete</span>
              </button>
              <button
                className="action-button save-button"
                onClick={saveRecording}
                aria-label="Save recording"
              >
                <FaCheck />
                <span className="button-label">Save</span>
              </button>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
  <div className="delete-confirmation">
    <div className="confirmation-text">
      <h3>Delete Recording?</h3>
      <p>This action cannot be undone. The recording will be permanently deleted.</p>
    </div>
    <div className="confirmation-buttons">
      <button
        className="btn btn-secondary"
        onClick={handleDeleteCancel}
      >
        Cancel
      </button>
      <button
        className="btn btn-danger"
        onClick={cancelRecording}
      >
        Delete
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default AudioRecorder;
