import os
import tempfile
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from main import process_audio

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

def detect_audio_format(content: bytes) -> str:
    """Detect audio format from file content"""
    # Check for OGG/Opus signature
    if content.startswith(b'OggS') or content.startswith(b'OpusHead'):
        return ".ogg"
    # Check for WebM (often used with Opus in browsers)
    elif content.startswith(b'\x1A\x45\xDF\xA3'):  # WebM signature
        return ".webm"
    # Check for WAV
    elif content.startswith(b'RIFF') and b'WAVE' in content[:12]:
        return ".wav"
    else:
        # Default to .ogg for browser recordings
        return ".ogg"

@app.post("/process_audio")
async def process_audio_endpoint(file: UploadFile = File(...)):
    """
    Process audio file and return analysis results
    """
    try:
        logger.info(f"Processing audio file: {file.filename}, type: {file.content_type}")
        
        # Read the file content
        content = await file.read()
        logger.info(f"File size: {len(content)} bytes")
        
        # Detect actual format
        file_extension = detect_audio_format(content)
        logger.info(f"Detected audio format: {file_extension}")
        
        # Save original file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(content)
            original_path = temp_file.name
        
        try:
            logger.info(f"Saved temporary file to: {original_path}")
            
            # Process audio (STT service will handle OGG conversion internally)
            result = process_audio(original_path)
            logger.info("Successfully processed audio file")
            
            emotion = result.get("emotion") or result.get("final_emotion") or "neutral"
            # Format response for Go client
            response_data = {
                "transcript": result.get("transcript", ""),
                "text": result.get("transcript", ""),
                "summary": result.get("summary", ""),
                "emotion": emotion,
                "insights": result.get("insights", {})
            }
            
            # If insights is a string, try to parse it
            if isinstance(response_data["insights"], str):
                try:
                    response_data["insights"] = json.loads(response_data["insights"])
                except:
                    response_data["insights"] = {"raw": response_data["insights"]}
            
            return response_data
            
        finally:
            # Clean up temporary file
            if os.path.exists(original_path):
                try:
                    os.unlink(original_path)
                    logger.info(f"Cleaned up: {original_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up {original_path}: {e}")
            
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.post("/analyze_text")
async def analyze_text_endpoint(request: dict):
    """
    Analyze text and return insights
    """
    try:
        logger.info(f"Analyzing text: {request.get('text', '')[:100]}...")
        
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # For now, return mock insights since we don't have the full implementation
        # You'll need to implement the actual text analysis logic here
        mock_insights = {
            "emotion": "neutral",
            "key_points": ["Анализ текста временно недоступен"],
            "summary": "Сервис анализа текста находится в разработке"
        }
        
        response_data = {
            "emotion": "neutral",
            "summary": "Анализ текста",
            "text": text,
            "transcript": text,
            "insights": mock_insights
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@app.post("/summarize")
async def summarize_text_endpoint(request: dict):
    """
    Summarize text
    """
    try:
        logger.info(f"Summarizing text: {request.get('text', '')[:100]}...")
        
        text = request.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Return mock summary for now
        response_data = {
            "emotion": "neutral", 
            "summary": f"Сводка текста: {text[:100]}..."
        }
        
        return response_data
        
    except Exception as e:
        logger.error(f"Error summarizing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error summarizing text: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ML API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)