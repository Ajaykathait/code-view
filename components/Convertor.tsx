// // "use client";

// // import { useEffect, useRef, useState } from "react";
// // import Editor, { OnMount } from "@monaco-editor/react";
// // import yaml from "js-yaml";
// // import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

// // // Always-visible inline error/status box beneath the editor
// // function ErrorLog({
// //   message,
// //   details,
// // }: {
// //   message?: string;
// //   details?: string;
// // }) {
// //   const hasError = !!message;
// //   return (
// //     <div
// //       role={hasError ? "alert" : "status"}
// //       style={{
// //         background: hasError ? "#fef2f2" : "#f3f4f6",
// //         border: hasError ? "1px solid #fca5a5" : "1px solid #d1d5db",
// //         borderRadius: 8,
// //         color: hasError ? "#991b1b" : "#374151",
// //         padding: 12,
// //         marginTop: 8,
// //         fontSize: 13,
// //         fontFamily: "monospace",
// //         whiteSpace: "pre-wrap",
// //         minHeight: 200, // keep visible at all times
// //         display: "flex",
// //         flexDirection: "column",
// //         justifyContent: "center",
// //       }}
// //     >
// //       <strong style={{ display: "block", marginBottom: 4 }}>
// //         {hasError ? "⚠️ Error:" : "✅ No errors detected"}
// //       </strong>
// //       <div>
// //         {hasError
// //           ? message
// //           : "All clear. No syntax or validation issues found."}
// //       </div>
// //       {hasError && details && (
// //         <pre
// //           style={{
// //             background: "#fee2e2",
// //             borderRadius: 6,
// //             padding: 8,
// //             marginTop: 6,
// //             overflow: "auto",
// //             maxHeight: 160,
// //             whiteSpace: "pre-wrap",
// //           }}
// //         >
// //           {details}
// //         </pre>
// //       )}
// //     </div>
// //   );
// // }

// // export default function Converter() {
// //   const [code, setCode] = useState("");
// //   const [format, setFormat] = useState<"json" | "xml" | "yaml">("json");
// //   const [error, setError] = useState<{
// //     message: string;
// //     details?: string;
// //   } | null>(null);
// //   const [saving, setSaving] = useState(false);
// //   const [rootName, setRootName] = useState("root"); // used when converting to XML

// //   const editorRef = useRef<any>(null);
// //   const monacoRef = useRef<any>(null);

// //   const parser = new XMLParser();
// //   const builder = new XMLBuilder({
// //     format: true,
// //     indentBy: "  ",
// //     suppressEmptyNode: false,
// //   });

// //   const handleEditorMount: OnMount = (editor, monaco) => {
// //     editorRef.current = editor;
// //     monacoRef.current = monaco;
// //   };

// //   const prettyViaMonaco = () => {
// //     editorRef.current?.getAction("editor.action.formatDocument")?.run();
// //   };

// //   // Ensure a single XML root and good defaults for arrays/primitives
// //   function wrapForXml(data: any, name: string) {
// //     if (Array.isArray(data)) {
// //       // <root><item>...</item></root>
// //       return { [name]: { item: data } };
// //     }
// //     if (data !== null && typeof data === "object") {
// //       const keys = Object.keys(data);
// //       if (keys.length === 1) return data; // already a single top-level key -> becomes the root
// //       return { [name]: data }; // wrap multi-key object
// //     }
// //     // primitives -> <root>value</root>
// //     return { [name]: data };
// //   }

// //   // --- Monaco marker helpers ---
// //   function clearMarkers() {
// //     const monaco = monacoRef.current;
// //     const model = editorRef.current?.getModel?.();
// //     if (monaco && model) monaco.editor.setModelMarkers(model, "owner", []);
// //   }

// //   function setMarker(line: number, column: number, message: string) {
// //     const monaco = monacoRef.current;
// //     const model = editorRef.current?.getModel?.();
// //     if (!monaco || !model) return;
// //     monaco.editor.setModelMarkers(model, "owner", [
// //       {
// //         startLineNumber: line,
// //         startColumn: column,
// //         endLineNumber: line,
// //         endColumn: column + 1,
// //         message,
// //         severity: monaco.MarkerSeverity.Error,
// //       },
// //     ]);
// //   }

// //   // Validate current buffer according to selected format
// //   function validateCurrent():
// //     | { ok: true; data: any }
// //     | { ok: false; message: string; details?: string } {
// //     try {
// //       clearMarkers();
// //       let data: any;
// //       if (format === "json") {
// //         data = JSON.parse(code);
// //       } else if (format === "yaml") {
// //         data = yaml.load(code);
// //       } else {
// //         // XML validation with line/col
// //         const res = XMLValidator.validate(code, {
// //           allowBooleanAttributes: true,
// //         });
// //         if (res !== true) {
// //           const err = res as any; // { err: { code, msg, line, col } }
// //           if (err?.err?.line && err?.err?.col)
// //             setMarker(err.err.line, err.err.col, err.err.msg || "XML error");
// //           throw new Error(err?.err?.msg || "Invalid XML");
// //         }
// //         data = parser.parse(code);
// //       }
// //       return { ok: true, data };
// //     } catch (e: any) {
// //       if (format === "yaml" && e?.mark && typeof e.mark.line === "number") {
// //         setMarker(
// //           (e.mark.line || 0) + 1,
// //           (e.mark.column || 0) + 1,
// //           e.reason || e.message || "YAML error"
// //         );
// //       }
// //       return {
// //         ok: false,
// //         message: e?.message || "Validation failed",
// //         details: typeof e?.stack === "string" ? e.stack : undefined,
// //       };
// //     }
// //   }

// //   // Realtime validation (debounced)
// //   useEffect(() => {
// //     const id = setTimeout(() => {
// //       if (!code) {
// //         setError(null);
// //         clearMarkers();
// //         return;
// //       }
// //       const result = validateCurrent();
// //       if (result.ok) setError(null);
// //       else setError({ message: result.message, details: result.details });
// //     }, 300);
// //     return () => clearTimeout(id);
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [code, format]);

// //   // Convert between formats (validates first)
// //   const convert = async (targetFormat: "json" | "xml" | "yaml") => {
// //     const v = validateCurrent();
// //     if (!v.ok) {
// //       setError({ message: v.message, details: v.details });
// //       return;
// //     }

