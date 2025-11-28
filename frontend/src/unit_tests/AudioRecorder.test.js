import React from 'react';
import { render, screen } from '@testing-library/react';
import AudioRecorder from '../features/recordings/components/AudioRecorder';

// Mock для хука
jest.mock('../features/recordings/hooks/useAudioRecorder', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock для i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

// Mock для иконок
jest.mock('react-icons/fa', () => ({
  FaMicrophone: () => <div data-testid="fa-microphone">Mic</div>,
  FaPause: () => <div data-testid="fa-pause">Pause</div>,
  FaStop: () => <div data-testid="fa-stop">Stop</div>,
  FaTrash: () => <div data-testid="fa-trash">Trash</div>,
  FaCheck: () => <div data-testid="fa-check">Check</div>,
  FaExclamationTriangle: () => <div data-testid="fa-warning">Warning</div>,
  FaPlay: () => <div data-testid="fa-play">Play</div>
}));

import useAudioRecorder from '../features/recordings/hooks/useAudioRecorder';

describe('AudioRecorder', () => {
  const mockFormatTime = jest.fn();

  beforeEach(() => {
    mockFormatTime.mockClear();
  });

  test('renders microphone button', () => {
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      permission: 'prompt',
      isLoading: false,
      showControls: false,
      formatTime: mockFormatTime
    });

    render(<AudioRecorder />);
    expect(screen.getByTestId('fa-microphone')).toBeInTheDocument();
  });

  test('shows recording controls when recording is active', () => {
    // Настраиваем formatTime чтобы возвращал нужное значение
    mockFormatTime.mockReturnValue('00:05');
    
    useAudioRecorder.mockReturnValue({
      isRecording: true,
      permission: 'granted',
      isLoading: false,
      showControls: true,
      recordTime: 5,
      formatTime: mockFormatTime
    });

    render(<AudioRecorder />);
    
    // Проверяем что элементы управления отображаются
    expect(screen.getByTestId('fa-pause')).toBeInTheDocument();
    expect(screen.getByTestId('fa-stop')).toBeInTheDocument();
    
    // Проверяем что formatTime был вызван с правильным аргументом
    expect(mockFormatTime).toHaveBeenCalledWith(5);
  });

  test('shows permission prompt initially', () => {
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      permission: 'prompt',
      isLoading: false,
      showControls: false,
      formatTime: mockFormatTime
    });

    render(<AudioRecorder />);
    expect(screen.getByText('audioRecorder.clickToStart')).toBeInTheDocument();
  });

  test('shows loading state when analyzing', () => {
    useAudioRecorder.mockReturnValue({
      isRecording: false,
      permission: 'granted',
      isLoading: true,
      showControls: false,
      formatTime: mockFormatTime
    });

    render(<AudioRecorder />);
    expect(screen.getByText('audioRecorder.analyzing')).toBeInTheDocument();
  });
});