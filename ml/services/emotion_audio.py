import librosa
import torch
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

class EmotionRecognitionModel:
    MODEL_ID = "firdhokk/speech-emotion-recognition-with-openai-whisper-large-v3"

    def __init__(self):
        try:
            self.model = AutoModelForAudioClassification.from_pretrained(self.MODEL_ID)
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.MODEL_ID, do_normalize=True)
        except Exception as e:
            print(f"Warning: Could not load emotion model: {e}")
            self.model = None
            self.feature_extractor = None

    def get_emotion(self, audio_path: str) -> str:
        if self.model is None:
            return "neutral"  # Fallback
            
        try:
            # Try to load with different approaches
            try:
                audio, sr = librosa.load(audio_path, sr=self.feature_extractor.sampling_rate)
            except Exception as e:
                print(f"Librosa load failed, trying alternative: {e}")
                # Fallback: try with default sample rate
                audio, sr = librosa.load(audio_path, sr=16000)
                # Resample if needed
                if sr != self.feature_extractor.sampling_rate:
                    audio = librosa.resample(audio, orig_sr=sr, target_sr=self.feature_extractor.sampling_rate)

            inputs = self.feature_extractor(audio, sampling_rate=self.feature_extractor.sampling_rate, return_tensors="pt")

            with torch.no_grad():
                outputs = self.model(**inputs)

            predicted_id = torch.argmax(outputs.logits, dim=-1).item()
            return self.model.config.id2label[predicted_id]
            
        except Exception as e:
            print(f"Emotion recognition error: {e}")
            return "neutral"  # Fallback to neutral on error