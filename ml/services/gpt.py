# gpt.py
import aiohttp
import json
from config import FOLDER_ID

async def call_gpt(text: str, prompt: str, model_name: str, iam_token: str) -> str:
    headers = {
        "Authorization": f"Bearer {iam_token}",
        "Content-Type": "application/json",
    }

    data = {
        "modelUri": f"gpt://{FOLDER_ID}/{model_name}",
        "completionOptions": {
            "stream": False,
            "temperature": 0.3,
            "maxTokens": 500
        },
        "messages": [
            {"role": "system", "text": prompt},
            {"role": "user", "text": text}
        ]
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
            headers=headers,
            json=data,
            timeout=30
        ) as resp:
            if resp.status != 200:
                raise RuntimeError(f"API error: {resp.status}, {await resp.text()}")

            response_data = await resp.json()
            response_text = response_data["result"]["alternatives"][0]["message"]["text"]

            return response_text.replace("`", "")