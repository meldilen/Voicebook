emotion_map_audio_to_text = {
    "Angry": "anger",
    "Disgust": "disgust",
    "Fearful": "fear",
    "Happy": "joy",
    "Neutral": "neutral",
    "Sad": "sadness",
    "Surprised": "surprise"
}

similarity = {
    'anger':     {'anger': 1.0, 'disgust': 0.9, 'fear': 0.8, 'sadness': 0.7, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.6},
    'disgust':   {'anger': 0.9, 'disgust': 1.0, 'fear': 0.7, 'sadness': 0.8, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.5},
    'fear':      {'anger': 0.9, 'disgust': 0.6, 'fear': 1.0, 'sadness': 0.7, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.8},
    'joy':       {'anger': 0.0, 'disgust': 0.0, 'fear': 0.0, 'sadness': 0.0, 'joy': 1.0, 'neutral': 0.2, 'surprise': 0.9},
    'neutral':   {'anger': 0.0, 'disgust': 0.2, 'fear': 0.2, 'sadness': 0.2, 'joy': 0.2, 'neutral': 1.0, 'surprise': 0.2},
    'sadness':   {'anger': 0.6, 'disgust': 0.8, 'fear': 0.7, 'sadness': 1.0, 'joy': 0.0, 'neutral': 0.2, 'surprise': 0.5},
    'surprise':  {'anger': 0.6, 'disgust': 0.5, 'fear': 0.8, 'sadness': 0.0, 'joy': 0.9, 'neutral': 0.2, 'surprise': 1.0},
}

def combine_emotions(audio_emotion: str, text_emotion: str, similarity: dict, weight_audio: float = 0.4, weight_text: float = 0.6) -> str:
    audio_emotion = emotion_map_audio_to_text[audio_emotion]
    score = {}

    for target_emotion in similarity:
        audio_score = similarity[audio_emotion][target_emotion] * weight_audio
        text_score = similarity[text_emotion][target_emotion] * weight_text
        score[target_emotion] = audio_score + text_score
    if((audio_emotion == "neutral" or text_emotion == "neutral") and (audio_emotion != "neutral" or text_emotion != "neutral")):
        if(audio_emotion == "neutral"):
            return text_emotion
        return audio_emotion
    else:
        return max(score, key=score.get)
