# stt.py
import os
import time
import uuid
import requests
import boto3
from botocore.client import Config
from config import BUCKET_NAME, SECRET_KEY, SECRET_KEY_ID

# === Константы API ===
UPLOAD_URL = f"https://storage.yandexcloud.net/{BUCKET_NAME}"
STT_URL = "https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize"
OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


def upload_to_bucket(local_file_path: str) -> str:
    """
    Загружает файл в Object Storage через S3-совместимый API.
    Возвращает URI для STT API.
    """
    # S3-совместимый клиент
    s3 = boto3.client(
        "s3",
        endpoint_url="https://storage.yandexcloud.net",
        aws_access_key_id=SECRET_KEY_ID,
        aws_secret_access_key=SECRET_KEY,
        config=Config(signature_version="s3v4"),
    )

    # Уникальное имя объекта
    object_name = f"stt/{uuid.uuid4().hex}-{local_file_path.split('/')[-1]}"

    # Загрузка файла
    s3.upload_file(local_file_path, BUCKET_NAME, object_name)

    # Возвращаем URI в формате для SpeechKit
    return f"storage.yandexcloud.net/{BUCKET_NAME}/{object_name}"


def start_transcription(iam_token: str, audio_uri: str) -> str:
    """
    Отправляет запрос на асинхронное распознавание.
    Возвращает operation_id.
    """
    payload = {
        "config": {
            "specification": {
                "languageCode": "ru-RU",
                "model": "general",
                "profanityFilter": False,
                "literature_text": True,
                "audioEncoding": "LINEAR16_PCM",  # Changed from OGG_OPUS
            }
        },
        "audio": {"uri": f"https://{audio_uri}"},
    }

    headers = {"Authorization": f"Bearer {iam_token}"}
    resp = requests.post(STT_URL, headers=headers, json=payload)
    
    # Better error handling
    if resp.status_code != 200:
        error_detail = resp.text
        logger.error(f"Yandex STT API error {resp.status_code}: {error_detail}")
        
        # Try to parse error for better message
        try:
            error_json = resp.json()
            error_detail = error_json.get('error', {}).get('message', error_detail)
        except:
            pass
            
        raise RuntimeError(f"Yandex STT API error: {error_detail}")
        
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
    try:
        print(f"=== STARTING TRANSCRIPTION ===")
        print(f"Audio file: {local_file_path}")
        print(f"File exists: {os.path.exists(local_file_path)}")
        
        if os.path.exists(local_file_path):
            file_size = os.path.getsize(local_file_path)
            print(f"File size: {file_size} bytes")
        else:
            return "File not found"
        
        # Upload to bucket
        print("Uploading to Yandex Object Storage...")
        audio_uri = upload_to_bucket(local_file_path)
        print(f"Uploaded to: {audio_uri}")
        
        # Start transcription
        print("Starting transcription...")
        operation_id = start_transcription(iam_token, audio_uri)
        print(f"Operation ID: {operation_id}")
        
        # Get result
        print("Waiting for transcription result...")
        transcript = get_transcription_result(iam_token, operation_id)
        print(f"Raw transcript: '{transcript}'")
        
        if transcript and transcript.strip():
            return transcript
        else:
            print("WARNING: Empty transcript received")
            return "Речь не распознана. Возможно, аудио слишком тихое или содержит только шум."
        
    except Exception as e:
        print(f"TRANSCRIPTION ERROR: {e}")
        import traceback
        traceback.print_exc()
        return f"Ошибка распознавания: {str(e)}"
    
def analyze_audio_file(file_path: str):
    """Analyze audio file properties"""
    try:
        import librosa
        import soundfile as sf
        
        print(f"=== AUDIO FILE ANALYSIS ===")
        print(f"File: {file_path}")
        
        # Get file info
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"Size: {file_size} bytes")
        
        # Try to read with soundfile
        try:
            audio_sf, sr_sf = sf.read(file_path)
            print(f"SoundFile: shape={audio_sf.shape}, sr={sr_sf}, dtype={audio_sf.dtype}")
        except Exception as e:
            print(f"SoundFile read failed: {e}")
        
        # Try to read with librosa
        try:
            audio_lib, sr_lib = librosa.load(file_path, sr=None)
            print(f"Librosa: shape={audio_lib.shape}, sr={sr_lib}, dtype={audio_lib.dtype}")
            print(f"Audio duration: {len(audio_lib)/sr_lib:.2f} seconds")
        except Exception as e:
            print(f"Librosa read failed: {e}")
            
    except Exception as e:
        print(f"Audio analysis failed: {e}")