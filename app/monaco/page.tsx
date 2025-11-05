import Converter from "../../components/Convertor";

export default function MonacoEditor() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <h1>This is my Monaco Editor</h1>
      <Converter />
    </div>
  );
}
