
def combine_emotions(audio_emotion: str, text_emotion: str, weight_audio: float = 0.4, weight_text: float = 0.6) -> str:
    similarity = {
    'angry':     {'angry': 1.0, 'disgust': 0.9, 'fearful': 0.8, 'sad': 0.7, 'happy': 0.0, 'neutral': 0.2, 'surprised': 0.6},
    'disgust':   {'angry': 0.9, 'disgust': 1.0, 'fearful': 0.7, 'sad': 0.8, 'happy': 0.0, 'neutral': 0.2, 'surprised': 0.5},
    'fearful':      {'angry': 0.9, 'disgust': 0.6, 'fearful': 1.0, 'sad': 0.7, 'happy': 0.0, 'neutral': 0.2, 'surprised': 0.8},
    'happy':       {'angry': 0.0, 'disgust': 0.0, 'fearful': 0.0, 'sad': 0.0, 'happy': 1.0, 'neutral': 0.2, 'surprised': 0.9},
    'neutral':   {'angry': 0.0, 'disgust': 0.2, 'fearful': 0.2, 'sad': 0.2, 'happy': 0.2, 'neutral': 1.0, 'surprised': 0.2},
    'sad':   {'angry': 0.6, 'disgust': 0.8, 'fearful': 0.7, 'sad': 1.0, 'happy': 0.0, 'neutral': 0.2, 'surprised': 0.5},
    'surprised':  {'angry': 0.6, 'disgust': 0.5, 'fearful': 0.8, 'sad': 0.0, 'happy': 0.9, 'neutral': 0.2, 'surprised': 1.0},
}

    score = {}

    if audio_emotion == 'calm':
        audio_emotion = 'neutral'

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
