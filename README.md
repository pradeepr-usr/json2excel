# JSON → Excel Converter

A simple web app that converts JSON files into Excel spreadsheets instantly.

## 🚀 Features
- Upload any JSON file
- Automatically converts to Excel (.xlsx)
- Fast and lightweight
- Simple UI
- Built with FastAPI backend

---

## 🛠 Tech Stack
- Python
- FastAPI
- Pandas
- HTML (Frontend)
- Uvicorn server

---

## 📂 Project Structure

.
├── main.py
├── converter.py
├── requirements.txt
├── Procfile
├── static/
│ └── index.html
└── .gitignore


---

## ⚙️ Installation (Local Setup)

```bash
git clone https://github.com/YOUR_USERNAME/json2excel.git
cd json2excel
python -m venv env
source env/bin/activate
pip install -r requirements.txt

Run server:
uvicorn main:app --reload

Open browser:

http://127.0.0.1:8000

🌐 Deployment

This app is ready to deploy on platforms like:

Render

Railway

VPS servers

Start command used in production:

uvicorn main:app --host 0.0.0.0 --port $PORT
📥 Usage

Upload JSON file

Click Convert

Download Excel file

📌 Example JSON
[
  {"name": "John", "age": 25},
  {"name": "Anna", "age": 22}
]
🧠 Future Improvements

Drag & drop upload

JSON validation preview

Column selector

Dark mode UI

API endpoint support

👨‍💻 Author

Pradeep