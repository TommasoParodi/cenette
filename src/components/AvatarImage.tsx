"use client";

import { useState } from "react";

/**
 * Renders an avatar <img> with automatic fallback to `children` (typically
 * initials) when `src` is null/undefined or the image fails to load.
 */
export function AvatarImage({
  src,
  children,
  imgClassName = "h-full w-full object-cover",
}: {
  src: string | null | undefined;
  children: React.ReactNode;
  imgClassName?: string;
}) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{children}</>;
  }

  return (
    <img
      src={src}
      alt=""
      className={imgClassName}
      onError={() => setError(true)}
    />
  );
}
