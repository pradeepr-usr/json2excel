from fastapi import FastAPI, UploadFile, File
import json
from converter import json_to_excel_bytes
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 2MB


@app.get("/")
def health():
    return {"status": "JSON → Excel API running"}


@app.post("/convert/")
async def convert(file: UploadFile = File(...)):
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
        
        # Protect against massive JSON arrays
        if isinstance(data, list) and len(data) > 50000:
            return JSONResponse(
                status_code=400,
                content={"error": "JSON too large (max 50k objects)"}
            )
        
        del contents  # free memory

        original_name = file.filename.rsplit(".", 1)[0]

        excel_buffer = json_to_excel_bytes(data)

        headers = {
            "Content-Disposition": f'attachment; filename="{original_name}.xlsx"'
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