emotion_map_audio_to_text = {
    "angry": "anger",
    "disgust": "disgust",
    "fearful": "fear",
    "happy": "joy",
    "neutral": "neutral",
    "sad": "sadness",
    "surprised": "surprise"
}

similarity = {
    'anger':     {'anger': 1.0, 'disgust': 0.9, 'fear': 0.8, 'sadness': 0.7, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.6},
    'disgust':   {'anger': 0.9, 'disgust': 1.0, 'fear': 0.7, 'sadness': 0.8, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.5},
    'fear':      {'anger': 0.9, 'disgust': 0.6, 'fear': 1.0, 'sadness': 0.7, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.8},
    'sadness':   {'anger': 0.6, 'disgust': 0.8, 'fear': 0.7, 'sadness': 1.0, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.5},
    'joy':       {'anger': 0.0, 'disgust': 0.0, 'fear': 0.0, 'sadness': 0.0, 'joy': 1.0, 'neutral': 0.2, 'surprise': 0.9},
    'neutral':   {'anger': 0.0, 'disgust': 0.6, 'fear': 0.5, 'sadness': 0.9, 'joy': 0.7, 'neutral': 1.0, 'surprise': 0.8},
    'surprise':  {'anger': 0.6, 'disgust': 0.5, 'fear': 0.8, 'sadness': 0.0, 'joy': 0.9, 'neutral': 0.2, 'surprise': 1.0},
}

def combine_emotions(audio_emotion: str, text_emotion: str, weight_audio: float = 0.5, weight_text: float = 0.5) -> str:
    audio_emotion = emotion_map_audio_to_text[audio_emotion.lower()]
    score = {}

    for target_emotion in similarity:
        audio_score = similarity[audio_emotion][target_emotion] * weight_audio
        text_score = similarity[text_emotion][target_emotion] * weight_text
        score[target_emotion] = audio_score + text_score

    return max(score, key=score.get)