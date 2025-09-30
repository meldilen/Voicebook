# stt.py
import asyncio
import uuid
import aiohttp
import aioboto3
from botocore.client import Config
from config import BUCKET_NAME, SECRET_KEY, SECRET_KEY_ID

# === Константы API ===
STT_URL = "https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize"
OPERATION_URL = "https://operation.api.cloud.yandex.net/operations"


async def upload_to_bucket(local_file_path: str) -> str:
    """
    Асинхронно загружает файл в Object Storage через S3-совместимый API.
    Возвращает URI для STT API.
    """
    session = aioboto3.Session()
    async with session.client(
        "s3",
        endpoint_url="https://storage.yandexcloud.net",
        aws_access_key_id=SECRET_KEY_ID,
        aws_secret_access_key=SECRET_KEY,
        config=Config(signature_version="s3v4"),
    ) as s3:

        # Уникальное имя объекта
        object_name = f"stt/{uuid.uuid4().hex}-{local_file_path.split('/')[-1]}"

        # Асинхронная загрузка файла
        await s3.upload_file(local_file_path, BUCKET_NAME, object_name)

        # Возвращаем URI в формате для SpeechKit
        return f"storage.yandexcloud.net/{BUCKET_NAME}/{object_name}"


async def start_transcription(iam_token: str, audio_uri: str) -> str:
    """
    Асинхронно отправляет запрос на асинхронное распознавание.
    Возвращает operation_id.
    """
    payload = {
        "config": {
            "specification": {
                "languageCode": "ru-RU",
                "model": "general",
                "profanityFilter": False,
                "literature_text": True,
                "audioEncoding": "OGG_OPUS",
            }
        },
        "audio": {"uri": f"https://{audio_uri}"},
    }

    headers = {"Authorization": f"Bearer {iam_token}"}
    
    async with aiohttp.ClientSession() as session:
        async with session.post(STT_URL, headers=headers, json=payload) as resp:
            resp.raise_for_status()
            data = await resp.json()
            return data["id"]


async def get_transcription_result(iam_token: str, operation_id: str, poll_interval: int = 5, max_wait_time: int = 300) -> str:
    """
    Асинхронно ожидает завершения распознавания и возвращает текст.
    """
    headers = {"Authorization": f"Bearer {iam_token}"}
    url = f"{OPERATION_URL}/{operation_id}"
    
    async with aiohttp.ClientSession() as session:
        start_time = asyncio.get_event_loop().time()
        
        while True:
            # Проверяем время выполнения
            if (asyncio.get_event_loop().time() - start_time) > max_wait_time:
                raise TimeoutError(f"Transcription timeout after {max_wait_time} seconds")
            
            async with session.get(url, headers=headers) as resp:
                resp.raise_for_status()
                data = await resp.json()

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
            
            # Асинхронная задержка вместо time.sleep
            await asyncio.sleep(poll_interval)


async def transcribe_audio(iam_token: str, local_file_path: str) -> str:
    """
    Основная асинхронная функция транскрибации
    """
    audio_uri = await upload_to_bucket(local_file_path)
    operation_id = await start_transcription(iam_token, audio_uri)
    transcript = await get_transcription_result(iam_token, operation_id)
    return transcript