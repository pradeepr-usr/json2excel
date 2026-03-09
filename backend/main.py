# # # main.py

from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional, List
import json
from converter import json_to_excel_bytes, extract_fields, batch_to_excel_bytes
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://json2excel-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",
        "X-Summary-Sheets", "X-Summary-Rows", "X-Summary-Size-KB", "X-Summary-Time-Sec",
        "X-Summary-Files", "X-Summary-Errors",
    ]
)

MAX_FILE_SIZE = 5 * 1024 * 1024   # 5MB per file
MAX_BATCH_FILES = 10
MAX_BATCH_TOTAL = 20 * 1024 * 1024  # 20MB total for batch


@app.get("/")
def health():
    return {"status": "JSON → Excel API running"}


@app.post("/convert/")
async def convert(
    file: UploadFile = File(...),
    fields: Optional[str] = Form(None),
):
    try:
        if not file.filename.lower().endswith(".json"):
            return JSONResponse(status_code=400, content={"error": "Only JSON files allowed"})

        contents = await file.read()

        if not contents:
            return JSONResponse(status_code=400, content={"error": "Empty file"})
        if len(contents) > MAX_FILE_SIZE:
            return JSONResponse(status_code=400, content={"error": "File too large (max 5MB)"})

        try:
            data = json.loads(contents)
        except json.JSONDecodeError:
            return JSONResponse(status_code=400, content={"error": "Invalid JSON format"})

        if isinstance(data, list) and len(data) > 50000:
            return JSONResponse(status_code=400, content={"error": "JSON too large (max 50k objects)"})

        del contents

        selected_fields = None
        if fields and fields.strip():
            selected_fields = [f.strip() for f in fields.split(",") if f.strip()]

        original_name = file.filename.rsplit(".", 1)[0]
        excel_buffer, summary = json_to_excel_bytes(data, selected_fields)

        headers = {
            "Content-Disposition": f'attachment; filename="{original_name}.xlsx"',
            "X-Summary-Sheets": str(summary["sheets"]),
            "X-Summary-Rows": str(summary["rows"]),
            "X-Summary-Size-KB": str(summary["file_size_kb"]),
            "X-Summary-Time-Sec": str(summary["time_sec"]),
        }

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/batch-convert/")
async def batch_convert(
    files: List[UploadFile] = File(...),
):
    try:
        if len(files) < 2:
            return JSONResponse(status_code=400, content={"error": "Batch requires at least 2 files"})

        if len(files) > MAX_BATCH_FILES:
            return JSONResponse(status_code=400, content={"error": f"Max {MAX_BATCH_FILES} files allowed"})

        # Validate and read all files
        file_data: list[tuple[str, bytes]] = []
        total_size = 0

        for upload in files:
            if not upload.filename.lower().endswith(".json"):
                return JSONResponse(
                    status_code=400,
                    content={"error": f"{upload.filename} is not a JSON file"}
                )

            contents = await upload.read()

            if not contents:
                return JSONResponse(status_code=400, content={"error": f"{upload.filename} is empty"})

            if len(contents) > MAX_FILE_SIZE:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"{upload.filename} exceeds 5MB limit"}
                )

            total_size += len(contents)
            if total_size > MAX_BATCH_TOTAL:
                return JSONResponse(status_code=400, content={"error": "Total batch size exceeds 20MB"})

            file_name = upload.filename.rsplit(".", 1)[0]
            file_data.append((file_name, contents))

        excel_buffer, summary = batch_to_excel_bytes(file_data)

        headers = {
            "Content-Disposition": 'attachment; filename="batch_converted.xlsx"',
            "X-Summary-Files": str(summary["files"]),
            "X-Summary-Sheets": str(summary["sheets"]),
            "X-Summary-Rows": str(summary["rows"]),
            "X-Summary-Size-KB": str(summary["file_size_kb"]),
            "X-Summary-Time-Sec": str(summary["time_sec"]),
            "X-Summary-Errors": str(len(summary["errors"])),
        }

        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )

    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})