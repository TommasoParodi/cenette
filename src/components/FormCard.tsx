import { LoadingSpinner } from "@/components/LoadingSpinner";

export function FormCard({
  disabled = false,
  isLoading = false,
  children,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-surface p-4 shadow-sm transition-opacity ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {children}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface/80"
          aria-hidden
        >
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
