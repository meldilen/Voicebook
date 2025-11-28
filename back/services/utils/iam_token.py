import jwt
import time
import requests
from app.config import settings

def get_iam_token() -> str:    
    now = int(time.time())
    payload = {
        'aud': 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        'iss': settings.SERVICE_ACCOUNT_ID,
        'iat': now,
        'exp': now + 3600
    }
    
    encoded_token = jwt.encode(
        payload,
        settings.PRIVATE_KEY,
        algorithm='PS256',
        headers={'kid': settings.KEY_ID}
    )
    
    response = requests.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', 
                           json={'jwt': encoded_token})
    response.raise_for_status()
    
    return response.json()['iamToken']