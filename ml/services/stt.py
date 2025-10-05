# stt.py
import time
import uuid
import requests
import boto3
import os
import subprocess
import shutil
from botocore.client import Config
from config import BUCKET_NAME, SECRET_KEY, SECRET_KEY_ID

# === Константы API ===
UPLOAD_URL = f"https://storage.yandexcloud.net/{BUCKET_NAME}"
STT_URL = "https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize"
OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


def find_ffmpeg_windows():
    """Find FFmpeg on Windows systems using multiple methods"""
    # Method 1: Check PATH via shutil
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path and os.path.exists(ffmpeg_path):
        return ffmpeg_path
    
    # Method 2: Common installation paths
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            return path
    
    # Method 3: Try Windows command to find ffmpeg
    try:
        result = subprocess.run(
            ['cmd', '/c', 'where', 'ffmpeg'], 
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            first_path = result.stdout.strip().split('\n')[0]
            if os.path.exists(first_path):
                return first_path
    except:
        pass
    
    return None


def get_ffmpeg_command():
    """Get the correct ffmpeg command to use"""
    ffmpeg_path = find_ffmpeg_windows()
    
    if ffmpeg_path:
        print(f"Found FFmpeg at: {ffmpeg_path}")
        return ffmpeg_path
    
    # Final attempt: try direct execution
    try:
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, timeout=5)
        if result.returncode == 0:
            print("FFmpeg found via direct execution")
            return 'ffmpeg'
    except:
        pass
    
    print("FFmpeg not found")
    return None


