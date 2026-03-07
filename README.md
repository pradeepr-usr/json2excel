# JSON → Excel Converter

A high-performance web application that converts complex JSON files into structured Excel spreadsheets.

The tool automatically **flattens nested JSON**, **preserves relationships between objects**, and generates **multiple Excel sheets** when required.

---

# 🌐 Live Demo

Frontend  
https://json2excel-frontend.onrender.com

Backend API (Swagger Docs)  
https://json2excel-app.onrender.com/docs

---

# 🚀 Features

- Convert JSON files to Excel instantly
- Handles **deeply nested JSON**
- Automatically generates **multiple relational sheets**
- Preserves hierarchy using `_id` and `_parent_id`
- Supports **arrays, nested objects, and mixed JSON structures**
- **Streaming Excel generation** for large files
- Automatic **column sizing**
- **Bold Excel headers**
- Safe Excel **sheet name handling**
- Built-in **JSON validation**
- **Error handling and file protection**

---

# 🧠 How It Works

The converter analyzes the JSON hierarchy and maps it into relational Excel sheets.

Example JSON:

```json
{
  "order_id": 101,
  "customer": {
    "name": "Pradeep"
  },
  "items": [
    { "product": "Laptop", "price": 70000 },
    { "product": "Mouse", "price": 1000 }
  ]
}


Generated Excel structure:

Sheet: root

| _id | _parent_id | order_id | customer.name |
| --- | ---------- | -------- | ------------- |
| 1   |            | 101      | Pradeep       |

Sheet: items

| _id | _parent_id | product | price |
| --- | ---------- | ------- | ----- |
| 2   | 1          | Laptop  | 70000 |
| 3   | 1          | Mouse   | 1000  |

This preserves the original JSON relationships inside Excel.

🏗 Architecture

React + Vite + Tailwind
        ↓
     FastAPI API
        ↓
    JSON Parser
        ↓
   OpenPyXL Engine
        ↓
   Excel File Download


🛠 Tech Stack
Frontend:

React
Vite
TailwindCSS
TypeScript

Backend:

Python
FastAPI
OpenPyXL
Uvicorn

Deployment:

Render (Frontend + Backend)


📂 Project Structure

json2excel
│
├── backend
│   ├── main.py
│   ├── converter.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   ├── package.json
│   └── vite.config.ts
│
└── README.md

⚙️ Local Setup

Clone repository

git clone https://github.com/pradeepr-usr/json2excel.git
cd json2excel
Backend Setup

Create virtual environment

python -m venv env
source env/bin/activate

Install dependencies

pip install -r backend/requirements.txt

Run backend

uvicorn backend.main:app --reload

Backend runs at:

http://127.0.0.1:8000
Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173
📡 API Endpoint
POST /convert/

Upload a JSON file and receive an Excel file.

Example request:

curl -X POST \
-F "file=@example.json" \
http://127.0.0.1:8000/convert/ \
--output output.xlsx
🛡 Safety Features

JSON format validation

File size protection

Row explosion protection

Safe Excel sheet naming

Memory-efficient Excel generation

📊 Performance

Typical conversion time:
| JSON Size         | Time   |
| ----------------- | ------ |
| Small (<100 rows) | <0.05s |
| Medium (~1k rows) | ~0.2s  |
| Large (~10k rows) | <1s    |

```

🔮 Future Improvements

>JSON preview before conversion

>Column selection UI

>Batch JSON file conversion

>Large JSON streaming

>Dark mode interface


👨‍💻 Author

Pradeep
Software Developer