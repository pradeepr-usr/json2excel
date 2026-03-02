from fastapi import FastAPI, UploadFile, File
import json
import os
from converter import json_to_excel
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

@app.post("/convert/")
async def convert(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(".json"):
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
                content={"error": "File too large (max 2MB)"}
            )

        try:
            data = json.loads(contents)
        except json.JSONDecodeError:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid JSON format"}
            )

        output_path = f"{UPLOAD_DIR}/output.xlsx"
        json_to_excel(data, output_path)

        return FileResponse(
            path=output_path,
            filename="converted.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

app.mount("/", StaticFiles(directory="static", html=True), name="static")
