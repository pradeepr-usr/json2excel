# JSON → Excel Converter

A high-performance web application that converts complex JSON files into structured Excel spreadsheets.

This tool automatically flattens nested JSON, preserves relationships between objects, and generates multiple Excel sheets when required.

---

# 🚀 Features

- Convert JSON files to Excel instantly
- Handles **deeply nested JSON**
- Automatically creates **multiple relational sheets**
- Maintains **parent-child relationships** using `_id` and `_parent_id`
- Supports **arrays, nested objects, and mixed JSON structures**
- **Streaming Excel writer** for faster performance
- **Auto column sizing**
- **Bold Excel headers**
- Safe Excel **sheet name handling**
- Built-in **JSON validation**
- File size protection and error handling

---

# 🧠 How It Works

The converter analyzes JSON structure and generates Excel sheets based on hierarchy.

Example:

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
```

Generated Excel structure:

### Sheet: `root`

| \_id | \_parent_id | order_id | customer.name |
| ---- | ----------- | -------- | ------------- |
| 1    |             | 101      | Pradeep       |

### Sheet: `items`

| \_id | \_parent_id | product | price |
| ---- | ----------- | ------- | ----- |
| 2    | 1           | Laptop  | 70000 |
| 3    | 1           | Mouse   | 1000  |

This relational structure preserves the original JSON hierarchy.

---

# 🛠 Tech Stack

Backend

- Python
- FastAPI
- OpenPyXL (Excel generation)
- Uvicorn

Frontend

- HTML / JavaScript (initial version)

---

# 📂 Project Structure

```
.
├── main.py            # FastAPI API server
├── converter.py       # JSON → Excel conversion engine
├── requirements.txt
├── Procfile
├── static/
│   └── index.html
└── README.md
```

---

# ⚙️ Installation (Local Setup)

Clone repository

```bash
git clone https://github.com/YOUR_USERNAME/json2excel.git
cd json2excel
```

Create virtual environment

```bash
python -m venv env
source env/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run the server

```bash
uvicorn main:app --reload
```

Open browser

```
http://127.0.0.1:8000
```

---

# 📡 API Endpoint

### POST `/convert/`

Upload a JSON file and receive an Excel file.

Example request using curl:

```bash
curl -X POST \
  -F "file=@example.json" \
  http://127.0.0.1:8000/convert/ \
  --output output.xlsx
```

---

# 🛡 Safety Features

- JSON format validation
- File size protection
- Row explosion protection
- Safe Excel sheet naming
- Memory-efficient streaming writer

---

# 📥 Usage

1. Upload a JSON file
2. Click **Convert**
3. Download the generated Excel file

---

# 📌 Supported JSON Structures

The converter supports:

- Flat JSON
- Deeply nested JSON
- Arrays of objects
- Arrays of primitive values
- Mixed structures

Example:

```json
{
  "user": {
    "name": "Alice",
    "skills": ["Python", "SQL"]
  }
}
```

---

# 🧪 Performance

Typical conversion time:

| JSON Size         | Time    |
| ----------------- | ------- |
| Small (<100 rows) | < 0.05s |
| Medium (1k rows)  | ~0.2s   |
| Large (10k rows)  | < 1s    |

---

# 🌐 Deployment

This application can be deployed on platforms like:

- Render
- Railway
- VPS servers

Production start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

# 🔮 Future Improvements

- React frontend UI
- Drag & drop JSON upload
- JSON preview before conversion
- Column selection
- Large JSON streaming support
- Dark mode interface

---

# 👨‍💻 Author

Pradeep
Software Developer
