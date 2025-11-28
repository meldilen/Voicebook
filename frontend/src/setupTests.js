import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Настройка i18n для тестов
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      feedback: {
        title: 'Feedback',
        instruction: 'Rate your experience',
        thankYou: 'Thank you!',
        ratings: {
          veryPoor: 'Very Poor',
          poor: 'Poor',
          average: 'Average',
          good: 'Good',
          excellent: 'Excellent'
        }
      },
      audioRecorder: {
        microphoneBlocked: {
          title: 'Microphone Blocked',
          message: 'Please allow microphone access'
        },
        analyzing: 'Analyzing...',
        clickToStart: 'Click to start',
        microphonePermission: 'Microphone permission required',
        deleteConfirmation: {
          title: 'Delete Recording',
          message: 'Are you sure?'
        },
        buttons: {
          delete: 'Delete',
          save: 'Save',
          cancel: 'Cancel'
        },
        ariaLabels: {
          startRecording: 'Start recording',
          stopRecording: 'Stop recording',
          pauseRecording: 'Pause recording',
          resumeRecording: 'Resume recording',
          deleteRecording: 'Delete recording',
          saveRecording: 'Save recording'
        }
      },
      header: {
        achievements: 'Achievements',
        profile: 'Profile',
        calendar: 'Calendar',
        journal: 'Journal',
        record: 'Record',
        menu: 'Menu',
        progress: 'Progress',
        day: 'Day',
        login: 'Login',
        signUp: 'Sign Up'
      }
    }
  }
});

// Настройка Testing Library
configure({ testIdAttribute: 'data-testid' });