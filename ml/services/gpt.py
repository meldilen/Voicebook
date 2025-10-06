# gpt.py
import requests
import json
from config import FOLDER_ID

def call_gpt(text: str, prompt: str, model_name: str, iam_token: str) -> dict:
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

    resp = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        headers=headers,
        json=data,
        timeout=30
    )

    if resp.status_code != 200:
        raise RuntimeError(f"API error: {resp.status_code}, {resp.text}")

    response_text = resp.json()["result"]["alternatives"][0]["message"]["text"]

<<<<<<< HEAD
    return response_text.replace("`", "")
=======
    return response_text.replace("`", "")
>>>>>>> 15331349631a56ebf582f9d19122c5acbc2370d2
