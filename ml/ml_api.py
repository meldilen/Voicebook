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
    """
    Process audio file and return analysis results
    """
    try:
        logger.info(f"Processing audio file: {file.filename}")
        
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Process audio using existing function
            result = process_audio(temp_path)
            logger.info("Successfully processed audio file")
            return result
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
            
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

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