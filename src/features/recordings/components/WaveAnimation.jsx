import React, { useEffect, useRef } from "react";
import "./WaveAnimation.css";

const WaveAnimation = ({ isRecording }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const smoothVolumeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = 250;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const initAudioAnalyzer = async () => {
      
      try {
        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          await audioContextRef.current.close();
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = stream;

       audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

if (
  !audioContextRef.current ||
  typeof audioContextRef.current.createAnalyser !== 'function'
) {
  throw new Error("Invalid AudioContext instance");
}

analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.6;

        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        sourceRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        smoothVolumeRef.current = 0;
      } catch (err) {
        console.error("Error initializing audio analyzer:", err);
      }
    };

    const drawWaves = () => {
      if (!analyserRef.current) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      let instantVolume = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        instantVolume += dataArrayRef.current[i];
      }
      instantVolume = instantVolume / dataArrayRef.current.length / 255;

      smoothVolumeRef.current =
        smoothVolumeRef.current * 0.7 + instantVolume * 0.3;
      const volume = smoothVolumeRef.current;

      ctx.clearRect(0, 0, width, height);

      const waves = [
        {
          color: "rgba(180, 70, 255, 0.9)", 
          baseAmplitude: 90, 
          frequency: 0.02,
          speed: 0.3,
          offset: 0,
          audioResponse: 1.8, 
          smoothing: 0.2,
        },
        {
          color: "rgba(140, 30, 255, 0.7)",
          baseAmplitude: 70,
          frequency: 0.03,
          speed: 0.5,
          offset: 30,
          audioResponse: 1.5,
          smoothing: 0.3,
        },
        {
          color: "rgba(100, 0, 200, 0.6)",
          baseAmplitude: 50,
          frequency: 0.04,
          speed: 0.7,
          offset: 60,
          audioResponse: 1.2,
          smoothing: 0.4,
        },
      ];

      const time = Date.now() / 1000;

      waves.forEach((wave) => {
        ctx.beginPath();

        const points = [];
        const segments = 80;

        for (let i = 0; i <= segments; i++) {
          const x = (i / segments) * width;

          const freqPos = Math.floor(
            (i / segments) * dataArrayRef.current.length
          );
          const freqValue = dataArrayRef.current[freqPos] / 255;

          const amplitude =
            wave.baseAmplitude * (1 + volume * wave.audioResponse);

          const waveValue =
            Math.sin(x * wave.frequency + time * wave.speed + wave.offset) *
            amplitude *
            (0.4 + freqValue * 0.6);

          const y = centerY + waveValue;
          points.push({ x, y });
        }

        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const ctrlX = (prev.x + curr.x) / 2;
          const ctrlY = (prev.y + curr.y) / 2;
          ctx.quadraticCurveTo(ctrlX, ctrlY, curr.x, curr.y);
        }

        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.shadowBlur = 10 + volume * 20;
        ctx.shadowColor = wave.color;
      });
      ctx.shadowBlur = 0;
    };

    if (isRecording) {
      initAudioAnalyzer().then(() => {
        const animate = () => {
          drawWaves();
          animationRef.current = requestAnimationFrame(animate);
        };
        animate();
      });
    } else {
      const cleanup = async () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }

        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          try {
            await audioContextRef.current.close();
          } catch (e) {
            // console.log("AudioContext close error:", e);
          }
        }

        analyserRef.current = null;
        dataArrayRef.current = null;
        smoothVolumeRef.current = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };

      cleanup();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [isRecording]);

  return <canvas ref={canvasRef} className="wave-canvas" />;
};

export default WaveAnimation;
