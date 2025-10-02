import logging
import json
import os

from services.stt import transcribe_audio
from services.emotion_audio import EmotionRecognitionModel
from services.emotion_utils import combine_emotions
from services.gpt import call_gpt
from config import FOLDER_ID
from utils import get_iam_token, load_prompt
from services.stt import analyze_audio_file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def process_audio(audio_path: str):

    analyze_audio_file(audio_path)
    iam_token = get_iam_token()
    emotion_model = EmotionRecognitionModel()

    # транскрибация и эмоции аудио
    transcript = transcribe_audio(iam_token, audio_path)
    print(f"Final transcript: '{transcript}'")
    
    # Handle empty or failed transcription
    if not transcript or transcript == "Аудио не удалось распознать." or transcript == "Речь не распознана. Пожалуйста, попробуйте записать сообщение еще раз.":
        # Return fallback analysis for failed transcription
        return {
            "transcript": "Речь не распознана. Возможно, аудио слишком тихое, содержит только шум или имеет неподдерживаемый формат.",
            "summary": "Аудио сообщение не было распознано системой.",
            "emotion": "neutral", 
            "insights": {
                "emotion": "neutral",
                "insights": {
                    "emotional_dynamics": "Не удалось определить из-за проблем с распознаванием речи",
                    "key_triggers": [],
                    "physical_reaction": "Не определено",
                    "coping_strategies": {
                        "effective": "Попробовать записать сообщение в более тихой обстановке",
                        "ineffective": "Не определено"
                    },
                    "recommendations": ["Проверить качество записи", "Убедиться, что микрофон работает", "Записать сообщение в тихом месте"]
                }
            }
        }
    
    audio_emotion = emotion_model.get_emotion(audio_path)
    print(f"Audio emotion: {audio_emotion}")

    # Use correct paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    insights_prompt_path = os.path.join(base_dir, "prompts", "insights.txt")
    summary_prompt_path = os.path.join(base_dir, "prompts", "summary.txt")

    insights_prompt = load_prompt(insights_prompt_path)
    summary_prompt = load_prompt(summary_prompt_path)

    try:
        insights_json = call_gpt(transcript, insights_prompt, "yandexgpt", iam_token)
        summary = call_gpt(transcript, summary_prompt, "yandexgpt-lite", iam_token)

        # оркестрация эмоций
        text_emotion = json.loads(insights_json)["emotion"]
        final_emotion = combine_emotions(audio_emotion, text_emotion)

        return {
            "transcript": transcript,
            "summary": summary,
            "emotion": final_emotion,
            "insights": json.loads(insights_json)
        }
    except Exception as e:
        print(f"GPT analysis failed: {e}")
        # Return fallback if GPT fails
        return {
            "transcript": transcript,
            "summary": "Не удалось сгенерировать краткое содержание из-за ошибки анализа.",
            "emotion": audio_emotion,
            "insights": {
                "emotion": audio_emotion,
                "insights": {
                    "emotional_dynamics": "Анализ текста не выполнен",
                    "key_triggers": [],
                    "physical_reaction": "Не определено",
                    "coping_strategies": {
                        "effective": "Не определено",
                        "ineffective": "Не определено"
                    },
                    "recommendations": ["Попробовать проанализировать другое сообщение"]
                }
            }
        }