# main.py
from services.stt import transcribe_audio  # Use async STT
from services.emotion_audio import EmotionRecognitionModel
from services.emotion_utils import combine_emotions
from services.gpt import call_gpt  # Use async GPT
from config import FOLDER_ID
from utils import get_iam_token, load_prompt  # Use async utils
from typing import Dict, Any
import asyncio
import logging
import json

logger = logging.getLogger(__name__)

def parse_and_combine_emotions(insights_json: str, audio_emotion: str) -> tuple[str, str]:
    """Helper function to parse and combine emotions (CPU-bound operations)"""
    text_emotion = json.loads(insights_json)["emotion"]
    final_emotion = combine_emotions(audio_emotion, text_emotion)
    return text_emotion, final_emotion


async def process_audio(audio_path: str) -> Dict[str, Any]:
    logger.info("Starting async audio analysis process", extra={"audio_path": audio_path})
    
    try:
        logger.debug("Retrieving IAM token")
        iam_token = await get_iam_token() 
        logger.debug("IAM token retrieved successfully")

        # Initialize emotion model (CPU-bound, run in thread)
        logger.debug("Initializing emotion recognition model")
        emotion_model = EmotionRecognitionModel()
        logger.debug("Emotion recognition model initialized")

        # Parallel: Transcribe audio AND analyze audio emotions
        logger.info("Starting parallel audio processing")
        
        # Both are properly async now
        transcript_task = transcribe_audio(iam_token, audio_path) 
        emotion_task = asyncio.to_thread(emotion_model.get_emotion, audio_path)
        
        transcript, audio_emotion = await asyncio.gather(
            transcript_task, 
            emotion_task,
            return_exceptions=True
        )
        
        # Handle exceptions from parallel tasks
        if isinstance(transcript, Exception):
            logger.error("Audio transcription failed", exc_info=transcript)
            raise transcript
        if isinstance(audio_emotion, Exception):
            logger.error("Audio emotion analysis failed", exc_info=audio_emotion)
            raise audio_emotion
            
        logger.info("Parallel audio processing completed",
                   extra={
                       "transcript_length": len(transcript),
                       "audio_emotion": audio_emotion
                   })

        logger.debug("Loading GPT prompts asynchronously")
        insights_prompt_task = load_prompt("ml/prompts/insights.txt")  
        summary_prompt_task = load_prompt("ml/prompts/summary.txt")   
        
        insights_prompt, summary_prompt = await asyncio.gather(
            insights_prompt_task,
            summary_prompt_task
        )
        logger.debug("GPT prompts loaded successfully")

        # Parallel: Get insights AND summary from GPT 
        logger.info("Starting parallel GPT calls")
        insights_task = call_gpt(transcript, insights_prompt, "yandexgpt", iam_token) 
        summary_task = call_gpt(transcript, summary_prompt, "yandexgpt-lite", iam_token) 
        
        insights_json, summary = await asyncio.gather(
            insights_task,
            summary_task,
            return_exceptions=True
        )
        
        # Handle exceptions from GPT calls
        if isinstance(insights_json, Exception):
            logger.error("GPT insights call failed", exc_info=insights_json)
            raise insights_json
        if isinstance(summary, Exception):
            logger.error("GPT summary call failed", exc_info=summary)
            raise summary
            
        logger.info("Parallel GPT calls completed",
                   extra={
                       "insights_length": len(insights_json),
                       "summary_length": len(summary)
                   })

        # Parse text emotion and combine emotions (CPU-bound, run together)
        logger.debug("Parsing emotions and combining results")
        text_emotion, final_emotion = await asyncio.to_thread(
            lambda: parse_and_combine_emotions(insights_json, audio_emotion)
        )
        
        logger.debug("Emotions processed", 
                    extra={
                        "text_emotion": text_emotion,
                        "final_emotion": final_emotion
                    })

        # Prepare results
        results = {
            "transcript": transcript,
            "audio_emotion": audio_emotion,
            "text_emotion": text_emotion,
            "final_emotion": final_emotion,
            "insights": insights_json,
            "summary": summary
        }
        
        logger.info("Async audio analysis process completed successfully",
                   extra={"results_summary": {
                       "transcript_chars": len(transcript),
                       "final_emotion": final_emotion,
                       "summary_chars": len(summary)
                   }})
        
        return results

    except Exception as e:
        logger.error("Async audio analysis process failed",
                    extra={"audio_path": audio_path, "error": str(e)},
                    exc_info=True)
        raise


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('audio_analysis.log')
        ]
    )


async def main():
    setup_logging()
    audio_file = "ml/audio_samples/voice.ogg"
    result = await process_audio(audio_file)
    print(f"Result: {json.dumps(result, ensure_ascii=False, indent=2)}") 


async def process_multiple_audios(audio_paths: list[str]) -> list[Dict[str, Any]]:
    """
    Process multiple audio files in parallel
    """
    tasks = [process_audio(path) for path in audio_paths]
    return await asyncio.gather(*tasks, return_exceptions=True)


if __name__ == "__main__":
    asyncio.run(main())