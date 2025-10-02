from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import json
from typing import Dict, Any
import tempfile
import os

from main import process_audio
from services.gpt import call_gpt
from services.emotion_utils import combine_emotions
from config import FOLDER_ID
from utils import get_iam_token, load_prompt

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Changed working directory to: {os.getcwd()}")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ML Service API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process_audio")
async def process_audio_endpoint(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing audio file: {file.filename}")
        
        # Debug: show current working directory
        current_dir = os.getcwd()
        script_dir = os.path.dirname(os.path.abspath(__file__))
        logger.info(f"Current working directory: {current_dir}")
        logger.info(f"Script directory: {script_dir}")
        
        # List files in prompts directory
        prompts_path = os.path.join(script_dir, "prompts")
        if os.path.exists(prompts_path):
            logger.info(f"Prompts directory contents: {os.listdir(prompts_path)}")
        else:
            logger.error(f"Prompts directory not found at: {prompts_path}")
        # Read the file content first
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        # Detect actual file format from content
        file_extension = detect_audio_format(content) or ".wav"
        logger.info(f"Detected audio format: {file_extension}")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            logger.info(f"Saved temporary file to: {temp_path}")
            
            # Convert to proper format for processing
            converted_path = ensure_audio_format(temp_path)
            final_path = converted_path if converted_path else temp_path
            logger.info(f"Using audio file: {final_path}")
            
            # Process audio using your existing function
            result = process_audio(final_path)
            logger.info("Successfully processed audio file")
            
            # Format response for Go client
            response_data = {
                "transcript": result.get("transcript", ""),
                "text": result.get("transcript", ""),
                "summary": result.get("summary", ""),
                "emotion": result.get("final_emotion", "neutral"),
                "insights": result.get("insights", {})
            }
            
            return response_data
            
        finally:
            # Clean up temporary files
            for path in [temp_path, converted_path]:
                if path and os.path.exists(path):
                    try:
                        os.unlink(path)
                        logger.info(f"Cleaned up: {path}")
                    except Exception as e:
                        logger.warning(f"Failed to clean up {path}: {e}")
            
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

def detect_audio_format(content: bytes) -> str:
    """Detect audio format from file content"""
    try:
        # Check for common audio file signatures
        if content.startswith(b'RIFF') and b'WAVE' in content[:12]:
            return ".wav"
        elif content.startswith(b'OggS') or content.startswith(b'OpusHead'):
            return ".ogg"
        elif content.startswith(b'ID3') or content.startswith(b'\xFF\xFB'):
            return ".mp3"
        elif content.startswith(b'fLaC'):
            return ".flac"
        else:
            # Default to .wav if unknown
            return ".wav"
    except:
        return ".wav"

def ensure_audio_format(input_path: str) -> str:
    """Ensure audio is in a format that can be processed"""
    try:
        import subprocess
        
        output_path = input_path + ".converted.wav"
        
        # Convert to standard WAV format that all libraries can read
        cmd = [
            'ffmpeg', '-i', input_path,
            '-acodec', 'pcm_s16le',  # 16-bit PCM
            '-ac', '1',              # Mono
            '-ar', '16000',          # 16kHz sample rate
            '-y',                    # Overwrite output
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and os.path.exists(output_path):
            logger.info(f"Successfully converted audio to: {output_path}")
            return output_path
        else:
            logger.warning(f"Audio conversion failed: {result.stderr}")
            return None
            
    except Exception as e:
        logger.warning(f"Audio conversion error: {e}")
        return None
    
@app.post("/analyze_text")
async def analyze_text_endpoint(payload: Dict[str, Any]):
    """
    Analyze text and return insights with emotion
    """
    try:
        text = payload.get("text", "")
        logger.info(f"Analyzing text, length: {len(text)}")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        iam_token = get_iam_token()
        insights_prompt = load_prompt("ml/prompts/insights.txt")
        
        insights_json = call_gpt(text, insights_prompt, "yandexgpt", iam_token)
        insights_data = json.loads(insights_json)
        
        result = {
            "emotion": insights_data.get("emotion", ""),
            "insights": insights_data,
            "text": text,
            "summary": ""  # No summary for text-only analysis
        }
        
        logger.info("Successfully analyzed text")
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@app.post("/summarize")
async def summarize_text_endpoint(payload: Dict[str, Any]):
    """
    Generate summary for combined text
    """
    try:
        text = payload.get("text", "")
        logger.info(f"Generating summary for text, length: {len(text)}")
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        iam_token = get_iam_token()
        summary_prompt = load_prompt("ml/prompts/summary.txt")
        
        summary = call_gpt(text, summary_prompt, "yandexgpt-lite", iam_token)
        
        result = {
            "summary": summary,
            "emotion": ""  # No emotion analysis for summary-only endpoint
        }
        
        logger.info("Successfully generated summary")
        return result
        
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ML API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)