# # # # main.py

# from fastapi import FastAPI, UploadFile, File, Form
# from typing import Optional, List
# import json
# from converter import json_to_excel_bytes, extract_fields, batch_to_excel_bytes
# from fastapi.responses import StreamingResponse, JSONResponse
# from fastapi.middleware.cors import CORSMiddleware
# import traceback

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "https://json2excel-frontend.onrender.com"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=[
#         "Content-Disposition",
#         "X-Summary-Sheets", "X-Summary-Rows", "X-Summary-Size-KB", "X-Summary-Time-Sec",
#         "X-Summary-Files", "X-Summary-Errors",
#     ]
# )

# MAX_FILE_SIZE = 5 * 1024 * 1024   # 5MB per file
# MAX_BATCH_FILES = 10
# MAX_BATCH_TOTAL = 20 * 1024 * 1024  # 20MB total for batch


# @app.get("/")
# def health():
#     return {"status": "JSON → Excel API running"}


# @app.post("/convert/")
# async def convert(
#     file: UploadFile = File(...),
#     fields: Optional[str] = Form(None),
# ):
#     try:
#         if not file.filename.lower().endswith(".json"):
#             return JSONResponse(status_code=400, content={"error": "Only JSON files allowed"})

#         contents = await file.read()

#         if not contents:
#             return JSONResponse(status_code=400, content={"error": "Empty file"})
#         if len(contents) > MAX_FILE_SIZE:
#             return JSONResponse(status_code=400, content={"error": "File too large (max 5MB)"})

#         try:
#             data = json.loads(contents)
#         except json.JSONDecodeError:
#             return JSONResponse(status_code=400, content={"error": "Invalid JSON format"})

#         if isinstance(data, list) and len(data) > 50000:
#             return JSONResponse(status_code=400, content={"error": "JSON too large (max 50k objects)"})

#         del contents

#         selected_fields = None
#         if fields and fields.strip():
#             selected_fields = [f.strip() for f in fields.split(",") if f.strip()]

#         original_name = file.filename.rsplit(".", 1)[0]
#         excel_buffer, summary = json_to_excel_bytes(data, selected_fields)

#         headers = {
#             "Content-Disposition": f'attachment; filename="{original_name}.xlsx"',
#             "X-Summary-Sheets": str(summary["sheets"]),
#             "X-Summary-Rows": str(summary["rows"]),
#             "X-Summary-Size-KB": str(summary["file_size_kb"]),
#             "X-Summary-Time-Sec": str(summary["time_sec"]),
#         }

#         return StreamingResponse(
#             excel_buffer,
#             media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#             headers=headers
#         )

#     except Exception as e:
#         return JSONResponse(status_code=500, content={"error": str(e)})


# @app.post("/batch-convert/")
# async def batch_convert(
#     files: List[UploadFile] = File(...),
# ):
#     try:
#         if len(files) < 2:
#             return JSONResponse(status_code=400, content={"error": "Batch requires at least 2 files"})

#         if len(files) > MAX_BATCH_FILES:
#             return JSONResponse(status_code=400, content={"error": f"Max {MAX_BATCH_FILES} files allowed"})

#         # Validate and read all files
#         file_data: list[tuple[str, bytes]] = []
#         total_size = 0

#         for upload in files:
#             if not upload.filename.lower().endswith(".json"):
#                 return JSONResponse(
#                     status_code=400,
#                     content={"error": f"{upload.filename} is not a JSON file"}
#                 )

#             contents = await upload.read()

#             if not contents:
#                 return JSONResponse(status_code=400, content={"error": f"{upload.filename} is empty"})

#             if len(contents) > MAX_FILE_SIZE:
#                 return JSONResponse(
#                     status_code=400,
#                     content={"error": f"{upload.filename} exceeds 5MB limit"}
#                 )

#             total_size += len(contents)
#             if total_size > MAX_BATCH_TOTAL:
#                 return JSONResponse(status_code=400, content={"error": "Total batch size exceeds 20MB"})

#             file_name = upload.filename.rsplit(".", 1)[0]
#             file_data.append((file_name, contents))

#         excel_buffer, summary = batch_to_excel_bytes(file_data)

#         headers = {
#             "Content-Disposition": 'attachment; filename="batch_converted.xlsx"',
#             "X-Summary-Files": str(summary["files"]),
#             "X-Summary-Sheets": str(summary["sheets"]),
#             "X-Summary-Rows": str(summary["rows"]),
#             "X-Summary-Size-KB": str(summary["file_size_kb"]),
#             "X-Summary-Time-Sec": str(summary["time_sec"]),
#             "X-Summary-Errors": str(len(summary["errors"])),
#         }

#         return StreamingResponse(
#             excel_buffer,
#             media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#             headers=headers
#         )

#     except Exception as e:
#         traceback.print_exc()
#         return JSONResponse(status_code=500, content={"error": str(e)})

from fastapi import FastAPI, UploadFile, File, Form, Request
from typing import Optional, List
import json
from converter import json_to_excel_bytes, extract_fields, batch_to_excel_bytes
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI(
    title="JSON → Excel API",
    description="Convert JSON to Excel via file upload or raw JSON body.",
    version="1.0.0",
)

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

MAX_FILE_SIZE   = 5  * 1024 * 1024   # 5MB per file
MAX_BATCH_FILES = 10
MAX_BATCH_TOTAL = 20 * 1024 * 1024   # 20MB total for batch
MAX_JSON_BODY   = 5  * 1024 * 1024   # 5MB raw JSON body


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {"status": "JSON → Excel API running", "version": "1.0.0"}


# ─── Single File Upload ───────────────────────────────────────────────────────

@app.post("/convert/", tags=["Convert"], summary="Convert a JSON file to Excel")
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
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})


