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

    # emotion_model = EmotionRecognitionModel()

    # транскрибация и эмоции аудио
    transcript = transcribe_audio(iam_token, audio_path)
    print(f"Transcript: {transcript}")
    # audio_emotion = emotion_model.get_emotion(audio_path)
    # print(f"Audio emotion: {audio_emotion}")

    # Get the base directory
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Use absolute paths for prompts
    insights_prompt_path = os.path.join(base_dir, "prompts", "insights.txt")
    summary_prompt_path = os.path.join(base_dir, "prompts", "summary.txt")
    
    print(f"Looking for insights prompt at: {insights_prompt_path}")
    print(f"Looking for summary prompt at: {summary_prompt_path}")
    
    # Check if files exist
    print(f"Insights file exists: {os.path.exists(insights_prompt_path)}")
    print(f"Summary file exists: {os.path.exists(summary_prompt_path)}")

    insights_prompt = load_prompt(insights_prompt_path)
    summary_prompt = load_prompt(summary_prompt_path)

    insights_json = call_gpt(transcript, insights_prompt, "yandexgpt", iam_token)
    summary = call_gpt(transcript, summary_prompt, "yandexgpt-lite", iam_token)

    # оркестрация эмоций
    text_emotion = json.loads(insights_json)["emotion"]
    # final_emotion = combine_emotions(audio_emotion, text_emotion)

    print(insights_json)

    return {
        "transcript": transcript,
        "summary": summary,
        "emotion": text_emotion,
        "insights": json.loads(insights_json)["insights"]
    }


if __name__ == "__main__":
    audio_file = "ml/audio_samples/voice.ogg"  # Change to .ogg for testing
    result = process_audio(audio_file)
    print(f"Result: {json.dumps(result, ensure_ascii=False, indent=2)}")