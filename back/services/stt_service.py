from datetime import datetime
import time
import uuid
import logging
import requests
import boto3
from botocore.client import Config
from app.config import settings

# === Константы API ===
UPLOAD_URL = f"https://storage.yandexcloud.net/{settings.BUCKET_NAME}"
STT_URL = "https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize"
OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


logger = logging.getLogger(__name__)


def upload_to_bucket(local_file_path: str) -> str:
    """
    Загружает файл в Object Storage через S3-совместимый API.
    Возвращает URI для STT API.
    """
    # S3-совместимый клиент
    s3 = boto3.client(
        "s3",
        endpoint_url="https://storage.yandexcloud.net",
        aws_access_key_id=settings.SECRET_KEY_ID,
        aws_secret_access_key=settings.SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )

    # Уникальное имя объекта
    object_name = f"stt/{datetime.now().strftime('%m-%d_%H:%M:%S')}_{uuid.uuid4().hex}.ogg"

    # Загрузка файла
    s3.upload_file(local_file_path, settings.BUCKET_NAME, object_name)
    logger.info(f"Uploaded file to: {object_name}")

    # Возвращаем URI в формате для SpeechKit
    return f"storage.yandexcloud.net/{settings.BUCKET_NAME}/{object_name}"


def start_transcription(iam_token: str, audio_uri: str) -> str:
    """
    Отправляет запрос на асинхронное распознавание.
    Возвращает operation_id.
    """
    print(audio_uri)
    payload = {
        "config": {
            "specification": {
                "languageCode": "ru-RU",
                "model": "general",
                "profanityFilter": False,
                "literatureText": True,
                "audioEncoding": "OGG_OPUS",
            }
        },
        "audio": {"uri": f"https://{audio_uri}"},
    }

    headers = {"Authorization": f"Bearer {iam_token}"}
    resp = requests.post(STT_URL, headers=headers, json=payload)
    if resp.status_code != 200:
            logger.error(f"STT API error {resp.status_code}: {resp.text}")
            try:
                error_detail = resp.json()
                logger.error(f"Error details: {error_detail}")
            except:
                logger.error(f"Raw error response: {resp.text}")
            resp.raise_for_status()
    # resp.raise_for_status()
    logger.info(f"Transcription started: {resp.json()['id']}")
    return resp.json()["id"]


def get_transcription_result(iam_token: str, operation_id: str, poll_interval: int = 5) -> str:
    """
    Ожидает завершения распознавания и возвращает текст.
    """
    headers = {"Authorization": f"Bearer {iam_token}"}
    url = f"{OPERATION_URL}/{operation_id}"

    while True:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

        if data.get("done"):
            if "response" in data:
                chunks = data["response"].get("chunks", [])
                text_parts = []
                for ch in chunks:
                    alt = ch.get("alternatives", [])
                    if alt:
                        text_parts.append(alt[0].get("text", ""))
                return " ".join(text_parts)
            else:
                raise RuntimeError("Ошибка распознавания: нет response в ответе")
        time.sleep(poll_interval)
        


def transcribe_audio(iam_token: str, local_file_path: str) -> str:
    """
    Основная функция: загружает файл, запускает распознавание и возвращает текст.
    """
    print("[INFO] Загружаю файл в Object Storage...")
    audio_uri = upload_to_bucket(local_file_path)

    print("[INFO] Отправляю на распознавание...")
    operation_id = start_transcription(iam_token, audio_uri)

    print("[INFO] Жду результат...")
    transcript = get_transcription_result(iam_token, operation_id)
    
    logger.info(f"Transcript: {transcript}")

    print("[INFO] Готово!")
    return transcript