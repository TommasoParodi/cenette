import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 pb-24">
      <LoadingSpinner />
    </main>
  );
}
