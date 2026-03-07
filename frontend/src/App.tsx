import { useState, useEffect } from "react";
import type { DragEvent } from "react";
import {
  UploadCloud,
  FileJson,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Zap,
  ShieldCheck,
  Sparkles,
  Download,
  TableProperties,
  Rows3,
  HardDrive,
  Timer,
  ChevronRight,
  ChevronDown,
  Braces,
  SquareStack,
  Type,
  Hash,
  ToggleLeft,
} from "lucide-react";

type Stage = "idle" | "uploading" | "downloading" | "done";

interface Summary {
  sheets: number;
  rows: number;
  sizeKb: number;
  timeSec: number;
}

// ─── JSON Tree ────────────────────────────────────────────────────────────────

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

function getType(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function TypeIcon({ type }: { type: string }) {
  const cls = "flex-shrink-0";
  if (type === "object")
    return <Braces size={11} className={`text-violet-400 ${cls}`} />;
  if (type === "array")
    return <SquareStack size={11} className={`text-cyan-400 ${cls}`} />;
  if (type === "string")
    return <Type size={11} className={`text-emerald-400 ${cls}`} />;
  if (type === "number")
    return <Hash size={11} className={`text-amber-400 ${cls}`} />;
  if (type === "boolean")
    return <ToggleLeft size={11} className={`text-pink-400 ${cls}`} />;
  return <span className={`text-slate-500 text-xs ${cls}`}>∅</span>;
}

function TypeBadge({ type, arrayLen }: { type: string; arrayLen?: number }) {
  const map: Record<string, string> = {
    object: "text-violet-400",
    array: "text-cyan-400",
    string: "text-emerald-400",
    number: "text-amber-400",
    boolean: "text-pink-400",
    null: "text-slate-500",
  };
  const label =
    type === "array" && arrayLen !== undefined ? `array[${arrayLen}]` : type;
  return (
    <span className={`text-xs ${map[type] ?? "text-slate-500"}`}>{label}</span>
  );
}

interface TreeNodeProps {
  label: string;
  value: JsonValue;
  depth?: number;
  defaultOpen?: boolean;
}

function TreeNode({
  label,
  value,
  depth = 0,
  defaultOpen = false,
}: TreeNodeProps) {
  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const [open, setOpen] = useState(defaultOpen);

  const indent = depth * 14;

  if (!isExpandable) {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-slate-800/50 group"
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <TypeIcon type={type} />
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <span className="text-xs text-slate-600 ml-auto">
          <TypeBadge type={type} />
        </span>
      </div>
    );
  }

  const children =
    type === "array"
      ? (value as JsonValue[])
      : Object.entries(value as Record<string, JsonValue>);

  const childCount =
    Array.isArray(children) && type === "array"
      ? (children as JsonValue[]).length
      : (children as [string, JsonValue][]).length;

  // For arrays of objects, show the first item's keys as a sample
  const renderChildren = () => {
    if (type === "array") {
      const arr = value as JsonValue[];
      if (arr.length === 0) return null;
      const first = arr[0];
      const firstType = getType(first);

      if (firstType === "object") {
        // Show first item's structure as representative sample
        return Object.entries(first as Record<string, JsonValue>).map(
          ([k, v]) => (
            <TreeNode key={k} label={k} value={v} depth={depth + 1} />
          ),
        );
      } else {
        // Primitive array — show a few values
        return arr
          .slice(0, 3)
          .map((item, i) => (
            <TreeNode key={i} label={`[${i}]`} value={item} depth={depth + 1} />
          ));
      }
    }

    // Object
    return Object.entries(value as Record<string, JsonValue>).map(([k, v]) => (
      <TreeNode key={k} label={k} value={v} depth={depth + 1} />
    ));
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-slate-800/50 text-left"
        style={{ paddingLeft: `${8 + indent}px` }}
      >
        <span className="text-slate-500 flex-shrink-0">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </span>
        <TypeIcon type={type} />
        <span className="text-xs text-slate-200 font-medium">{label}</span>
        <span className="ml-auto text-xs text-slate-600">
          <TypeBadge
            type={type}
            arrayLen={
              type === "array" ? (value as JsonValue[]).length : undefined
            }
          />
        </span>
        {type === "array" && childCount > 0 && (
          <span className="text-xs text-slate-600 ml-1">
            · {childCount} item{childCount !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {open && (
        <div
          className="border-l border-slate-800 ml-4"
          style={{ marginLeft: `${14 + indent}px` }}
        >
          {renderChildren()}
        </div>
      )}
    </div>
  );
}

interface JsonPreviewProps {
  data: JsonValue;
}

function JsonPreview({ data }: JsonPreviewProps) {
  const type = getType(data);

  const topLevel =
    type === "array"
      ? { label: "root", value: data }
      : type === "object"
        ? { label: "root", value: data }
        : null;

  if (!topLevel) return null;

  const isArray = type === "array";
  const entries = isArray
    ? null
    : Object.entries(data as Record<string, JsonValue>);

  return (
    <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
        <Braces size={13} className="text-violet-400" />
        <span className="text-xs font-medium text-slate-400">
          Structure Preview
        </span>
        {isArray && (
          <span className="ml-auto text-xs text-slate-600">
            {(data as JsonValue[]).length} records
          </span>
        )}
      </div>

      {/* Tree */}
      <div className="px-2 py-2 max-h-52 overflow-y-auto scrollbar-thin">
        {isArray ? (
          // Array root — show first item's structure
          <>
            <div className="flex items-center gap-1.5 py-0.5 px-2">
              <SquareStack size={11} className="text-cyan-400" />
              <span className="text-xs text-slate-200 font-medium">root</span>
              <TypeBadge type="array" arrayLen={(data as JsonValue[]).length} />
              <span className="text-xs text-slate-600 ml-1">
                · showing first item
              </span>
            </div>
            <div className="border-l border-slate-800 ml-4">
              {getType((data as JsonValue[])[0]) === "object"
                ? Object.entries(
                    (data as JsonValue[])[0] as Record<string, JsonValue>,
                  ).map(([k, v]) => (
                    <TreeNode
                      key={k}
                      label={k}
                      value={v}
                      depth={1}
                      defaultOpen={false}
                    />
                  ))
                : null}
            </div>
          </>
        ) : (
          // Object root
          entries!.map(([k, v]) => (
            <TreeNode
              key={k}
              label={k}
              value={v}
              depth={0}
              defaultOpen={false}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function formatRows(n: number): string {
  return n.toLocaleString();
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<JsonValue | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Auto-dismiss error after 5s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  // Parse JSON for preview when file is selected
  const loadPreview = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        setPreviewData(parsed);
      } catch {
        setPreviewData(null);
      }
    };
    reader.readAsText(f);
  };

  const selectFile = (f: File) => {
    setFile(f);
    setError(null);
    setSummary(null);
    setPreviewData(null);
    loadPreview(f);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".json")) {
      selectFile(droppedFile);
    } else {
      setError("Only JSON files are allowed");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setError(null);
    setSummary(null);
    setProgress(0);
    setStage("uploading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await new Promise<{
        ok: boolean;
        blob?: Blob;
        filename?: string;
        summary?: Summary;
        error?: string;
      }>((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response as Blob;
            const disposition =
              xhr.getResponseHeader("Content-Disposition") ?? "";
            const match = disposition.match(/filename="(.+)"/);
            const filename = match?.[1] ?? "download.xlsx";
            const summary: Summary = {
              sheets: parseInt(
                xhr.getResponseHeader("X-Summary-Sheets") ?? "0",
              ),
              rows: parseInt(xhr.getResponseHeader("X-Summary-Rows") ?? "0"),
              sizeKb: parseFloat(
                xhr.getResponseHeader("X-Summary-Size-KB") ?? "0",
              ),
              timeSec: parseFloat(
                xhr.getResponseHeader("X-Summary-Time-Sec") ?? "0",
              ),
            };
            resolve({ ok: true, blob, filename, summary });
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              resolve({ ok: false, error: err.error ?? "Conversion failed" });
            } catch {
              resolve({ ok: false, error: "Conversion failed" });
            }
          }
        });

        xhr.addEventListener("error", () =>
          resolve({ ok: false, error: "Network error" }),
        );
        xhr.responseType = "blob";
        xhr.open("POST", `${import.meta.env.VITE_API_URL}/convert/`);
        xhr.send(formData);
      });

      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        setStage("idle");
        return;
      }

      setStage("downloading");
      await new Promise((r) => setTimeout(r, 700));

      const url = window.URL.createObjectURL(result.blob!);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename!;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSummary(result.summary!);
      setPreviewData(null);
      setStage("done");
      setFile(null);
      setTimeout(() => setStage("idle"), 3000);
    } catch {
      setError("Something went wrong");
      setStage("idle");
    }
  };

  const isLoading = stage === "uploading" || stage === "downloading";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 py-20 gap-10">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
          <Sparkles size={10} />
          Free Converter
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight">
          JSON{" "}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            →
          </span>{" "}
          Excel
        </h1>
        <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
          Drop any JSON file and get a clean, structured spreadsheet in seconds.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/40">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
            ${
              dragActive
                ? "border-violet-500 bg-violet-500/5 scale-[1.01]"
                : "border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/50"
            }`}
        >
          <input
            type="file"
            accept=".json"
            id="fileInput"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) selectFile(selected);
            }}
          />
          <label htmlFor="fileInput" className="cursor-pointer block p-8">
            {file ? (
              <div className="flex items-center gap-3 bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <FileJson size={20} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setPreviewData(null);
                    setSummary(null);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <UploadCloud size={24} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Drag & drop your JSON file
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    or click to browse · max 5MB
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* JSON Preview Tree */}
        {previewData !== null && !isLoading && (
          <JsonPreview data={previewData} />
        )}

        {/* Upload Progress Bar */}
        {stage === "uploading" && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleUpload}
          disabled={isLoading || !file}
          className="mt-4 w-full py-3.5 rounded-2xl text-sm font-semibold text-white
            bg-gradient-to-r from-violet-600 to-violet-500
            shadow-lg shadow-violet-500/25
            hover:shadow-violet-500/40 hover:-translate-y-0.5
            active:translate-y-0
            disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
            transition-all duration-200"
        >
          {stage === "uploading" && (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading... {progress}%
            </span>
          )}
          {stage === "downloading" && (
            <span className="flex items-center justify-center gap-2">
              <Download size={15} className="animate-bounce" />
              Preparing download...
            </span>
          )}
          {stage === "done" && (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 size={15} />
              Done!
            </span>
          )}
          {stage === "idle" && "Convert to Excel"}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 bg-red-500/5 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="flex-shrink-0 text-red-400/50 hover:text-red-400 transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Conversion Summary */}
        {summary && (
          <div className="mt-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Converted successfully
              </span>
              <button
                onClick={() => setSummary(null)}
                className="ml-auto text-emerald-400/40 hover:text-emerald-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  icon: (
                    <TableProperties size={14} className="text-violet-400" />
                  ),
                  label: "Sheets",
                  value: summary.sheets,
                },
                {
                  icon: <Rows3 size={14} className="text-violet-400" />,
                  label: "Rows",
                  value: formatRows(summary.rows),
                },
                {
                  icon: <HardDrive size={14} className="text-violet-400" />,
                  label: "File size",
                  value: formatSize(summary.sizeKb),
                },
                {
                  icon: <Timer size={14} className="text-violet-400" />,
                  label: "Time",
                  value: `${summary.timeSec}s`,
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 bg-slate-800/60 rounded-xl px-3 py-2.5"
                >
                  {icon}
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { icon: <Layers size={12} />, label: "Nested JSON support" },
          { icon: <Zap size={12} />, label: "Multiple sheets" },
          { icon: <ShieldCheck size={12} />, label: "Secure & private" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-400 text-xs px-4 py-2 rounded-full transition-colors"
          >
            <span className="text-violet-400">{icon}</span>
            {label}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-700">
        Built by Pradeep · No data stored · Free forever
      </p>
    </div>
  );
}

export default App;
