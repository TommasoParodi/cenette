/**
 * URL pubblici per le foto in storage (eventi e recensioni).
 * Usa object/public per permettere cache del browser senza signed URL.
 */

const ENTRY_PHOTOS_BUCKET = "entry-photos";
const REVIEW_PHOTOS_BUCKET = "review-photos";

export type StoragePhotoBucket = typeof ENTRY_PHOTOS_BUCKET | typeof REVIEW_PHOTOS_BUCKET;

/**
 * Genera l'URL pubblico per un file nello storage.
 * Formato: .../storage/v1/object/public/<bucket>/<path>
 *
 * @param bucket - "entry-photos" | "review-photos"
 * @param storagePath - Path del file nel bucket (es. "entries/entry-id/uuid.jpg")
 * @returns URL pubblico o null se path/url non validi
 */
export function getStoragePublicUrl(
  bucket: StoragePhotoBucket,
  storagePath: string | null
): string | null {
  if (!storagePath?.trim()) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

/**
 * URL pubblico per una foto evento (bucket entry-photos).
 */
export function getEntryPhotoPublicUrl(storagePath: string | null): string | null {
  return getStoragePublicUrl(ENTRY_PHOTOS_BUCKET, storagePath);
}

/**
 * URL pubblico per una foto recensione (bucket review-photos).
 */
export function getReviewPhotoPublicUrl(storagePath: string | null): string | null {
  return getStoragePublicUrl(REVIEW_PHOTOS_BUCKET, storagePath);
}
