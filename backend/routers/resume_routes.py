from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from routers.portfolio_routes import get_current_user
import models
import PyPDF2
import io
from services.llm_parser import parse_resume_text

router = APIRouter(prefix="/api/resume", tags=["Resume"])

MAX_BYTES = 10 * 1024 * 1024


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), _user: models.User = Depends(get_current_user)):
    # 1. Validate it's a PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # 2. Read the PDF file directly from memory
        pdf_content = await file.read()
        if len(pdf_content) > MAX_BYTES:
            raise HTTPException(status_code=413, detail="PDF is larger than 10 MB.")
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))

        # 3. Extract all text from the pages
        raw_text = ""
        for page in pdf_reader.pages:
            raw_text += (page.extract_text() or "") + "\n"

        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF.")

        # 4. Send the text to Gemini to get structured data
        parsed_data = parse_resume_text(raw_text)

        return {"message": "Resume parsed successfully", "data": parsed_data}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing resume: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse resume.")