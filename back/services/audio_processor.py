import json
import logging
import subprocess
from typing import Dict, Any
import os
import subprocess

from .stt_service import transcribe_audio
from .gpt_service import call_gpt
from .utils.iam_token import get_iam_token

logger = logging.getLogger(__name__)


class AudioProcessor:
    def __init__(self):
        self.summary_prompt = """Сделай краткое и точное саммари текста простым человеческим языком. Обращайся к автору текста на "ты". Перескажи содержание и выдели главный эмоциональный посыл так, как будто ты его понимаешь и принимаешь."""
        self.insight_prompt = """Ты — внимательный и заботливый психолог. Твоя задача — проанализировать предоставленный текст и дать обратную связь, как если бы ты разговаривал с клиентом на сессии. Обращайся к автору текста на "ты".
Проанализируй текст и представь результат в формате JSON по указанной ниже структуре. Весь анализ, включая поля emotional_dynamics, physical_reaction, coping_strategies и support, должен быть написан с позиции поддерживающего психолога, который стремится помочь и понять.

{
  "emotion": "",
  "insights": {
    "emotional_dynamics": "",
    "key_triggers": [],
    "physical_reaction": "",
    "coping_strategies": {
      "effective": "",
      "ineffective": ""
    },
    "support": "",
    "recommendations": []
  }
}

В поле emotion укажи одну из эмоций, которую проявляет человек в тексте, попытайся проникнуть в то что он чувствует и глубже определить реакцию: angry, disgust, fearful, happy, neutral, sadness, surprised.

В разделе insights:
    emotional_dynamics: Опиши, как меняется эмоциональное состояние автора в тексте, с пониманием и эмпатией.
    key_triggers: Перечисли ключевые события или факторы, которые вызвали эти эмоции (массив строк).
    physical_reaction: Опиши физические проявления эмоций, если они упомянуты в тексте. Если нет, можешь оставить поле пустым.
    coping_strategies: Опиши стратегии совладания, которые ты, как психолог, замечаешь в тексте. Раздели их на те, что выглядят эффективными, и те, что могут быть неэффективными в долгосрочной перспективе.
    support: Новое поле. Напиши 1-2 предложения прямой эмоциональной поддержки, подтверждения чувств автора и выражения понимания. Будь заботливым.
    recommendations: Предложи 3–5 конкретных и практических рекомендаций, которые могут помочь улучшить эмоциональное состояние или решить проблему. Рекомендации должны быть добрыми и направленными на заботу о себе.

Если информации недостаточно для заполнения поля — оставь его пустым. Избегай домыслов."""

    def _file_exists(self, audio_path: str) -> bool:
        exists = os.path.exists(audio_path)
        return exists

    @staticmethod
    def wav_to_ogg_opus(input_path: str, output_path: str, logger, bitrate="64k"):
        if not os.path.isfile(input_path):
            logger.error(f"Input file does not exist: {input_path}")
            raise FileNotFoundError(f"Input file not found: {input_path}")

        # Проверяем, что входной и выходной файлы разные
        if os.path.abspath(input_path) == os.path.abspath(output_path):
            logger.error("Input and output paths are the same")
            raise ValueError("Input and output paths must be different")

        # Удаляем существующий выходной файл только если он отличается от входного
        if os.path.exists(output_path) and os.path.abspath(input_path) != os.path.abspath(output_path):
            os.remove(output_path)
            logger.info(f"Removed existing output file: {output_path}")

        logger.info(f"Starting conversion WAV → OGG Opus")

        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-c:a", "libopus",
            "-b:a", bitrate,
            "-application", "voip",
            "-frame_duration", "60",
            output_path
        ]

        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )

        except subprocess.CalledProcessError as e:
            logger.error("ffmpeg conversion failed")
            logger.error(f"Return code: {e.returncode}")
            logger.error(f"Command: {' '.join(cmd)}")
            raise

        logger.info(f"Conversion finished successfully: {output_path}")
        return True

    @staticmethod
    def is_valid_ogg_opus(path: str) -> bool:
        """
        Проверяет корректность OGG Opus без ffprobe.
        """
        if not os.path.isfile(path):
            return False

        try:
            with open(path, "rb") as f:
                data = f.read()

            if len(data) < 100:
                return False

            if not data.startswith(b"OggS"):
                return False

            if b"OpusHead" not in data:
                return False

            if b"OpusTags" not in data:
                return False

            return True

        except Exception:
            return False

    def process_audio(self, audio_path: str) -> Dict[str, Any]:
        try:
            iam_token = get_iam_token()

            if not self._file_exists(audio_path):
                logger.error(f"Audio file does not exist: {audio_path}")
                return self._get_fallback_response()

            # Определяем тип файла и обрабатываем соответственно
            file_extension = os.path.splitext(audio_path)[1].lower()

            if file_extension == '.wav':
                # Конвертируем WAV в OGG
                converted_path = audio_path.replace('.wav', '.ogg')

                if os.path.exists(converted_path):
                    os.remove(converted_path)

                self.wav_to_ogg_opus(audio_path, converted_path, logger)

                # Проверяем результат конвертации
                if self.is_valid_ogg_opus(converted_path):
                    logger.info(
                        f"Successfully converted WAV to OGG Opus: {converted_path}")
                    audio_path = converted_path  # Используем конвертированный файл
                else:
                    logger.error("Converted file is not valid OGG Opus")
                    return self._get_fallback_response()

            elif file_extension == '.ogg':
                # Проверяем существующий OGG файл
                if not self.is_valid_ogg_opus(audio_path):
                    logger.error("Existing OGG file is not valid OGG Opus")
                    return self._get_fallback_response()
            else:
                logger.error(f"Unsupported file format: {file_extension}")
                return self._get_fallback_response()

            # Транскрибация
            logger.info(f"Starting transcription for: {audio_path}")
            transcript = transcribe_audio(iam_token, audio_path)
            logger.info(f"Transcript completed: {len(transcript)} characters")

            if not transcript or len(transcript.strip()) < 10:
                logger.warning("Transcript too short or empty")
                return self._get_fallback_response()

            insights = call_gpt(
                transcript, self.insight_prompt, "yandexgpt", iam_token)
            summary = call_gpt(transcript, self.summary_prompt,
                               "yandexgpt-lite", iam_token)
            
            if os.path.exists(audio_path):
                os.remove(audio_path)

            return {
                "transcript": transcript,
                "summary": summary,
                "emotion": json.loads(insights)["emotion"],
                "insights": json.loads(insights)["insights"]
            }

        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}")
            return self._get_fallback_response()

    def _cleanup_files(self, original_path: str, converted_path: str = None):
        """Очистка временных файлов"""
        files_to_delete = []

        if original_path and os.path.exists(original_path):
            files_to_delete.append(original_path)

        if converted_path and os.path.exists(converted_path):
            files_to_delete.append(converted_path)

        for file_path in files_to_delete:
            try:
                os.remove(file_path)
                logger.info(f"Deleted processing file: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete file {file_path}: {e}")

    def _get_fallback_response(self) -> Dict[str, Any]:
        """Возвращает fallback-ответ при ошибках"""
        return {
            "transcript": "Речь не распознана",
            "summary": "Не удалось проанализировать запись",
            "emotion": "neutral",
            "insights": ["Требуется повторная запись"]
        }
