"use client";

import { useState, useRef, useEffect } from "react";

export function ReviewComment({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const [showReadMore, setShowReadMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setShowReadMore(el.scrollHeight > el.clientHeight);
  }, [text]);

  if (!text) return null;

  return (
    <div className="py-1 pl-3 pr-2">
      <p
        ref={ref}
        className={`text-sm text-text-secondary ${!expanded ? "line-clamp-8" : ""}`}
      >
        {text}
      </p>
      {!expanded && showReadMore && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm font-medium text-accent hover:underline"
        >
          Continua a leggere
        </button>
      )}
      {expanded && showReadMore && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-1 text-sm font-medium text-accent hover:underline"
        >
          Riduci
        </button>
      )}
    </div>
  );
}
