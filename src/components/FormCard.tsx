import { LoadingSpinner } from "@/components/LoadingSpinner";

type FormCardProps = {
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
} & Pick<React.HTMLAttributes<HTMLDivElement>, "id" | "role" | "ariaLabelledby" | "hidden" | "className">;

export function FormCard({
  disabled = false,
  isLoading = false,
  children,
  id,
  role,
  ariaLabelledby,
  hidden,
  className,
}: FormCardProps) {
  return (
    <div
      id={id}
      role={role}
      aria-labelledby={ariaLabelledby}
      hidden={hidden}
      className={`relative rounded-2xl bg-surface p-4 shadow-sm transition-opacity ${
        disabled ? "pointer-events-none opacity-50" : ""
      } ${className ?? ""}`}
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
