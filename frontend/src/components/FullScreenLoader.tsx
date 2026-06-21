import { Spinner } from "./Spinner";

export function FullScreenLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-app)",
      }}
    >
      <Spinner size={28} color="var(--accent)" />
    </div>
  );
}
