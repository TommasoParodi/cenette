export function LoadingSpinner({ className }: { className?: string } = {}) {
  return (
    <div
      className={`h-10 w-10 animate-spin rounded-full border-2 border-separator-line border-t-accent ${className ?? ""}`}
      aria-hidden
    />
  );
}
