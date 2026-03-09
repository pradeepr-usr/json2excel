# # main.py

from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional
import json
from converter import json_to_excel_bytes, extract_fields
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://json2excel-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Summary-Sheets", "X-Summary-Rows", "X-Summary-Size-KB", "X-Summary-Time-Sec"]
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@app.get("/")
def health():
    return {"status": "JSON → Excel API running"}


@app.post("/convert/")
async def convert(
    file: UploadFile = File(...),
    fields: Optional[str] = Form(None),  # comma-separated selected field paths
):
    try:

        if not file.filename.lower().endswith(".json"):
            return JSONResponse(
                status_code=400,
                content={"error": "Only JSON files allowed"}
            )

        contents = await file.read()

        if not contents:
            return JSONResponse(
                status_code=400,
                content={"error": "Empty file"}
            )

        if len(contents) > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=400,
                content={"error": "File too large (max 5MB)"}
            )

        try:
            data = json.loads(contents)
        except json.JSONDecodeError:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid JSON format"}
            )

        if isinstance(data, list) and len(data) > 50000:
            return JSONResponse(
                status_code=400,
                content={"error": "JSON too large (max 50k objects)"}
            )

        del contents  # free memory

        # Parse selected fields
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
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )