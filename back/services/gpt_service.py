import requests
from app.config import settings

def call_gpt(text: str, prompt: str, model_name: str, iam_token: str) -> str:
    headers = {
        "Authorization": f"Bearer {iam_token}",
        "Content-Type": "application/json",
    }

    data = {
        "modelUri": f"gpt://{settings.FOLDER_ID}/{model_name}",
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
    return response_text.replace("`", "")