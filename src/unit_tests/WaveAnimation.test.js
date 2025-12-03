import React from 'react';
import { render, act } from '@testing-library/react';
import WaveAnimation from '../features/recordings/components/WaveAnimation';
import '@testing-library/jest-dom';


class MockAnalyserNode {
  constructor() {
    this.fftSize = 256;
    this.frequencyBinCount = 1024;
    this.smoothingTimeConstant = 0.6;
    this.getByteFrequencyData = jest.fn();
    this.connect = jest.fn();
  }
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.destination = {};
    this.createAnalyser = jest.fn(() => new MockAnalyserNode());
    this.createMediaStreamSource = jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
    }));
    this.close = jest.fn(() => {
      this.state = 'closed';
      return Promise.resolve();
    });
  }
}

class MockMediaStream {
  constructor() {
    this.getTracks = jest.fn(() => [{
      stop: jest.fn()
    }]);
  }
}

class MockCanvasContext {
  constructor() {
    this.clearRect = jest.fn();
    this.beginPath = jest.fn();
    this.moveTo = jest.fn();
    this.quadraticCurveTo = jest.fn();
    this.stroke = jest.fn();
    this.fill = jest.fn();
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.shadowBlur = 0;
    this.shadowColor = '';
  }
}

beforeAll(() => {
  console.error = jest.fn();
  global.AudioContext = jest.fn(() => new MockAudioContext());
  global.webkitAudioContext = jest.fn(() => new MockAudioContext());
  
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn(() => Promise.resolve(new MockMediaStream())),
  };

  HTMLCanvasElement.prototype.getContext = jest.fn(() => new MockCanvasContext());
  Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
    writable: true,
    value: 800,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
    writable: true,
    value: 200,
  });
});

describe('WaveAnimation Component', () => {
  let requestAnimationFrameSpy;
  let cancelAnimationFrameSpy;
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;

  beforeAll(() => {
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    requestAnimationFrameSpy = jest.fn((cb) => {
      setTimeout(() => cb(performance.now()), 16);
      return 1;
    });
    cancelAnimationFrameSpy = jest.fn();
    
    window.requestAnimationFrame = requestAnimationFrameSpy;
    window.cancelAnimationFrame = cancelAnimationFrameSpy;
    window.performance = { now: jest.fn(() => Date.now()) };
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
  });


  test('initializes audio when recording starts', async () => {
    await act(async () => {
      render(<WaveAnimation isRecording={true} />);
      await Promise.resolve();
    });
    
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: true
    });
    expect(AudioContext).toHaveBeenCalled();
  });



  test('handles getUserMedia error gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));
    
    await act(async () => {
      render(<WaveAnimation isRecording={true} />);
      await Promise.resolve();
    });
    
    expect(consoleError).toHaveBeenCalledWith(
      'Error initializing audio analyzer:',
      expect.any(Error)
      
    );
    console.error = jest.fn()
  });



  test('cancels animation frame on unmount', async () => {
    const { unmount } = await act(async () => {
      const utils = render(<WaveAnimation isRecording={true} />);
      await Promise.resolve();
      return utils;
    });
    
    await act(async () => {
      unmount();
    });
    
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});