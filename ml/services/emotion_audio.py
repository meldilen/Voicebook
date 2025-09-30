import librosa
import torch
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

class EmotionRecognitionModel:
    MODEL_ID = "firdhokk/speech-emotion-recognition-with-openai-whisper-large-v3"

    def __init__(self):
        self.model = AutoModelForAudioClassification.from_pretrained(self.MODEL_ID)
        self.feature_extractor = AutoFeatureExtractor.from_pretrained(self.MODEL_ID, do_normalize=True)

    def get_emotion(self, audio_path: str) -> str:
        audio, sr = librosa.load(audio_path, sr=self.feature_extractor.sampling_rate)
        inputs = self.feature_extractor(audio, sampling_rate=sr, return_tensors="pt")

        with torch.no_grad():
            outputs = self.model(**inputs)

        predicted_id = torch.argmax(outputs.logits, dim=-1).item()
        return self.model.config.id2label[predicted_id]
