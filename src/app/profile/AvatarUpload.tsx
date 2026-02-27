"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

type AvatarUploadProps = {
  avatarSignedUrl: string | null;
  initials: string;
  uploadAvatar: (formData: FormData) => Promise<{ error?: string } | void>;
};

function AvatarUploadLabel({
  avatarSignedUrl,
  initials,
}: {
  avatarSignedUrl: string | null;
  initials: string;
}) {
  const { pending } = useFormStatus();
  const [imgError, setImgError] = useState(false);

  const showImage = !!avatarSignedUrl && !imgError;

  return (
    <div className="relative h-24 w-24">
      <label
        htmlFor="avatar-upload"
        className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-separator-line bg-avatar-user-bg transition hover:opacity-90 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2"
        title="Clicca per cambiare immagine"
      >
        {showImage ? (
          <Image
            src={avatarSignedUrl}
            alt=""
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized
            priority
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-medium text-foreground" aria-hidden>
            {initials}
          </span>
        )}
      </label>
      {pending && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80"
          aria-live="polite"
          aria-busy="true"
        >
          <LoadingSpinner className="h-10 w-10 border-t-accent" />
        </div>
      )}
    </div>
  );
}

export function AvatarUpload({
  avatarSignedUrl,
  initials,
  uploadAvatar,
}: AvatarUploadProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await uploadAvatar(formData);
      }}
      className="relative"
    >
      <input
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        id="avatar-upload"
        onChange={() => {
          formRef.current?.requestSubmit();
        }}
      />
      <AvatarUploadLabel avatarSignedUrl={avatarSignedUrl} initials={initials} />
    </form>
  );
}
