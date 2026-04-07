import os
import io
import json
import base64
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
from PIL import Image
from openai import AsyncOpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
import asyncio

load_dotenv()

app = FastAPI(title="OCR AI Microservice")

# Allow Next.js frontend to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen2.5-vl-32b-instruct")

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# Set max concurrent requests to OpenRouter to manage rate limits efficiently
MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "5"))
api_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

SYSTEM_PROMPT = """Check the document image carefully and extract the following information:
1. tanggal (date)
2. nama pengirim (sender name)
3. nama pt (company name)
4. penerima (recipient)
5. total harga (total price)

Return the results ONLY as a valid JSON object without any markdown formatting like ```json or ```. The JSON keys must be exactly as follows:
{
  "tanggal": "",
  "nama_pengirim": "",
  "nama_pt": "",
  "penerima": "",
  "total_harga": ""
}"""

def process_file_to_base64_image(file_bytes: bytes, filename: str) -> str:
    """Converts a PDF or Image (JPEG, PNG) to a base64 encoded JPEG image."""
    try:
        if filename.lower().endswith(".pdf"):
            # Note: pdf2image requires poppler installed on the system map
            # If testing locally on Windows, ensure poppler bin is in PATH or provide poppler_path
            poppler_path = r"C:\Program Files (x86)\Poppler\poppler-25.12.0\Library\bin"
            if os.path.exists(poppler_path):
                pages = convert_from_bytes(file_bytes, first_page=1, last_page=1, poppler_path=poppler_path)
            else:
                pages = convert_from_bytes(file_bytes, first_page=1, last_page=1)
                
            if not pages:
                raise ValueError("No pages found in PDF")
            
            image = pages[0]
        else:
            # Handle image files (jpg, jpeg, png)
            image = Image.open(io.BytesIO(file_bytes))
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
        
        # Resize to save token context if necessary
        image.thumbnail((1024, 1024))
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return img_str
    except Exception as e:
        raise Exception(f"Failed to process file to image: {str(e)}")

async def process_single_file(file: UploadFile) -> Dict[str, Any]:
    allowed_extensions = (".pdf", ".jpeg", ".jpg", ".png")
    if not file.filename.lower().endswith(allowed_extensions):
        return {"filename": file.filename, "status": "error", "message": "File must be a PDF, JPEG, JPG, or PNG"}
    
    # Re-check key from env if it was empty on startup
    api_key = OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        return {"filename": file.filename, "status": "error", "message": "OpenRouter API Key is not configured"}

    # Update client key if it was missing 
    if not client.api_key or client.api_key == "":
        client.api_key = api_key

    try:
        # 1. Read file bytes
        file_bytes = await file.read()
        
        # 2. Convert file to base64 image
        base64_image = process_file_to_base64_image(file_bytes, file.filename)
        
        # 3. Call OpenRouter setup
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": SYSTEM_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

        # 4. Request completion with concurrency limit and token limit
        async with api_semaphore:
            response = await client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                max_tokens=600, # Explicitly limit tokens for cost and speed efficiency
            )

        output_text = response.choices[0].message.content
        
        # 5. Clean and parse output to ensure valid JSON
        cleaned_output = output_text.strip()
        if cleaned_output.startswith("```json"):
            cleaned_output = cleaned_output[7:]
        if cleaned_output.endswith("```"):
            cleaned_output = cleaned_output[:-3]
        elif cleaned_output.startswith("```"):
            cleaned_output = cleaned_output[3:]
            
        cleaned_output = cleaned_output.strip()
        
        try:
            parsed_json = json.loads(cleaned_output)
            return {"filename": file.filename, "status": "success", "data": parsed_json}
        except json.JSONDecodeError:
            print("Failed to parse JSON. Raw output:", cleaned_output)
            # Fallback if the output wasn't valid JSON
            return {
                "filename": file.filename,
                "status": "error", 
                "message": "Failed to parse model output as JSON", 
                "raw_output": output_text
            }

    except Exception as e:
        return {"filename": file.filename, "status": "error", "message": f"Error extracting file: {str(e)}"}

@app.post("/api/extract-pdf")
@app.post("/api/extract")
async def extract_document(file: UploadFile = File(...)):
    result = await process_single_file(file)
    if result["status"] == "error":
        raise HTTPException(status_code=400 if "must be a" in result["message"] else 500, detail=result["message"])
    return {"status": "success", "data": result["data"]}

@app.post("/api/extract-batch")
async def extract_documents_batch(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    tasks = [process_single_file(file) for file in files]
    results = await asyncio.gather(*tasks)
    
    return {"status": "success", "data": results}

@app.get("/health")
def health_check():
    return {"status": "ok"}
