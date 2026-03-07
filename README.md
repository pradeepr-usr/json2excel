# JSON → Excel Converter

A high-performance web application that converts complex JSON files into structured Excel spreadsheets. The tool automatically flattens nested JSON, preserves relationships between objects, and generates multiple Excel sheets when required.

---

## 🌐 Live Demo

**Frontend**
https://json2excel-frontend.onrender.com

**Backend API (Swagger Docs)**
https://json2excel-app.onrender.com/docs

---

<!-- Screenshot: Full app UI (dark theme, empty state, no file selected) -->
<!-- Add: docs/screenshots/ui-overview.png -->

---

## 🚀 Features

- Convert JSON files to Excel instantly
- Handles deeply nested JSON structures
- Automatically generates multiple relational sheets
- Preserves hierarchy using `_id` and `_parent_id`
- Supports arrays, nested objects, and mixed JSON structures
- Streaming Excel generation for large files
- Automatic column sizing with bold headers
- Safe Excel sheet name handling
- Built-in JSON validation and error handling
- **JSON structure preview** before conversion
- **Conversion summary** — sheets, rows, file size, and time after every conversion
- **Upload progress bar** with real-time percentage
- **Drag & drop** with visual feedback

---

## 🖼 Screenshots

### Upload & Preview

![description](docs/screenshots/ui-overview.png)
![description](docs/screenshots/json-preview2.png)

### Conversion Summary

![description](docs/screenshots/conversion-summary.png)

### Excel Output

![description](docs/screenshots/root.png)
![description](docs/screenshots/items.png)

---

## 🧠 How It Works

The converter analyzes the JSON hierarchy and maps it into relational Excel sheets.

**Example input:**

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

**Generated Excel structure:**

Sheet: `root`

| \_id | \_parent_id | order_id | customer.name |
| ---- | ----------- | -------- | ------------- |
| 1    |             | 101      | Pradeep       |

Sheet: `items`

| \_id | \_parent_id | product | price |
| ---- | ----------- | ------- | ----- |
| 2    | 1           | Laptop  | 70000 |
| 3    | 1           | Mouse   | 1000  |

This structure preserves the original JSON relationships inside Excel.

---

## 🏗 Architecture

```
React + Vite + Tailwind v4
        ↓
     FastAPI API
        ↓
    JSON Parser
        ↓
   OpenPyXL Engine
        ↓
  Excel File Download
```

---

## 🛠 Tech Stack

**Frontend:** React, Vite, TailwindCSS v4, TypeScript

**Backend:** Python, FastAPI, OpenPyXL, Uvicorn

**Deployment:** Render (Frontend + Backend)

---

## 📂 Project Structure

```
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
```

---

## ⚙️ Local Setup

**1. Clone the repository**

```bash
git clone https://github.com/pradeepr-usr/json2excel.git
cd json2excel
```

**2. Backend**

```bash
python -m venv env
source env/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Runs at `http://127.0.0.1:8000`

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`

---

## 📡 API

`POST /convert/` — Upload a JSON file and receive an Excel file in return.

```bash
curl -X POST \
  -F "file=@example.json" \
  http://127.0.0.1:8000/convert/ \
  --output output.xlsx
```

**Response headers include conversion metadata:**

| Header               | Description                |
| -------------------- | -------------------------- |
| `X-Summary-Sheets`   | Number of sheets generated |
| `X-Summary-Rows`     | Total rows written         |
| `X-Summary-Size-KB`  | Output file size in KB     |
| `X-Summary-Time-Sec` | Processing time in seconds |

---

## 🛡 Safety Features

- JSON format validation
- File size protection (max 5MB)
- Row explosion protection (max 50k objects)
- Safe Excel sheet naming
- Memory-efficient Excel generation

---

## 📊 Performance

| JSON Size         | Time   |
| ----------------- | ------ |
| Small (<100 rows) | <0.05s |
| Medium (~1k rows) | ~0.2s  |
| Large (~10k rows) | <1s    |

---

## 🔮 Roadmap

- [x] JSON structure preview before conversion
- [x] Conversion summary (sheets, rows, size, time)
- [x] Upload progress indicator
- [x] Dark mode interface
- [ ] Column selection UI
- [ ] Batch file conversion
- [ ] API mode (send JSON directly, no file upload)

---

## 👨‍💻 Author

**Pradeep** — Software Developer
