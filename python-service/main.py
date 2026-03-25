import os
import io
import json
import base64
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pdf2image import convert_from_bytes
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
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-vl-7b-instruct")

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

def process_pdf_to_base64_image(pdf_bytes: bytes) -> str:
    """Converts the first page of a PDF to a base64 encoded JPEG image."""
    try:
        # Note: pdf2image requires poppler installed on the system map
        # If testing locally on Windows, ensure poppler bin is in PATH or provide poppler_path
        poppler_path = r"C:\Program Files (x86)\Poppler\poppler-25.12.0\Library\bin"
        if os.path.exists(poppler_path):
            pages = convert_from_bytes(pdf_bytes, first_page=1, last_page=1, poppler_path=poppler_path)
        else:
            pages = convert_from_bytes(pdf_bytes, first_page=1, last_page=1)
            
        if not pages:
            raise ValueError("No pages found in PDF")
        
        image = pages[0]
        
        # Resize to save token context if necessary
        image.thumbnail((1024, 1024))
        
        # Convert to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return img_str
    except Exception as e:
        raise Exception(f"Failed to convert PDF to image: {str(e)}")

@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Re-check key from env if it was empty on startup
    api_key = OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API Key is not configured")

    # Update client key if it was missing 
    if not client.api_key or client.api_key == "":
        client.api_key = api_key

    try:
        # 1. Read PDF file bytes
        pdf_bytes = await file.read()
        
        # 2. Convert first page to base64 image
        base64_image = process_pdf_to_base64_image(pdf_bytes)
        
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
            return {"status": "success", "data": parsed_json}
        except json.JSONDecodeError:
            print("Failed to parse JSON. Raw output:", cleaned_output)
            # Fallback if the output wasn't valid JSON
            return {
                "status": "error", 
                "message": "Failed to parse model output as JSON", 
                "raw_output": output_text
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting PDF: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ok"}
