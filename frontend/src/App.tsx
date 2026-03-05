import { useState } from "react";
import type { DragEvent } from "react";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];

    if (droppedFile && droppedFile.name.endsWith(".json")) {
      setFile(droppedFile);
      setError(null);
      setMessage(null);
    } else {
      setError("Only JSON files are allowed");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/convert/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers.get("Content-Disposition");

      let filename = "download.xlsx";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage("File converted successfully!");
      setFile(null);
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-3xl p-10 w-full max-w-md text-center border border-gray-100">
        <h1 className="text-3xl font-semibold text-gray-800">JSON → Excel</h1>
        <p className="text-sm text-gray-500 mt-2">
          Convert your JSON files into Excel instantly.
        </p>

        {/* Drag Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-8 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
        >
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="fileInput"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />

          <label htmlFor="fileInput" className="cursor-pointer block">
            {file ? (
              <div>
                <p className="text-gray-700 font-medium">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">Drag & drop JSON file here</p>
                <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              </div>
            )}
          </label>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleUpload}
          disabled={loading || !file}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Convert to Excel"}
        </button>

        {/* Loader */}
        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
