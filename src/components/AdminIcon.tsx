/** Icona admin: persona (per creatori di gruppo in Cenette) */
export function AdminIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <title>Admin del gruppo</title>
      {/* Testa */}
      <circle cx="12" cy="8" r="3.5" />
      {/* Corpo / spalle */}
      <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
    </svg>
  );
}
