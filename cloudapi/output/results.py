import os
import grpc
from yandex.cloud.ai.stt.v3 import stt_pb2, stt_service_pb2_grpc, stt_service_pb2

request = stt_service_pb2.GetRecognitionRequest(
    operation_id="f8dj1jeu01vafmh7ti33"
)

cred = grpc.ssl_channel_credentials()
chan = grpc.secure_channel('stt.api.cloud.yandex.net:443', cred)
stub = stt_service_pb2_grpc.AsyncRecognizerStub(chan)
api_key = os.getenv("API_KEY")

# Аутентификация с API-ключом
response = stub.GetRecognition(request, metadata=[('authorization', f'Api-Key {api_key}')])

print(list(response))
