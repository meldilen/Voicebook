# utils.py
import time
import jwt
import aiohttp
import aiofiles
from config import SERVICE_ACCOUNT_ID, KEY_ID, PRIVATE_KEY

async def get_iam_token() -> str:
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

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://iam.api.cloud.yandex.net/iam/v1/tokens",
            json={"jwt": encoded_jwt},
            timeout=10
        ) as resp:
            if resp.status != 200:
                raise RuntimeError(f"IAM error {resp.status}: {await resp.text()}")
            
            data = await resp.json()
            return data["iamToken"]


async def load_prompt(path: str) -> str:
    async with aiofiles.open(path, "r", encoding="utf-8") as f:
        return (await f.read()).strip()