/**
 * Comprime immagini lato client prima dell'upload per ridurre spazio su Supabase.
 * Output: JPEG max ~400 KB, lato max 1600 px.
 */
export async function compressPhotoFiles(files: File[]): Promise<File[]> {
  if (files.length === 0) return [];
  const imageCompression = (await import("browser-image-compression")).default;
  const opts = {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1600,
    initialQuality: 0.82,
    fileType: "image/jpeg" as const,
    useWebWorker: true,
  };
  return Promise.all(files.map((file) => imageCompression(file, opts)));
}