// //     try {
// //       const data = v.data;
// //       let result = "";
// //       if (targetFormat === "json") result = JSON.stringify(data, null, 2);
// //       if (targetFormat === "yaml")
// //         result = yaml.dump(data as any, { lineWidth: 120 });
// //       if (targetFormat === "xml") {
// //         const wrapped = wrapForXml(data, (rootName || "root").trim());
// //         result = builder.build(wrapped);
// //       }

// //       setCode(result);
// //       setFormat(targetFormat);

// //       // pretty print in Monaco after switching language
// //       setTimeout(() => {
// //         if (targetFormat === "xml") prettyViaMonaco();
// //       }, 50);
// //     } catch (e: any) {
// //       setError({
// //         message: e?.message || "Conversion failed",
// //         details: e?.stack,
// //       });
// //     }
// //   };

// //   // Save: validate then download
// //   const onSave = async () => {
// //     setSaving(true);
// //     try {
// //       const v = validateCurrent();
// //       if (!v.ok) {
// //         setError({ message: v.message, details: v.details });
// //         return;
// //       }
// //       const ext =
// //         format === "json" ? "json" : format === "yaml" ? "yaml" : "xml";
// //       const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
// //       const url = URL.createObjectURL(blob);
// //       const a = document.createElement("a");
// //       a.href = url;
// //       a.download = `data.${ext}`;
// //       document.body.appendChild(a);
// //       a.click();
// //       a.remove();
// //       URL.revokeObjectURL(url);
// //     } finally {
// //       setSaving(false);
// //     }
// //   };

// //   // Keyboard: Cmd/Ctrl+S to save
// //   useEffect(() => {
// //     function onKey(e: KeyboardEvent) {
// //       if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
// //         e.preventDefault();
// //         onSave();
// //       }
// //     }
// //     window.addEventListener("keydown", onKey);
// //     return () => window.removeEventListener("keydown", onKey);
// //   }, []);

// //   // Reformat when language changes
// //   useEffect(() => {
// //     if (editorRef.current) prettyViaMonaco();
// //   }, [format]);

// //   return (
// //     <div style={{ width: "100%" }}>
// //       {/* Top bar */}
// //       <div
// //         style={{
// //           marginBottom: 8,
// //           gap: 10,
// //           display: "flex",
// //           flexWrap: "wrap",
// //           alignItems: "center",
// //         }}
// //       >
// //         <strong style={{ marginRight: 8 }}>Format:</strong>
// //         <span
// //           style={{
// //             padding: "6px 10px",
// //             borderRadius: 8,
// //             background: "#f3f4f6",
// //             border: "1px solid #e5e7eb",
// //             color: "#000",
// //           }}
// //         >
// //           {format.toUpperCase()}
// //         </span>

// //         <div
// //           style={{
// //             marginLeft: "auto",
// //             display: "flex",
// //             gap: 8,
// //             alignItems: "center",
// //           }}
// //         >
// //           {/* Root tag input (used when converting TO XML) */}
// //           <label style={{ fontSize: 12, color: "#6b7280" }}>
// //             Root tag:
// //             <input
// //               value={rootName}
// //               onChange={(e) => setRootName(e.target.value || "root")}
// //               placeholder="root"
// //               style={{
// //                 marginLeft: 6,
// //                 padding: "6px 8px",
// //                 borderRadius: 6,
// //                 border: "1px solid #d1d5db",
// //                 outline: "none",
// //               }}
// //             />
// //           </label>

// //           <button onClick={() => convert("json")} style={btn()}>
// //             To JSON
// //           </button>
// //           <button onClick={() => convert("yaml")} style={btn()}>
// //             To YAML
// //           </button>
// //           <button onClick={() => convert("xml")} style={btn()}>
// //             To XML
// //           </button>
// //           <button
// //             onClick={onSave}
// //             style={btnPrimary()}
// //             disabled={!!error || saving}
// //           >
// //             {saving ? "Saving…" : "Save"}
// //           </button>
// //         </div>
// //       </div>

// //       {/* Editor */}
// //       <Editor
// //         height="60vh"
// //         width="100%"
// //         language={format}
// //         value={code}
// //         onChange={(v) => setCode(v || "")}
// //         onMount={handleEditorMount}
// //         theme="vs-dark"
// //         options={{
// //           automaticLayout: true,
// //           formatOnPaste: true,
// //           formatOnType: true,
// //           minimap: { enabled: false },
// //         }}
// //       />

// //       {/* Always-visible error/status log */}
// //       <ErrorLog message={error?.message} details={error?.details} />

// //       {/* Footer tip */}
// //       <div
// //         style={{
// //           marginTop: 8,
// //           display: "flex",
// //           justifyContent: "space-between",
// //           fontSize: 12,
// //           color: "#6b7280",
// //         }}
// //       >
// //         <span>
// //           Tip: Paste JSON/YAML/XML, then convert or press Save (⌘/Ctrl+S).
// //         </span>
// //         <span>Pretty printing by XMLBuilder + Monaco (⌥⇧F / Ctrl+Shift+I)</span>
// //       </div>
// //     </div>
// //   );
// // }

// // // Button style helpers
// // function btn() {
// //   return {
// //     padding: "8px 12px",
// //     borderRadius: 8,
// //     background: "#e5e7eb",
// //     color: "#111827",
// //     border: "1px solid #d1d5db",
// //     cursor: "pointer",
// //   } as React.CSSProperties;
// // }

// // function btnPrimary() {
// //   return {
// //     padding: "8px 12px",
// //     borderRadius: 8,
// //     background: "red",
// //     color: "white",
// //     border: "1px solid #111827",
// //     cursor: "pointer",
// //   } as React.CSSProperties;
// // }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import Editor, { OnMount } from "@monaco-editor/react";
// import yaml from "js-yaml";
// import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

