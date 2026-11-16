from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from routers.portfolio_routes import get_current_user
import models
import PyPDF2
import io
from services.llm_parser import parse_resume

router = APIRouter(prefix="/api/resume", tags=["Resume"])

MAX_BYTES = 10 * 1024 * 1024  # 10 MB limit


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), _user: models.User = Depends(get_current_user)):
    # 1. Validate file extension
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # 2. Read the raw PDF file directly into memory
        pdf_content = await file.read()
        if len(pdf_content) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="PDF is larger than 10 MB.")

        # 3. Extract text from the PDF pages
        raw_text = ""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    raw_text += text + "\n"
        except Exception as e:
            print(f"PyPDF2 extraction error: {e}")

        # Guard: Check if PDF has extractable text (catches scanned/image-only PDFs)
        if not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF. Please make sure the PDF contains selectable text (not an image scan)."
            )

        # 4. Parse with NVIDIA NIM engine
        parsed_data = parse_resume(pdf_bytes=pdf_content, raw_text=raw_text)

        return {"message": "Resume parsed successfully", "data": parsed_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")