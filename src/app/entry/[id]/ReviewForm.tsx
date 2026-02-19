"use client";

import { useActionState } from "react";
import { createOrUpdateReview } from "@/server-actions/entries";

type Props = {
  entryId: string;
  voteMode: "SIMPLE" | "DETAILED";
  initialRating?: number | null;
  initialComment?: string | null;
  initialRatingCost?: number | null;
  initialRatingService?: number | null;
  initialRatingFood?: number | null;
  initialRatingLocation?: number | null;
};

function RatingInput({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: number | null | undefined;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
      >
        {label} (1–10)
      </label>
      <input
        id={id}
        type="number"
        name={name}
        min={1}
        max={10}
        required
        defaultValue={defaultValue ?? ""}
        className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </div>
  );
}

export function ReviewForm({
  entryId,
  voteMode,
  initialRating,
  initialComment,
  initialRatingCost,
  initialRatingService,
  initialRatingFood,
  initialRatingLocation,
}: Props) {
  const [state, formAction] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await createOrUpdateReview(entryId, formData);
      if (result?.error) return result.error;
      return null;
    },
    null as string | null
  );
  const isDetailed = voteMode === "DETAILED";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="rating_overall"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Voto complessivo (1–10)
        </label>
        <input
          id="rating_overall"
          type="number"
          name="rating_overall"
          min={1}
          max={10}
          required
          defaultValue={initialRating ?? ""}
          className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {isDetailed && (
        <div className="grid gap-4 sm:grid-cols-2">
          <RatingInput
            id="rating_cost"
            name="rating_cost"
            label="Costo"
            defaultValue={initialRatingCost}
          />
          <RatingInput
            id="rating_service"
            name="rating_service"
            label="Servizio"
            defaultValue={initialRatingService}
          />
          <RatingInput
            id="rating_food"
            name="rating_food"
            label="Cibo"
            defaultValue={initialRatingFood}
          />
          <RatingInput
            id="rating_location"
            name="rating_location"
            label="Location"
            defaultValue={initialRatingLocation}
          />
        </div>
      )}
      <div>
        <label
          htmlFor="comment"
          className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          Commento (opzionale)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="Come è andata?"
          defaultValue={initialComment ?? ""}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {state && (
        <p className="text-sm text-red-600 dark:text-red-400">{state}</p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {initialRating != null ? "Aggiorna recensione" : "Salva recensione"}
      </button>
    </form>
  );
}