// // Always-visible inline error/status box beneath the editor
// function ErrorLog({
//   message,
//   details,
//   onReveal,
// }: {
//   message?: string;
//   details?: string;
//   onReveal?: () => void;
// }) {
//   const hasError = !!message;
//   return (
//     <div
//       role={hasError ? "alert" : "status"}
//       style={{
//         background: hasError ? "#fef2f2" : "#f3f4f6",
//         border: hasError ? "1px solid #fca5a5" : "1px solid #d1d5db",
//         borderRadius: 8,
//         color: hasError ? "#991b1b" : "#374151",
//         padding: 12,
//         marginTop: 8,
//         fontSize: 13,
//         fontFamily: "monospace",
//         whiteSpace: "pre-wrap",
//         minHeight: 120,
//         display: "flex",
//         flexDirection: "column",
//         justifyContent: "center",
//       }}
//     >
//       <strong style={{ display: "block", marginBottom: 6 }}>
//         {hasError ? "⚠️ Error:" : "✅ No errors detected"}
//       </strong>

//       <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//         <div style={{ flex: 1 }}>
//           <div>
//             {hasError
//               ? message
//               : "All clear. No syntax or validation issues found."}
//           </div>
//           {hasError && details && (
//             <pre
//               style={{
//                 background: "#fee2e2",
//                 borderRadius: 6,
//                 padding: 8,
//                 marginTop: 8,
//                 overflow: "auto",
//                 maxHeight: 160,
//                 whiteSpace: "pre-wrap",
//               }}
//             >
//               {details}
//             </pre>
//           )}
//         </div>

