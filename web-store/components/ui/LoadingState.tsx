export function LoadingState({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner" aria-hidden />
      <p>{label}</p>
    </div>
  );
}
