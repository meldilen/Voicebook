import logging
import json

from services.stt import transcribe_audio
from services.emotion_audio import EmotionRecognitionModel
from services.emotion_utils import combine_emotions
from services.gpt import call_gpt
from config import FOLDER_ID
from utils import get_iam_token, load_prompt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_audio(audio_path: str):
    iam_token = get_iam_token()

    emotion_model = EmotionRecognitionModel()

    # транскрибация и эмоции аудио
    transcript = transcribe_audio(iam_token, audio_path)
    print(transcript)
    audio_emotion = emotion_model.get_emotion(audio_path)
    print(audio_emotion)

    # запросы к GPT
    insights_prompt = load_prompt("ml/prompts/insights.txt")
    summary_prompt = load_prompt("ml/prompts/summary.txt")

    insights_json = call_gpt(transcript, insights_prompt, "yandexgpt", iam_token)
    print(insights_json)
    summary = call_gpt(transcript, summary_prompt, "yandexgpt-lite", iam_token)
    print(summary)

    # оркестрация эмоций
    text_emotion = json.loads(insights_json)["emotion"]
    print(text_emotion)
    final_emotion = combine_emotions(audio_emotion, text_emotion)

    return {
        "transcript": transcript,
        "summary": summary,
        "emotion": final_emotion,
        "insights": json.loads(insights_json)
    }


if __name__ == "__main__":
    audio_file = "ml/audio_samples/voice.ogg"
    result = process_audio(audio_file)
    print(f"Result: {json.dumps(result, ensure_ascii=False, indent=2)}") 
