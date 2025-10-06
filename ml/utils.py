import time
import jwt
import requests
from config import SERVICE_ACCOUNT_ID, KEY_ID, PRIVATE_KEY

def get_iam_token() -> str:
    """Синхронная генерация IAM токена"""
    now = int(time.time())
    payload = {
        "aud": "https://iam.api.cloud.yandex.net/iam/v1/tokens",
        "iss": SERVICE_ACCOUNT_ID,
        "iat": now,
        "exp": now + 360  # 6 минут
    }

    encoded_jwt = jwt.encode(
        payload,
        PRIVATE_KEY,
        algorithm="PS256",
        headers={"kid": KEY_ID}
    )

    resp = requests.post(
        "https://iam.api.cloud.yandex.net/iam/v1/tokens",
        json={"jwt": encoded_jwt},
        timeout=10
    )
    if resp.status_code != 200:
        raise RuntimeError(f"IAM error {resp.status_code}: {resp.text}")

    return resp.json()["iamToken"]


def load_prompt(path: str) -> str:
    """Загрузка промпта из файла"""
    with open(path, "r", encoding="utf-8") as f:
<<<<<<< HEAD
        return f.read().strip()
=======
        return f.read().strip()
>>>>>>> 15331349631a56ebf582f9d19122c5acbc2370d2
