import os
import grpc
from yandex.cloud.ai.stt.v3 import stt_pb2, stt_service_pb2_grpc

request = stt_pb2.RecognizeFileRequest(
  uri='https://storage.yandexcloud.net/voicebacket/speech.wav?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=YCAJEZ8VqXtcaefvyQQlwq33X%2F20250918%2Fru-central1%2Fs3%2Faws4_request&X-Amz-Date=20250918T182544Z&X-Amz-Expires=108000&X-Amz-Signature=0eb4f21c69bd224831877bc5280f565c72bc3f461a9d1cd64a420c5cf30c21cd&X-Amz-SignedHeaders=host',
  recognition_model=stt_pb2.RecognitionModelOptions(
    model='general',
    audio_format=stt_pb2.AudioFormatOptions(
      container_audio=stt_pb2.ContainerAudio(
        container_audio_type=stt_pb2.ContainerAudio.WAV
      )
    )
  )
)

cred = grpc.ssl_channel_credentials()
chan = grpc.secure_channel('stt.api.cloud.yandex.net:443', cred)
stub = stt_service_pb2_grpc.AsyncRecognizerStub(chan)
api_key = os.getenv("API_KEY")

# Аутентификация с API-ключом
response = stub.RecognizeFile(request, metadata=[('authorization', f'Api-Key {api_key}')])

print(response)
