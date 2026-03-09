// App.tsx
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
  SlidersHorizontal,
  ChevronsUpDown,
} from "lucide-react";

type Stage = "idle" | "uploading" | "downloading" | "done";

interface Summary {
  sheets: number;
  rows: number;
  sizeKb: number;
  timeSec: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Field Extractor (mirrors backend logic) ─────────────────────────────────

function extractFields(data: JsonValue): string[] {
  const fields: string[] = [];
  const seen = new Set<string>();

  function walk(node: JsonValue, prefix: string) {
    if (typeof node === "object" && node !== null && !Array.isArray(node)) {
      for (const [k, v] of Object.entries(node)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          walk(v, path);
        } else if (
          Array.isArray(v) &&
          v.length > 0 &&
          typeof v[0] === "object" &&
          v[0] !== null
        ) {
          walk(v[0], `${path}[]`);
        } else {
          if (!seen.has(path)) {
            seen.add(path);
            fields.push(path);
          }
        }
      }
    } else if (Array.isArray(node) && node.length > 0) {
      walk(node[0], prefix);
    }
  }

  walk(data, "");
  return fields;
}

// ─── JSON Tree ────────────────────────────────────────────────────────────────

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

function TreeNode({
  label,
  value,
  depth = 0,
}: {
  label: string;
  value: JsonValue;
  depth?: number;
}) {
  const type = getType(value);
  const isExpandable = type === "object" || type === "array";
  const [open, setOpen] = useState(false);
  const indent = depth * 14;

  if (!isExpandable) {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 px-2 rounded-md hover:bg-slate-800/50"
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

  const childCount =
    type === "array"
      ? (value as JsonValue[]).length
      : Object.keys(value as Record<string, JsonValue>).length;

  const renderChildren = () => {
    if (type === "array") {
      const arr = value as JsonValue[];
      if (!arr.length) return null;
      const first = arr[0];
      if (getType(first) === "object") {
        return Object.entries(first as Record<string, JsonValue>).map(
          ([k, v]) => (
            <TreeNode key={k} label={k} value={v} depth={depth + 1} />
          ),
        );
      }
      return arr
        .slice(0, 3)
        .map((item, i) => (
          <TreeNode key={i} label={`[${i}]`} value={item} depth={depth + 1} />
        ));
    }
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
        {childCount > 0 && (
          <span className="text-xs text-slate-600 ml-1">· {childCount}</span>
        )}
      </button>
      {open && (
        <div
          className="border-l border-slate-800"
          style={{ marginLeft: `${14 + indent}px` }}
        >
          {renderChildren()}
        </div>
      )}
    </div>
  );
}

function JsonPreview({ data }: { data: JsonValue }) {
  const type = getType(data);
  if (type !== "array" && type !== "object") return null;
  const isArray = type === "array";
  const entries = isArray
    ? null
    : Object.entries(data as Record<string, JsonValue>);

  return (
    <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
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
      <div className="px-2 py-2 max-h-48 overflow-y-auto">
        {isArray ? (
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
                    <TreeNode key={k} label={k} value={v} depth={1} />
                  ))
                : null}
            </div>
          </>
        ) : (
          entries!.map(([k, v]) => (
            <TreeNode key={k} label={k} value={v} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Column Selector ──────────────────────────────────────────────────────────

function ColumnSelector({
  fields,
  selected,
  onChange,
}: {
  fields: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = fields.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase()),
  );

  // Group fields by sheet prefix (root vs array children)
  const rootFields = filtered.filter((f) => !f.includes("[]"));
  const childFields = filtered.filter((f) => f.includes("[]"));

  // Unique group prefixes e.g. "items[]"
  const groups = [...new Set(childFields.map((f) => f.split("[]")[0] + "[]"))];

  const toggleField = (field: string) => {
    const next = new Set(selected);
    if (next.has(field)) next.delete(field);
    else next.add(field);
    onChange(next);
  };

  const toggleAll = () => {
    if (selected.size === fields.length) onChange(new Set());
    else onChange(new Set(fields));
  };

  const toggleGroup = (prefix: string) => {
    const groupFields = fields.filter((f) => f.startsWith(prefix));
    const allSelected = groupFields.every((f) => selected.has(f));
    const next = new Set(selected);
    if (allSelected) groupFields.forEach((f) => next.delete(f));
    else groupFields.forEach((f) => next.add(f));
    onChange(next);
  };

  const selectedCount = selected.size;
  const allSelected = selectedCount === fields.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl px-4 py-3 transition-colors"
      >
        <SlidersHorizontal
          size={14}
          className="text-violet-400 flex-shrink-0"
        />
        <span className="text-xs font-medium text-slate-400">
          Column Selection
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${
              allSelected
                ? "bg-violet-500/10 text-violet-400"
                : someSelected
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-slate-800 text-slate-500"
            }`}
          >
            {selectedCount}/{fields.length}
          </span>
          <ChevronsUpDown size={13} className="text-slate-600" />
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Search + select all */}
          <div className="p-3 border-b border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-violet-500/50 transition-colors"
            />
            <button
              onClick={toggleAll}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium whitespace-nowrap px-2 transition-colors"
            >
              {allSelected ? "None" : "All"}
            </button>
          </div>

          {/* Field list */}
          <div className="max-h-56 overflow-y-auto p-2">
            {/* Root fields */}
            {rootFields.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-600 font-medium px-2 py-1">
                  root
                </p>
                {rootFields.map((field) => (
                  <FieldRow
                    key={field}
                    field={field}
                    checked={selected.has(field)}
                    onToggle={() => toggleField(field)}
                  />
                ))}
              </div>
            )}

            {/* Child array groups */}
            {groups.map((prefix) => {
              const groupFields = filtered.filter((f) => f.startsWith(prefix));
              const allGroupSelected = groupFields.every((f) =>
                selected.has(f),
              );
              const someGroupSelected = groupFields.some((f) =>
                selected.has(f),
              );

              return (
                <div key={prefix} className="mb-2">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <button
                      onClick={() => toggleGroup(prefix)}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border flex-shrink-0 transition-colors
                        ${
                          allGroupSelected
                            ? "bg-violet-500 border-violet-500"
                            : someGroupSelected
                              ? "bg-violet-500/40 border-violet-500/40"
                              : "border-slate-700 bg-transparent"
                        }`}
                    >
                      {(allGroupSelected || someGroupSelected) && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path
                            d={allGroupSelected ? "M1 4l2 2 4-4" : "M1 4h6"}
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                    <p className="text-xs text-cyan-400 font-medium">
                      {prefix}
                    </p>
                    <span className="text-xs text-slate-600 ml-auto">
                      {groupFields.filter((f) => selected.has(f)).length}/
                      {groupFields.length}
                    </span>
                  </div>
                  {groupFields.map((field) => {
                    const shortLabel = field.replace(prefix, "");
                    return (
                      <FieldRow
                        key={field}
                        field={field}
                        label={shortLabel}
                        checked={selected.has(field)}
                        onToggle={() => toggleField(field)}
                        indent
                      />
                    );
                  })}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">
                No fields match
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {selectedCount === 0
                ? "All fields will be included"
                : `${selectedCount} field${selectedCount !== 1 ? "s" : ""} selected`}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  field,
  label,
  checked,
  onToggle,
  indent = false,
}: {
  field: string;
  label?: string;
  checked: boolean;
  onToggle: () => void;
  indent?: boolean;
}) {
  // Determine type hint from field name (best effort)
  const displayLabel = label ?? field;

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors text-left
        ${indent ? "pl-6" : ""}`}
    >
      <div
        className={`w-3.5 h-3.5 rounded flex items-center justify-center border flex-shrink-0 transition-colors
        ${checked ? "bg-violet-500 border-violet-500" : "border-slate-700 bg-transparent"}`}
      >
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path
              d="M1 4l2 2 4-4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-xs truncate ${checked ? "text-slate-300" : "text-slate-500"}`}
      >
        {displayLabel}
      </span>
    </button>
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
  const [allFields, setAllFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const loadPreview = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        setPreviewData(parsed);
        const fields = extractFields(parsed);
        setAllFields(fields);
        setSelectedFields(new Set(fields)); // default: all selected
      } catch {
        setPreviewData(null);
        setAllFields([]);
        setSelectedFields(new Set());
      }
    };
    reader.readAsText(f);
  };

  const selectFile = (f: File) => {
    setFile(f);
    setError(null);
    setSummary(null);
    setPreviewData(null);
    setAllFields([]);
    setSelectedFields(new Set());
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

    // Only send fields param if user has deselected something
    const allSelected = selectedFields.size === allFields.length;
    if (!allSelected && selectedFields.size > 0) {
      formData.append("fields", [...selectedFields].join(","));
    }

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
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
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
      setAllFields([]);
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
              const s = e.target.files?.[0];
              if (s) selectFile(s);
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
                    setAllFields([]);
                    setSelectedFields(new Set());
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

        {/* Column Selector */}
        {allFields.length > 0 && !isLoading && (
          <ColumnSelector
            fields={allFields}
            selected={selectedFields}
            onChange={setSelectedFields}
          />
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
            hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0
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
          {stage === "idle" &&
            (selectedFields.size > 0 && selectedFields.size < allFields.length
              ? `Convert ${selectedFields.size} fields to Excel`
              : "Convert to Excel")}
        </button>

        {/* Error */}
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

        {/* Summary */}
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