def validate_ogg_file(file_path: str) -> bool:
    """
    Validate OGG file using ffprobe
    """
    try:
        # Try to use ffprobe (comes with ffmpeg)
        ffprobe_cmd = 'ffprobe'
        if get_ffmpeg_command() and 'ffmpeg.exe' in get_ffmpeg_command():
            ffprobe_cmd = get_ffmpeg_command().replace('ffmpeg.exe', 'ffprobe.exe')
        
        cmd = [ffprobe_cmd, '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except:
        # If validation fails, at least check if file exists and has content
        return os.path.exists(file_path) and os.path.getsize(file_path) > 0


def convert_to_ogg(input_path: str) -> str:
    """
    Convert audio to proper OGG Opus format for Yandex STT
    """
    # If already OGG, check if it's valid
    if input_path.lower().endswith('.ogg'):
        print(f"File is already OGG format: {input_path}")
        return input_path
    
    output_path = input_path + ".converted.ogg"
    
    # Get ffmpeg command
    ffmpeg_cmd = get_ffmpeg_command()
    if not ffmpeg_cmd:
        print("FFmpeg not available, cannot convert audio")
        return input_path
    
    try:
        # Convert to OGG Opus format optimized for speech recognition
        cmd = [
            ffmpeg_cmd, '-i', input_path,
            '-c:a', 'libopus',
            '-b:a', '64k', 
            '-vbr', 'on',
            '-compression_level', '10',
            '-frame_duration', '20',
            '-application', 'voip',
            '-ac', '1',
            '-ar', '48000',
            '-y', output_path
        ]
        
        print(f"Converting audio to OGG: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode != 0:
            print(f"FFmpeg conversion failed: {result.stderr}")
            # Try simpler conversion without advanced options
            cmd_alt = [
                ffmpeg_cmd, '-i', input_path,
                '-c:a', 'libopus',
                '-ac', '1', 
                '-ar', '48000',
                '-y', output_path
            ]
            print(f"Trying alternative conversion: {' '.join(cmd_alt)}")
            result = subprocess.run(cmd_alt, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0 and os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            print(f"Successfully converted to OGG: {output_path} ({file_size} bytes)")
            
            # Basic validation - check file exists and has content
            if os.path.exists(output_path) and file_size > 0:
                print("Converted file validation: PASSED")
                return output_path
            else:
                print("Converted file validation: FAILED - file is empty or missing")
                if os.path.exists(output_path):
                    os.unlink(output_path)
                return input_path
        else:
            print(f"OGG conversion failed completely: {result.stderr}")
            return input_path
            
    except Exception as e:
        print(f"OGG conversion error: {e}")
        return input_path


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

    # Use .ogg extension for all files for Yandex compatibility
    file_extension = ".ogg"
    object_name = f"stt/{uuid.uuid4().hex}{file_extension}"

    # Загрузка файла
    s3.upload_file(local_file_path, BUCKET_NAME, object_name)
    print(f"Uploaded file to: {object_name}")

    # Возвращаем URI в формате для SpeechKit
    return f"storage.yandexcloud.net/{BUCKET_NAME}/{object_name}"


def start_transcription(iam_token: str, audio_uri: str) -> str:
    """
    Отправляет запрос на асинхронное распознавание.
    Возвращает operation_id.
    """
    # Use OGG_OPUS for all files since we convert everything to OGG
    audio_encoding = "OGG_OPUS"
    
    payload = {
        "config": {
            "specification": {
                "languageCode": "ru-RU",
                "model": "general",
                "profanityFilter": False,
                "literature_text": True,
                "audioEncoding": audio_encoding,
            }
        },
        "audio": {"uri": f"https://{audio_uri}"},
    }

    headers = {"Authorization": f"Bearer {iam_token}"}
    resp = requests.post(STT_URL, headers=headers, json=payload)
    
    # Better error handling
    if resp.status_code != 200:
        error_detail = resp.text
        print(f"Yandex STT API error {resp.status_code}: {error_detail}")
        raise RuntimeError(f"Yandex STT API error: {error_detail}")
        
    operation_id = resp.json()["id"]
    print(f"Started transcription operation: {operation_id}")
    return operation_id


def get_transcription_result(iam_token: str, operation_id: str, poll_interval: int = 5) -> str:
    """
    Ожидает завершения распознавания и возвращает текст.
    """
    headers = {"Authorization": f"Bearer {iam_token}"}
    url = f"{OPERATION_URL}/{operation_id}"

    attempts = 0
    max_attempts = 60
    
    while attempts < max_attempts:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()

        if data.get("done"):
            if "response" in data:
                chunks = data["response"].get("chunks", [])
                text_parts = []
                
                # ПРОСТОЙ ФИКС: Убираем дублирующиеся чанки
                for ch in chunks:
                    alt = ch.get("alternatives", [])
                    if alt:
                        chunk_text = alt[0].get("text", "").strip()
                        if chunk_text:
                            # Проверяем, не является ли этот текст дубликатом
                            is_duplicate = False
                            for existing_text in text_parts:
                                # Если тексты очень похожи (более 80% совпадения), считаем дубликатом
                                if (chunk_text in existing_text or 
                                    existing_text in chunk_text or 
                                    are_texts_similar(chunk_text, existing_text)):
                                    is_duplicate = True
                                    # Оставляем более длинную версию
                                    if len(chunk_text) > len(existing_text):
                                        text_parts.remove(existing_text)
                                        text_parts.append(chunk_text)
                                    break
                            
                            if not is_duplicate:
                                text_parts.append(chunk_text)
                
                transcript = " ".join(text_parts)
                print(f"Transcription completed: '{transcript}'")
                return transcript
            else:
                error_msg = data.get("error", {}).get("message", "Unknown error")
                raise RuntimeError(f"Ошибка распознавания: {error_msg}")
        
        attempts += 1
        print(f"Transcription in progress... ({attempts}/{max_attempts})")
        time.sleep(poll_interval)
    
    raise RuntimeError("Transcription timeout")


def are_texts_similar(text1: str, text2: str, similarity_threshold: float = 0.8) -> bool:
    """
    Проверяет, похожи ли два текста друг на друга.
    """
    # Простая проверка на схожесть текстов
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return False
    
    # Вычисляем коэффициент схожести
    common_words = words1.intersection(words2)
    similarity = len(common_words) / max(len(words1), len(words2))
    
    return similarity > similarity_threshold

def transcribe_audio(iam_token: str, local_file_path: str) -> str:
    """
    Основная функция: загружает файл, запускает распознавание и возвращает текст.
    """
    try:
        print(f"=== STARTING TRANSCRIPTION ===")
        print(f"Original audio file: {local_file_path}")
        
        # Check file exists and has content
        if not os.path.exists(local_file_path):
            raise FileNotFoundError(f"Audio file not found: {local_file_path}")
        
        file_size = os.path.getsize(local_file_path)
        print(f"Original file size: {file_size} bytes")
        
        if file_size == 0:
            raise ValueError("Audio file is empty")
        
        # Convert to OGG format for Yandex STT
        converted_path = convert_to_ogg(local_file_path)
        final_path = converted_path if converted_path != local_file_path else local_file_path
        
        # Verify final file
        if not os.path.exists(final_path):
            raise FileNotFoundError(f"Converted file not found: {final_path}")
        
        final_size = os.path.getsize(final_path)
        print(f"Using audio file for transcription: {final_path} ({final_size} bytes)")

        # Upload to Yandex Object Storage
        audio_uri = upload_to_bucket(final_path)
        print(f"Uploaded to Yandex: {audio_uri}")

        # Start transcription
        operation_id = start_transcription(iam_token, audio_uri)

        # Get transcription result
        transcript = get_transcription_result(iam_token, operation_id)
        
        # Clean up converted file if we created one
        if converted_path != local_file_path and os.path.exists(converted_path):
            os.unlink(converted_path)
            print(f"Cleaned up converted file: {converted_path}")
        
        return transcript if transcript and transcript.strip() else "Речь не распознана. Возможно, аудио слишком тихое или содержит только шум."
        
    except Exception as e:
        print(f"TRANSCRIPTION ERROR: {e}")
        import traceback
        traceback.print_exc()
        return f"Ошибка распознавания: {str(e)}"