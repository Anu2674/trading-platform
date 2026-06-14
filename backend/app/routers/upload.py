from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
import os, uuid

load_dotenv()

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
ALLOWED_EXTENSIONS = {".zip", ".tar", ".gz", ".cpp", ".rs", ".go"}
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("/upload")
async def upload_submission(
    team_name: str = Form(...),
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Accepted: {ALLOWED_EXTENSIONS}"
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50MB limit.")

    submission_id = str(uuid.uuid4())
    save_dir = os.path.join(UPLOAD_DIR, submission_id)
    os.makedirs(save_dir, exist_ok=True)

    file_path = os.path.join(save_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    import json
    with open(os.path.join(save_dir, "_meta.json"), "w") as f:
        json.dump({"team_name": team_name, "submission_id": submission_id}, f)

    return {
        "submission_id": submission_id,
        "team_name": team_name,
        "filename": file.filename,
        "size_kb": round(len(contents) / 1024, 2),
        "status": "uploaded",
    }
