"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import yaml from "js-yaml";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

// Always-visible inline error/status box beneath the editor
function ErrorLog({
  message,
  details,
}: {
  message?: string;
  details?: string;
}) {
  const hasError = !!message;
  return (
    <div
      role={hasError ? "alert" : "status"}
      style={{
        background: hasError ? "#fef2f2" : "#f3f4f6",
        border: hasError ? "1px solid #fca5a5" : "1px solid #d1d5db",
        borderRadius: 8,
        color: hasError ? "#991b1b" : "#374151",
        padding: 12,
        marginTop: 8,
        fontSize: 13,
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        minHeight: 200, // keep visible at all times
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <strong style={{ display: "block", marginBottom: 4 }}>
        {hasError ? "⚠️ Error:" : "✅ No errors detected"}
      </strong>
      <div>
        {hasError
          ? message
          : "All clear. No syntax or validation issues found."}
      </div>
      {hasError && details && (
        <pre
          style={{
            background: "#fee2e2",
            borderRadius: 6,
            padding: 8,
            marginTop: 6,
            overflow: "auto",
            maxHeight: 160,
            whiteSpace: "pre-wrap",
          }}
        >
          {details}
        </pre>
      )}
    </div>
  );
}

export default function Converter() {
  const [code, setCode] = useState("");
  const [format, setFormat] = useState<"json" | "xml" | "yaml">("json");
  const [error, setError] = useState<{
    message: string;
    details?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [rootName, setRootName] = useState("root"); // used when converting to XML

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const parser = new XMLParser();
  const builder = new XMLBuilder({
    format: true,
    indentBy: "  ",
    suppressEmptyNode: false,
  });

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const prettyViaMonaco = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  // Ensure a single XML root and good defaults for arrays/primitives
  function wrapForXml(data: any, name: string) {
    if (Array.isArray(data)) {
      // <root><item>...</item></root>
      return { [name]: { item: data } };
    }
    if (data !== null && typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length === 1) return data; // already a single top-level key -> becomes the root
      return { [name]: data }; // wrap multi-key object
    }
    // primitives -> <root>value</root>
    return { [name]: data };
  }

  // --- Monaco marker helpers ---
  function clearMarkers() {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel?.();
    if (monaco && model) monaco.editor.setModelMarkers(model, "owner", []);
  }

  function setMarker(line: number, column: number, message: string) {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel?.();
    if (!monaco || !model) return;
    monaco.editor.setModelMarkers(model, "owner", [
      {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column + 1,
        message,
        severity: monaco.MarkerSeverity.Error,
      },
    ]);
  }

  // Validate current buffer according to selected format
  function validateCurrent():
    | { ok: true; data: any }
    | { ok: false; message: string; details?: string } {
    try {
      clearMarkers();
      let data: any;
      if (format === "json") {
        data = JSON.parse(code);
      } else if (format === "yaml") {
        data = yaml.load(code);
      } else {
        // XML validation with line/col
        const res = XMLValidator.validate(code, {
          allowBooleanAttributes: true,
        });
        if (res !== true) {
          const err = res as any; // { err: { code, msg, line, col } }
          if (err?.err?.line && err?.err?.col)
            setMarker(err.err.line, err.err.col, err.err.msg || "XML error");
          throw new Error(err?.err?.msg || "Invalid XML");
        }
        data = parser.parse(code);
      }
      return { ok: true, data };
    } catch (e: any) {
      if (format === "yaml" && e?.mark && typeof e.mark.line === "number") {
        setMarker(
          (e.mark.line || 0) + 1,
          (e.mark.column || 0) + 1,
          e.reason || e.message || "YAML error"
        );
      }
      return {
        ok: false,
        message: e?.message || "Validation failed",
        details: typeof e?.stack === "string" ? e.stack : undefined,
      };
    }
  }

  // Realtime validation (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      if (!code) {
        setError(null);
        clearMarkers();
        return;
      }
      const result = validateCurrent();
      if (result.ok) setError(null);
      else setError({ message: result.message, details: result.details });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, format]);

  // Convert between formats (validates first)
  const convert = async (targetFormat: "json" | "xml" | "yaml") => {
    const v = validateCurrent();
    if (!v.ok) {
      setError({ message: v.message, details: v.details });
      return;
    }

    try {
      const data = v.data;
      let result = "";
      if (targetFormat === "json") result = JSON.stringify(data, null, 2);
      if (targetFormat === "yaml")
        result = yaml.dump(data as any, { lineWidth: 120 });
      if (targetFormat === "xml") {
        const wrapped = wrapForXml(data, (rootName || "root").trim());
        result = builder.build(wrapped);
      }

      setCode(result);
      setFormat(targetFormat);

      // pretty print in Monaco after switching language
      setTimeout(() => {
        if (targetFormat === "xml") prettyViaMonaco();
      }, 50);
    } catch (e: any) {
      setError({
        message: e?.message || "Conversion failed",
        details: e?.stack,
      });
    }
  };

  // Save: validate then download
  const onSave = async () => {
    setSaving(true);
    try {
      const v = validateCurrent();
      if (!v.ok) {
        setError({ message: v.message, details: v.details });
        return;
      }
      const ext =
        format === "json" ? "json" : format === "yaml" ? "yaml" : "xml";
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard: Cmd/Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reformat when language changes
  useEffect(() => {
    if (editorRef.current) prettyViaMonaco();
  }, [format]);

  return (
    <div style={{ width: "100%" }}>
      {/* Top bar */}
      <div
        style={{
          marginBottom: 8,
          gap: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <strong style={{ marginRight: 8 }}>Format:</strong>
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            color: "#000",
          }}
        >
          {format.toUpperCase()}
        </span>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {/* Root tag input (used when converting TO XML) */}
          <label style={{ fontSize: 12, color: "#6b7280" }}>
            Root tag:
            <input
              value={rootName}
              onChange={(e) => setRootName(e.target.value || "root")}
              placeholder="root"
              style={{
                marginLeft: 6,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                outline: "none",
              }}
            />
          </label>

          <button onClick={() => convert("json")} style={btn()}>
            To JSON
          </button>
          <button onClick={() => convert("yaml")} style={btn()}>
            To YAML
          </button>
          <button onClick={() => convert("xml")} style={btn()}>
            To XML
          </button>
          <button
            onClick={onSave}
            style={btnPrimary()}
            disabled={!!error || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <Editor
        height="60vh"
        width="100%"
        language={format}
        value={code}
        onChange={(v) => setCode(v || "")}
        onMount={handleEditorMount}
        options={{
          automaticLayout: true,
          formatOnPaste: true,
          formatOnType: true,
          minimap: { enabled: false },
        }}
      />

      {/* Always-visible error/status log */}
      <ErrorLog message={error?.message} details={error?.details} />

      {/* Footer tip */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <span>
          Tip: Paste JSON/YAML/XML, then convert or press Save (⌘/Ctrl+S).
        </span>
        <span>Pretty printing by XMLBuilder + Monaco (⌥⇧F / Ctrl+Shift+I)</span>
      </div>
    </div>
  );
}

// Button style helpers
function btn() {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    background: "#e5e7eb",
    color: "#111827",
    border: "1px solid #d1d5db",
    cursor: "pointer",
  } as React.CSSProperties;
}

function btnPrimary() {
  return {
    padding: "8px 12px",
    borderRadius: 8,
    background: "red",
    color: "white",
    border: "1px solid #111827",
    cursor: "pointer",
  } as React.CSSProperties;
}