//         {hasError && onReveal && (
//           <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//             <button
//               onClick={onReveal}
//               style={{
//                 padding: "8px 10px",
//                 borderRadius: 8,
//                 background: "#111827",
//                 color: "white",
//                 border: "none",
//                 cursor: "pointer",
//               }}
//             >
//               Reveal in editor
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function Converter() {
//   const [code, setCode] = useState("");
//   const [format, setFormat] = useState<"json" | "xml" | "yaml">("json");
//   const [error, setError] = useState<{
//     message: string;
//     details?: string;
//   } | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [rootName, setRootName] = useState("root"); // used when converting to XML
//   const [theme, setTheme] = useState<
//     "vs" | "vs-dark" | "hc-black" | "custom-dark"
//   >("vs-dark");

//   const editorRef = useRef<any>(null);
//   const monacoRef = useRef<any>(null);

//   const parser = new XMLParser();
//   const builder = new XMLBuilder({
//     format: true,
//     indentBy: "  ",
//     suppressEmptyNode: false,
//   });

//   const handleEditorMount: OnMount = (editor, monaco) => {
//     editorRef.current = editor;
//     monacoRef.current = monaco;

//     // Define a custom theme
//     monaco.editor.defineTheme("custom-dark", {
//       base: "vs-dark",
//       inherit: true,
//       rules: [
//         { token: "comment", foreground: "7CFC00", fontStyle: "italic" },
//         { token: "string", foreground: "FFB86C" },
//       ],
//       colors: {
//         "editor.background": "#0f172a",
//         "editorLineNumber.foreground": "#94a3b8",
//         "editorCursor.foreground": "#FFB86C",
//       },
//     });

//     // Apply theme initially
//     monaco.editor.setTheme(theme);
//   };

//   const prettyViaMonaco = () => {
//     editorRef.current?.getAction("editor.action.formatDocument")?.run();
//   };

//   // Ensure a single XML root and good defaults for arrays/primitives
//   function wrapForXml(data: any, name: string) {
//     if (Array.isArray(data)) {
//       return { [name]: { item: data } };
//     }
//     if (data !== null && typeof data === "object") {
//       const keys = Object.keys(data);
//       if (keys.length === 1) return data;
//       return { [name]: data };
//     }
//     return { [name]: data };
//   }

//   // --- Monaco marker helpers ---
//   function clearMarkers() {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (monaco && model) monaco.editor.setModelMarkers(model, "owner", []);
//   }

//   function setMarker(line: number, column: number, message: string) {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (!monaco || !model) return;
//     monaco.editor.setModelMarkers(model, "owner", [
//       {
//         startLineNumber: Math.max(1, line),
//         startColumn: Math.max(1, column),
//         endLineNumber: Math.max(1, line),
//         endColumn: Math.max(1, column + 1),
//         message,
//         severity: monaco.MarkerSeverity.Error,
//       },
//     ]);
//   }

//   function setMultipleMarkers(
//     markers: { line: number; col: number; msg: string }[]
//   ) {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (!monaco || !model) return;
//     const m = markers.map((x) => ({
//       startLineNumber: Math.max(1, x.line),
//       startColumn: Math.max(1, x.col),
//       endLineNumber: Math.max(1, x.line),
//       endColumn: Math.max(1, x.col + 1),
//       message: x.msg,
//       severity: monaco.MarkerSeverity.Error,
//     }));
//     monaco.editor.setModelMarkers(model, "owner", m);
//   }

//   // Convert absolute character position to line/col
//   function posToLineCol(text: string, pos: number) {
//     if (!text || pos <= 0) return { line: 1, col: 1 };
//     const upto = text.slice(0, pos);
//     const lines = upto.split(/\r\n|\n/);
//     const line = lines.length;
//     const col = lines[lines.length - 1].length + 1; // 1-based
//     return { line, col };
//   }

//   // Validate current buffer according to selected format
//   function validateCurrent():
//     | { ok: true; data: any }
//     | { ok: false; message: string; details?: string } {
//     try {
//       clearMarkers();
//       let data: any;
//       if (format === "json") {
//         try {
//           data = JSON.parse(code);
//         } catch (je: any) {
//           // Try to extract position: V8 message includes "position X"
//           const msg = je?.message || "JSON parse error";
//           const posMatch =
//             msg.match(/position\\s(\\d+)/i) ||
//             msg.match(/at\\sposition\\s(\\d+)/i);
//           let line = 1,
//             col = 1;
//           if (posMatch && posMatch[1]) {
//             const pos = parseInt(posMatch[1], 10);
//             const lc = posToLineCol(code, pos);
//             line = lc.line;
//             col = lc.col;
//           } else {
//             // fallback: search for common problem tokens (approximate)
//             const tokMatch = msg.match(/Unexpected token\\s['`"]?(.)/i);
//             if (tokMatch && tokMatch[1]) {
//               const ch = tokMatch[1];
//               const idx = code.indexOf(ch);
//               if (idx >= 0) {
//                 const lc = posToLineCol(code, idx);
//                 line = lc.line;
//                 col = lc.col;
//               }
//             }
//           }
//           setMarker(line, col, msg);
//           throw new Error(msg);
//         }
//       } else if (format === "yaml") {
//         try {
//           data = yaml.load(code);
//         } catch (ye: any) {
//           // yaml error has mark with line/column (0-based lines)
//           const msg = ye?.message || "YAML parse error";
//           if (ye?.mark && typeof ye.mark.line === "number") {
//             setMarker(
//               (ye.mark.line || 0) + 1,
//               (ye.mark.column || 0) + 1,
//               ye.reason || msg
//             );
//           }
//           throw new Error(msg);
//         }
//       } else {
//         // XML validation with line/col
//         const res = XMLValidator.validate(code, {
//           allowBooleanAttributes: true,
//         });
//         if (res !== true) {
//           const err = res as any; // { err: { code, msg, line, col } }
//           const msg = err?.err?.msg || "XML validation error";
//           if (err?.err?.line && err?.err?.col) {
//             setMarker(err.err.line, err.err.col, msg);
//           }
//           throw new Error(msg);
//         }
//         data = parser.parse(code);
//       }
//       // if reached here, no thrown error
//       return { ok: true, data };
//     } catch (e: any) {
//       // Return structured error for UI
//       return {
//         ok: false,
//         message: e?.message || "Validation failed",
//         details: typeof e?.stack === "string" ? e.stack : undefined,
//       };
//     }
//   }

//   // Realtime validation (debounced)
//   useEffect(() => {
//     const id = setTimeout(() => {
//       if (!code) {
//         setError(null);
//         clearMarkers();
//         return;
//       }
//       const result = validateCurrent();
//       if (result.ok) {
//         setError(null);
//       } else {
//         setError({ message: result.message, details: result.details });
//       }
//     }, 300);
//     return () => clearTimeout(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [code, format]);

//   // Convert between formats (validates first)
//   const convert = async (targetFormat: "json" | "xml" | "yaml") => {
//     const v = validateCurrent();
//     if (!v.ok) {
//       setError({ message: v.message, details: v.details });
//       return;
//     }

//     try {
//       const data = v.data;
//       let result = "";
//       if (targetFormat === "json") result = JSON.stringify(data, null, 2);
//       if (targetFormat === "yaml")
//         result = yaml.dump(data as any, { lineWidth: 120 });
//       if (targetFormat === "xml") {
//         const wrapped = wrapForXml(data, (rootName || "root").trim());
//         result = builder.build(wrapped);
//       }

//       setCode(result);
//       setFormat(targetFormat);

//       // pretty print in Monaco after switching language
//       setTimeout(() => {
//         if (targetFormat === "xml") prettyViaMonaco();
//       }, 50);
//     } catch (e: any) {
//       setError({
//         message: e?.message || "Conversion failed",
//         details: e?.stack,
//       });
//     }
//   };

//   // Save: validate then download
//   const onSave = async () => {
//     setSaving(true);
//     try {
//       const v = validateCurrent();
//       if (!v.ok) {
//         setError({ message: v.message, details: v.details });
//         // focus reveal editor
//         if (editorRef.current) editorRef.current.focus();
//         return;
//       }
//       const ext =
//         format === "json" ? "json" : format === "yaml" ? "yaml" : "xml";
//       const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `data.${ext}`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Keyboard: Cmd/Ctrl+S to save
//   useEffect(() => {
//     function onKey(e: KeyboardEvent) {
//       if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
//         e.preventDefault();
//         onSave();
//       }
//     }
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   // Reformat when language changes
//   useEffect(() => {
//     if (editorRef.current) prettyViaMonaco();
//   }, [format]);

//   // Apply theme when it changes (ensures runtime switching works)
//   useEffect(() => {
//     if (monacoRef.current) {
//       monacoRef.current.editor.setTheme(theme);
//     }
//   }, [theme]);

//   // Reveal the first error line in the editor (used by the status box button)
//   const revealFirstError = () => {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (!monaco || !model) return;
//     const markers = monaco.editor.getModelMarkers({ resource: model.uri });
//     if (!markers || markers.length === 0) return;
//     const m = markers[0];
//     editorRef.current.revealLineInCenter(m.startLineNumber);
//     editorRef.current.setPosition({
//       lineNumber: m.startLineNumber,
//       column: m.startColumn,
//     });
//     editorRef.current.focus();
//   };

//   return (
//     <div style={{ width: "100%" }}>
//       {/* Top bar */}
//       <div
//         style={{
//           marginBottom: 8,
//           gap: 10,
//           display: "flex",
//           flexWrap: "wrap",
//           alignItems: "center",
//         }}
//       >
//         <strong style={{ marginRight: 8 }}>Format:</strong>
//         <span
//           style={{
//             padding: "6px 10px",
//             borderRadius: 8,
//             background: "#f3f4f6",
//             border: "1px solid #e5e7eb",
//             color: "#000",
//           }}
//         >
//           {format.toUpperCase()}
//         </span>

//         <div
//           style={{
//             marginLeft: "auto",
//             display: "flex",
//             gap: 8,
//             alignItems: "center",
//           }}
//         >
//           {/* Theme selector */}
//           <select
//             value={theme}
//             onChange={(e) => setTheme(e.target.value as any)}
//             style={{
//               padding: "6px 8px",
//               borderRadius: 6,
//               border: "1px solid #d1d5db",
//               background: "white",
//             }}
//             title="Editor theme"
//           >
//             <option value="vs">Light</option>
//             <option value="vs-dark">Dark</option>
//             <option value="hc-black">High Contrast</option>
//             <option value="custom-dark">Custom Dark</option>
//           </select>

//           {/* Root tag input (used when converting TO XML) */}
//           <label style={{ fontSize: 12, color: "#6b7280" }}>
//             Root tag:
//             <input
//               value={rootName}
//               onChange={(e) => setRootName(e.target.value || "root")}
//               placeholder="root"
//               style={{
//                 marginLeft: 6,
//                 padding: "6px 8px",
//                 borderRadius: 6,
//                 border: "1px solid #d1d5db",
//                 outline: "none",
//               }}
//             />
//           </label>

//           <button onClick={() => convert("json")} style={btn()}>
//             To JSON
//           </button>
//           <button onClick={() => convert("yaml")} style={btn()}>
//             To YAML
//           </button>
//           <button onClick={() => convert("xml")} style={btn()}>
//             To XML
//           </button>
//           <button
//             onClick={onSave}
//             style={btnPrimary()}
//             disabled={!!error || saving}
//           >
//             {saving ? "Saving…" : "Save"}
//           </button>
//         </div>
//       </div>

//       {/* Editor */}
//       <Editor
//         height="60vh"
//         width="100%"
//         language={format}
//         value={code}
//         onChange={(v) => setCode(v || "")}
//         onMount={handleEditorMount}
//         theme={theme}
//         options={{
//           automaticLayout: true,
//           formatOnPaste: true,
//           formatOnType: true,
//           minimap: { enabled: false },
//         }}
//       />

//       {/* Always-visible error/status log */}
//       <ErrorLog
//         message={error?.message}
//         details={error?.details}
//         onReveal={revealFirstError}
//       />

//       {/* Footer tip */}
//       <div
//         style={{
//           marginTop: 8,
//           display: "flex",
//           justifyContent: "space-between",
//           fontSize: 12,
//           color: "#6b7280",
//         }}
//       >
//         <span>
//           Tip: Paste JSON/YAML/XML, then convert or press Save (⌘/Ctrl+S).
//         </span>
//         <span>Pretty printing by XMLBuilder + Monaco (⌥⇧F / Ctrl+Shift+I)</span>
//       </div>
//     </div>
//   );
// }

// // Button style helpers
// function btn() {
//   return {
//     padding: "8px 12px",
//     borderRadius: 8,
//     background: "#e5e7eb",
//     color: "#111827",
//     border: "1px solid #d1d5db",
//     cursor: "pointer",
//   } as React.CSSProperties;
// }

// function btnPrimary() {
//   return {
//     padding: "8px 12px",
//     borderRadius: 8,
//     background: "red",
//     color: "white",
//     border: "1px solid #111827",
//     cursor: "pointer",
//   } as React.CSSProperties;
// }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import Editor, { OnMount } from "@monaco-editor/react";
// import yaml from "js-yaml";
// import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

// /**
//  * Converter component with inline-only error handling.
//  * - JSON: uses Monaco's built-in diagnostics (shows inline squiggles & hovers)
//  * - YAML: parses with js-yaml and sets Monaco marker for error location
//  * - XML: validates with fast-xml-parser and sets Monaco marker for error location
//  *
//  * No external error box — errors appear only in-editor as markers.
//  */

// export default function Converter() {
//   const [code, setCode] = useState("");
//   const [format, setFormat] = useState<"json" | "xml" | "yaml">("json");
//   const [saving, setSaving] = useState(false);
//   const [rootName, setRootName] = useState("root"); // used when converting to XML
//   const [theme, setTheme] = useState<
//     "vs" | "vs-dark" | "hc-black" | "custom-dark"
//   >("vs-dark");
//   const [inlineErrorCount, setInlineErrorCount] = useState(0);

//   const editorRef = useRef<any>(null);
//   const monacoRef = useRef<any>(null);

//   const parser = new XMLParser();
//   const builder = new XMLBuilder({
//     format: true,
//     indentBy: "  ",
//     suppressEmptyNode: false,
//   });

//   // onMount - capture monaco + editor, define custom theme, enable json diagnostics
//   const handleEditorMount: OnMount = (editor, monaco) => {
//     editorRef.current = editor;
//     monacoRef.current = monaco;

//     // Define optional custom theme
//     try {
//       monaco.editor.defineTheme("custom-dark", {
//         base: "vs-dark",
//         inherit: true,
//         rules: [
//           { token: "comment", foreground: "7CFC00", fontStyle: "italic" },
//           { token: "string", foreground: "FFB86C" },
//         ],
//         colors: {
//           "editor.background": "#0f172a",
//           "editorLineNumber.foreground": "#94a3b8",
//           "editorCursor.foreground": "#FFB86C",
//         },
//       });
//     } catch (e) {
//       // ignore if theme already defined
//     }

//     // Apply theme
//     try {
//       monaco.editor.setTheme(theme);
//     } catch (e) {}

//     // Enable Monaco JSON diagnostics (if available)
//     try {
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       if (
//         monaco.languages &&
//         monaco.languages.json &&
//         monaco.languages.json.jsonDefaults
//       ) {
//         // Enable validation, allow comments so more tolerant
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
//           validate: true,
//           allowComments: true,
//           schemas: [], // no schema; can be added for more structured validation
//         });
//       }
//     } catch (e) {
//       // ignore
//     }

//     // update inline error count initially
//     updateInlineErrorCount();
//   };

//   // Helper to pretty-format via Monaco
//   const prettyViaMonaco = () => {
//     editorRef.current?.getAction("editor.action.formatDocument")?.run();
//   };

//   // Wrap data for XML conversion ensuring single root
//   function wrapForXml(data: any, name: string) {
//     if (Array.isArray(data)) return { [name]: { item: data } };
//     if (data !== null && typeof data === "object") {
//       const keys = Object.keys(data);
//       if (keys.length === 1) return data;
//       return { [name]: data };
//     }
//     return { [name]: data };
//   }

//   // Monaco markers helpers
//   function clearMarkers() {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (monaco && model) monaco.editor.setModelMarkers(model, "owner", []);
//     updateInlineErrorCount();
//   }

//   function setMarkers(
//     markers: { line: number; column: number; message: string }[]
//   ) {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (!monaco || !model) return;
//     const m = markers.map((x) => ({
//       startLineNumber: Math.max(1, x.line),
//       startColumn: Math.max(1, x.column),
//       endLineNumber: Math.max(1, x.line),
//       endColumn: Math.max(1, x.column + 1),
//       message: x.message,
//       severity: monaco.MarkerSeverity.Error,
//     }));
//     monaco.editor.setModelMarkers(model, "owner", m);
//     updateInlineErrorCount();
//   }

//   // Update count of inline errors from Monaco markers
//   function updateInlineErrorCount() {
//     const monaco = monacoRef.current;
//     const model = editorRef.current?.getModel?.();
//     if (!monaco || !model) {
//       setInlineErrorCount(0);
//       return;
//     }
//     const markers =
//       monaco.editor.getModelMarkers({ resource: model.uri }) || [];
//     setInlineErrorCount(markers.length);
//   }

//   // Convert JSON position (character index) to line/col (1-based)
//   function posToLineCol(text: string, pos: number) {
//     if (!text || pos <= 0) return { line: 1, col: 1 };
//     const upto = text.slice(0, pos);
//     const lines = upto.split(/\r\n|\n/);
//     const line = lines.length;
//     const col = lines[lines.length - 1].length + 1;
//     return { line, col };
//   }

//   // Validate current buffer; set markers for YAML/XML; for JSON rely on Monaco's diagnostics
//   function validateAndMark():
//     | { ok: true; data: any }
//     | { ok: false; message: string; details?: string } {
//     clearMarkers();
//     try {
//       if (format === "json") {
//         // Let Monaco show JSON errors — but we still attempt JSON.parse to get data for conversions.
//         // Try parse; if parse fails, we attempt to find position and set a fallback marker (Monaco likely already has markers though).
//         try {
//           const data = JSON.parse(code);
//           // update inline errors (Monaco may have zero)
//           setTimeout(updateInlineErrorCount, 50);
//           return { ok: true, data };
//         } catch (je: any) {
//           // try extract position from message
//           const msg = je?.message || "JSON parse error";
//           const posMatch =
//             msg.match(/position\s+(\d+)/i) || msg.match(/at position\s+(\d+)/i);
//           if (posMatch && posMatch[1]) {
//             const pos = parseInt(posMatch[1], 10);
//             const lc = posToLineCol(code, pos);
//             setMarkers([{ line: lc.line, column: lc.col, message: msg }]);
//           } else {
//             // fallback: place marker at first non-whitespace char
//             setMarkers([{ line: 1, column: 1, message: msg }]);
//           }
//           return { ok: false, message: msg, details: je?.stack };
//         }
//       } else if (format === "yaml") {
//         try {
//           const data = yaml.load(code);
//           // yaml.load can succeed; clear markers already done
//           updateInlineErrorCount();
//           return { ok: true, data };
//         } catch (ye: any) {
//           const msg = ye?.message || "YAML parse error";
//           if (ye?.mark && typeof ye.mark.line === "number") {
//             setMarkers([
//               {
//                 line: (ye.mark.line || 0) + 1,
//                 column: (ye.mark.column || 0) + 1,
//                 message: ye.reason || msg,
//               },
//             ]);
//           } else {
//             setMarkers([{ line: 1, column: 1, message: msg }]);
//           }
//           return { ok: false, message: msg, details: ye?.stack };
//         }
//       } else {
//         // XML
//         const res = XMLValidator.validate(code, {
//           allowBooleanAttributes: true,
//         });
//         if (res !== true) {
//           const err = res as any;
//           const msg = err?.err?.msg || "XML validation error";
//           if (err?.err?.line && err?.err?.col) {
//             setMarkers([
//               { line: err.err.line, column: err.err.col, message: msg },
//             ]);
//           } else {
//             setMarkers([{ line: 1, column: 1, message: msg }]);
//           }
//           return { ok: false, message: msg, details: JSON.stringify(err) };
//         }
//         const data = parser.parse(code);
//         updateInlineErrorCount();
//         return { ok: true, data };
//       }
//     } catch (e: any) {
//       // unexpected
//       setMarkers([
//         { line: 1, column: 1, message: e?.message || "Validation error" },
//       ]);
//       return {
//         ok: false,
//         message: e?.message || "Validation error",
//         details: e?.stack,
//       };
//     }
//   }

//   // Realtime validation (debounced). This will set Monaco markers for YAML/XML and minimal fallback for JSON.
//   useEffect(() => {
//     const id = setTimeout(() => {
//       if (!code) {
//         clearMarkers();
//         setInlineErrorCount(0);
//         return;
//       }
//       validateAndMark();
//     }, 300);
//     return () => clearTimeout(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [code, format]);

//   // Convert between formats (validates first)
//   const convert = async (targetFormat: "json" | "xml" | "yaml") => {
//     const v = validateAndMark();
//     if (!v.ok) {
//       return;
//     }
//     try {
//       const data = v.data;
//       let result = "";
//       if (targetFormat === "json") result = JSON.stringify(data, null, 2);
//       if (targetFormat === "yaml")
//         result = yaml.dump(data as any, { lineWidth: 120 });
//       if (targetFormat === "xml") {
//         const wrapped = wrapForXml(data, (rootName || "root").trim());
//         result = builder.build(wrapped);
//       }
//       setCode(result);
//       setFormat(targetFormat);
//       setTimeout(() => {
//         if (targetFormat === "xml") prettyViaMonaco();
//       }, 50);
//     } catch (e: any) {
//       // set single inline marker
//       setMarkers([
//         { line: 1, column: 1, message: e?.message || "Conversion failed" },
//       ]);
//     }
//   };

//   // Save: validate then download
//   const onSave = async () => {
//     setSaving(true);
//     try {
//       const v = validateAndMark();
//       if (!v.ok) {
//         // leave markers visible; do not download
//         return;
//       }
//       const ext =
//         format === "json" ? "json" : format === "yaml" ? "yaml" : "xml";
//       const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `data.${ext}`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Keyboard: Cmd/Ctrl+S to save
//   useEffect(() => {
//     function onKey(e: KeyboardEvent) {
//       if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
//         e.preventDefault();
//         onSave();
//       }
//     }
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [code, format]);

//   // Reformat when language changes
//   useEffect(() => {
//     if (editorRef.current) prettyViaMonaco();
//   }, [format]);

//   // Apply theme when it changes
//   useEffect(() => {
//     if (monacoRef.current) {
//       try {
//         monacoRef.current.editor.setTheme(theme);
//       } catch (e) {}
//     }
//   }, [theme]);

//   // when markers change externally (monaco's JSON diagnostics), update count
//   useEffect(() => {
//     const handle = setInterval(() => updateInlineErrorCount(), 400);
//     return () => clearInterval(handle);
//   }, []);

//   return (
//     <div style={{ width: "100%" }}>
//       {/* Top bar */}
//       <div
//         style={{
//           marginBottom: 8,
//           gap: 10,
//           display: "flex",
//           flexWrap: "wrap",
//           alignItems: "center",
//         }}
//       >
//         <strong style={{ marginRight: 8 }}>Format:</strong>
//         <span
//           style={{
//             padding: "6px 10px",
//             borderRadius: 8,
//             background: "#f3f4f6",
//             border: "1px solid #e5e7eb",
//             color: "#000",
//           }}
//         >
//           {format.toUpperCase()}
//         </span>

//         <div
//           style={{
//             marginLeft: "auto",
//             display: "flex",
//             gap: 8,
//             alignItems: "center",
//           }}
//         >
//           {/* Theme selector */}
//           <select
//             value={theme}
//             onChange={(e) => setTheme(e.target.value as any)}
//             style={{
//               padding: "6px 8px",
//               borderRadius: 6,
//               border: "1px solid #d1d5db",
//               background: "white",
//             }}
//             title="Editor theme"
//           >
//             <option value="vs">Light</option>
//             <option value="vs-dark">Dark</option>
//             <option value="hc-black">High Contrast</option>
//             <option value="custom-dark">Custom Dark</option>
//           </select>

//           {/* Root tag input (used when converting TO XML) */}
//           <label style={{ fontSize: 12, color: "#6b7280" }}>
//             Root tag:
//             <input
//               value={rootName}
//               onChange={(e) => setRootName(e.target.value || "root")}
//               placeholder="root"
//               style={{
//                 marginLeft: 6,
//                 padding: "6px 8px",
//                 borderRadius: 6,
//                 border: "1px solid #d1d5db",
//                 outline: "none",
//               }}
//             />
//           </label>

//           <button onClick={() => convert("json")} style={btn()}>
//             To JSON
//           </button>
//           <button onClick={() => convert("yaml")} style={btn()}>
//             To YAML
//           </button>
//           <button onClick={() => convert("xml")} style={btn()}>
//             To XML
//           </button>
//           <button onClick={onSave} style={btnPrimary()} disabled={saving}>
//             {saving ? "Saving…" : "Save"}
//           </button>
//         </div>
//       </div>

//       {/* Editor */}
//       <Editor
//         height="60vh"
//         width="100%"
//         language={format === "json" ? "json" : format} // ensure Monaco json mode for JSON diagnostics
//         value={code}
//         onChange={(v) => setCode(v || "")}
//         onMount={handleEditorMount}
//         theme={theme}
//         options={{
//           automaticLayout: true,
//           formatOnPaste: true,
//           formatOnType: true,
//           minimap: { enabled: false },
//         }}
//       />

//       {/* Inline-only status: small unobtrusive count (can be removed) */}
//       <div
//         style={{
//           marginTop: 8,
//           display: "flex",
//           justifyContent: "space-between",
//           fontSize: 12,
//           color: "#6b7280",
//         }}
//       >
//         <span>Inline errors: {inlineErrorCount}</span>
//         <span>Pretty printing by XMLBuilder + Monaco (⌥⇧F / Ctrl+Shift+I)</span>
//       </div>
//     </div>
//   );
// }

// // Button style helpers
// function btn() {
//   return {
//     padding: "8px 12px",
//     borderRadius: 8,
//     background: "#e5e7eb",
//     color: "#111827",
//     border: "1px solid #d1d5db",
//     cursor: "pointer",
//   } as React.CSSProperties;
// }

// function btnPrimary() {
//   return {
//     padding: "8px 12px",
//     borderRadius: 8,
//     background: "red",
//     color: "white",
//     border: "1px solid #111827",
//     cursor: "pointer",
//   } as React.CSSProperties;
// }

"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import yaml from "js-yaml";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

export default function Converter() {
  const [code, setCode] = useState("");
  const [format, setFormat] = useState<"json" | "xml" | "yaml">("json");
  const [saving, setSaving] = useState(false);
  const [rootName, setRootName] = useState("root");
  const [theme, setTheme] = useState<
    "vs" | "vs-dark" | "hc-black" | "custom-dark"
  >("vs-dark");
  const [inlineErrorCount, setInlineErrorCount] = useState(0);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const parser = new XMLParser();
  const builder = new XMLBuilder({
    format: true,
    indentBy: "  ",
    suppressEmptyNode: false,
  });

  // Convert char index -> 1-based line/col
  function posToLineCol(text: string, pos: number) {
    if (!text || pos <= 0) return { line: 1, col: 1 };
    const upto = text.slice(0, pos);
    const lines = upto.split(/\r\n|\n/);
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    return { line, col };
  }

  // Reveal & show hover for first marker (makes error visible automatically)
  function revealAndShowHoverForFirstMarker() {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const model = editor?.getModel?.();
    if (!monaco || !editor || !model) return;

    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    if (!markers || markers.length === 0) {
      setInlineErrorCount(0);
      return;
    }

    // focus editor, reveal first marker and set position
    const m = markers[0];
    const line = m.startLineNumber || 1;
    const col = m.startColumn || 1;

    try {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: col });
      editor.focus();

      // Trigger the hover widget programmatically so the message shows.
      // 'editor.action.showHover' is the editor action to display hover.
      // Use 'editor.trigger' to trigger it.
      setTimeout(() => {
        try {
          editor.trigger("keyboard", "editor.action.showHover", {});
        } catch (e) {
          // ignore if action not available
        }
      }, 120); // small delay so the reveal/position completes
    } catch (e) {
      // ignore reveal errors
    }

    setInlineErrorCount(markers.length);
  }

  // Set Monaco markers and then reveal first marker
  function setMarkers(
    markers: { line: number; column: number; message: string }[]
  ) {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel?.();
    if (!monaco || !model) return;
    const m = markers.map((x) => ({
      startLineNumber: Math.max(1, x.line),
      startColumn: Math.max(1, x.column),
      endLineNumber: Math.max(1, x.line),
      endColumn: Math.max(1, x.column + 1),
      message: x.message,
      severity: monaco.MarkerSeverity.Error,
    }));
    monaco.editor.setModelMarkers(model, "owner", m);

    // make the first error visible immediately
    revealAndShowHoverForFirstMarker();
  }

  function clearMarkers() {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel?.();
    if (monaco && model) monaco.editor.setModelMarkers(model, "owner", []);
    setInlineErrorCount(0);
  }

  // Validate and set markers for JSON/YAML/XML
  function validateAndMark() {
    clearMarkers();
    try {
      if (format === "json") {
        // Try JSON.parse to get parse position if any
        try {
          const data = JSON.parse(code);
          // no markers
          setInlineErrorCount(0);
          return { ok: true, data };
        } catch (je: any) {
          const msg = je?.message || "JSON parse error";
          // try extract numeric position from message
          const posMatch =
            msg.match(/position\s+(\d+)/i) || msg.match(/at position\s+(\d+)/i);
          if (posMatch && posMatch[1]) {
            const pos = parseInt(posMatch[1], 10);
            const lc = posToLineCol(code, pos);
            setMarkers([{ line: lc.line, column: lc.col, message: msg }]);
          } else {
            // fallback: place marker at line 1 col 1
            setMarkers([{ line: 1, column: 1, message: msg }]);
          }
          return { ok: false, message: msg };
        }
      } else if (format === "yaml") {
        try {
          const data = yaml.load(code);
          setInlineErrorCount(0);
          return { ok: true, data };
        } catch (ye: any) {
          const msg = ye?.message || "YAML parse error";
          const line = ye?.mark?.line != null ? ye.mark.line + 1 : 1;
          const col = ye?.mark?.column != null ? ye.mark.column + 1 : 1;
          setMarkers([{ line, column: col, message: msg }]);
          return { ok: false, message: msg };
        }
      } else {
        const res = XMLValidator.validate(code, {
          allowBooleanAttributes: true,
        });
        if (res !== true) {
          const err = res as any;
          const msg = err?.err?.msg || "XML validation error";
          const line = err?.err?.line || 1;
          const col = err?.err?.col || 1;
          setMarkers([{ line, column: col, message: msg }]);
          return { ok: false, message: msg };
        }
        const data = parser.parse(code);
        setInlineErrorCount(0);
        return { ok: true, data };
      }
    } catch (e: any) {
      setMarkers([
        { line: 1, column: 1, message: e?.message || "Validation error" },
      ]);
      return { ok: false, message: e?.message || "Validation error" };
    }
  }

  // Convert functions
  function wrapForXml(data: any, name: string) {
    if (Array.isArray(data)) return { [name]: { item: data } };
    if (data !== null && typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length === 1) return data;
      return { [name]: data };
    }
    return { [name]: data };
  }

  const convert = (targetFormat: "json" | "xml" | "yaml") => {
    const v = validateAndMark();
    if (!v.ok) return;
    try {
      const data = v.data;
      let result = "";
      if (targetFormat === "json") result = JSON.stringify(data, null, 2);
      if (targetFormat === "yaml")
        result = yaml.dump(data as any, { lineWidth: 120 });
      if (targetFormat === "xml")
        result = builder.build(wrapForXml(data, (rootName || "root").trim()));
      setCode(result);
      setFormat(targetFormat);

      // format XML output
      setTimeout(() => {
        if (targetFormat === "xml") {
          editorRef.current?.getAction("editor.action.formatDocument")?.run();
        }
      }, 80);
    } catch (e: any) {
      setMarkers([
        { line: 1, column: 1, message: e?.message || "Conversion failed" },
      ]);
    }
  };

  // Save with validation
  const onSave = async () => {
    setSaving(true);
    try {
      const v = validateAndMark();
      if (!v.ok) return;
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

  // Editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // define custom theme safely
    try {
      monaco.editor.defineTheme("custom-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [{ token: "string", foreground: "FFB86C" }],
        colors: { "editor.background": "#0f172a" },
      });
    } catch (e) {}

    try {
      monaco.editor.setTheme(theme);
    } catch (e) {}

    // show markers immediately if the buffer already has errors
    setTimeout(() => validateAndMark(), 60);
  };

  // Realtime validation (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      validateAndMark();
    }, 300);
    return () => clearTimeout(id);
  }, [code, format]);

  // Save shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, format]);

  // apply theme when changed
  useEffect(() => {
    if (monacoRef.current) {
      try {
        monacoRef.current.editor.setTheme(theme);
      } catch (e) {}
    }
  }, [theme]);

  // refresh inline count from monaco markers occasionally (covers Monaco JSON diagnostics)
  useEffect(() => {
    const t = setInterval(() => {
      const monaco = monacoRef.current;
      const model = editorRef.current?.getModel?.();
      if (!monaco || !model) return;
      const markers =
        monaco.editor.getModelMarkers({ resource: model.uri }) || [];
      setInlineErrorCount(markers.length);
    }, 400);
    return () => clearInterval(t);
  }, []);

  // UI
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <strong>Format:</strong>
        <span
          style={{ background: "#eee", padding: "4px 8px", borderRadius: 4 }}
        >
          {format.toUpperCase()}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as any)}
            style={{ borderRadius: 6, padding: "4px 6px" }}
          >
            <option value="vs">Light</option>
            <option value="vs-dark">Dark</option>
            <option value="custom-dark">Custom Dark</option>
          </select>
          <label>
            Root tag:
            <input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              style={{ marginLeft: 6, borderRadius: 4, padding: "4px 6px" }}
            />
          </label>
          <button onClick={() => convert("json")}>To JSON</button>
          <button onClick={() => convert("yaml")}>To YAML</button>
          <button onClick={() => convert("xml")}>To XML</button>
          <button onClick={onSave}>Save</button>
        </div>
      </div>

      <Editor
        height="60vh"
        width="100%"
        language={format === "json" ? "json" : format}
        value={code}
        onChange={(v) => setCode(v ?? "")}
        onMount={handleEditorMount}
        theme={theme}
        options={{
          automaticLayout: true,
          formatOnPaste: true,
          minimap: { enabled: false },
        }}
      />

      <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
        Inline errors: {inlineErrorCount > 0 ? inlineErrorCount : "None"}
      </div>
    </div>
  );
}