# ─── Batch File Upload ────────────────────────────────────────────────────────

@app.post("/batch-convert/", tags=["Convert"], summary="Convert multiple JSON files into one Excel workbook")
async def batch_convert(
    files: List[UploadFile] = File(...),
):
    try:
        if len(files) < 2:
            return JSONResponse(status_code=400, content={"error": "Batch requires at least 2 files"})
        if len(files) > MAX_BATCH_FILES:
            return JSONResponse(status_code=400, content={"error": f"Max {MAX_BATCH_FILES} files allowed"})

        file_data: list[tuple[str, bytes]] = []
        total_size = 0

        for upload in files:
            if not upload.filename.lower().endswith(".json"):
                return JSONResponse(status_code=400, content={"error": f"{upload.filename} is not a JSON file"})

            contents = await upload.read()

            if not contents:
                return JSONResponse(status_code=400, content={"error": f"{upload.filename} is empty"})
            if len(contents) > MAX_FILE_SIZE:
                return JSONResponse(status_code=400, content={"error": f"{upload.filename} exceeds 5MB limit"})

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


# ─── API Mode: Raw JSON Body ──────────────────────────────────────────────────

@app.post(
    "/convert-json/",
    tags=["API Mode"],
    summary="Convert raw JSON body to Excel — no file upload needed",
    description="""
Send JSON directly in the request body.

**Basic usage:**
```bash
curl -X POST https://json2excel-app.onrender.com/convert-json/ \\
  -H "Content-Type: application/json" \\
  -d '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]' \\
  --output result.xlsx
```

**With field filtering and custom filename:**
```bash
curl -X POST "https://json2excel-app.onrender.com/convert-json/?fields=id,name&filename=users" \\
  -H "Content-Type: application/json" \\
  -d '[{"id": 1, "name": "Alice", "internal_code": "X1"}]' \\
  --output users.xlsx
```

**Query params:**
- `fields` — comma-separated list of fields to include (optional, default: all)
- `filename` — output filename without extension (optional, default: output)
""",
)
async def convert_json(
    request: Request,
    fields: Optional[str] = None,
    filename: Optional[str] = "output",
):
    try:
        body = await request.body()

        if not body:
            return JSONResponse(status_code=400, content={"error": "Empty request body"})
        if len(body) > MAX_JSON_BODY:
            return JSONResponse(status_code=400, content={"error": "Body too large (max 5MB)"})

        try:
            data = json.loads(body)
        except json.JSONDecodeError as e:
            return JSONResponse(status_code=400, content={"error": f"Invalid JSON: {str(e)}"})

        if not isinstance(data, (dict, list)):
            return JSONResponse(status_code=400, content={"error": "JSON must be an object or array"})

        if isinstance(data, list) and len(data) > 50000:
            return JSONResponse(status_code=400, content={"error": "JSON too large (max 50k objects)"})

        selected_fields = None
        if fields and fields.strip():
            selected_fields = [f.strip() for f in fields.split(",") if f.strip()]

        # Sanitize filename — alphanumeric, hyphens, underscores only
        safe_filename = "".join(c for c in (filename or "output") if c.isalnum() or c in "-_") or "output"

        excel_buffer, summary = json_to_excel_bytes(data, selected_fields)

        headers = {
            "Content-Disposition": f'attachment; filename="{safe_filename}.xlsx"',
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
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})