import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <main className="flex h-[100dvh] items-center justify-center overflow-y-auto pb-24 pt-4">
      <LoadingSpinner />
    </main>
  );
}
