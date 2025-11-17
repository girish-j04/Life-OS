import { supabase } from './supabase';

type CaptureCategory = 'task' | 'note' | 'expense' | 'income';

const CAPTURE_BUCKET = 'capture-media';

/**
 * Uploads an image to Supabase Storage and returns a public URL.
 * Keeps the logic isolated so the CaptureBox stays lean.
 */
export async function uploadCapturePhoto(file: File, category: CaptureCategory): Promise<string> {
  const extension =
    file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const fileName = `${category}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(CAPTURE_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(CAPTURE_BUCKET).getPublicUrl(fileName);
  if (!data?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded photo');
  }

  return data.publicUrl;
}

/**
 * Removes an uploaded photo when a capture is deleted.
 * Gracefully does nothing if the URL can't be parsed or file already gone.
 */
export async function deleteCapturePhoto(publicUrl?: string | null): Promise<void> {
  if (!publicUrl) return;

  const path = getPathFromPublicUrl(publicUrl);
  if (!path) return;

  const { error } = await supabase.storage.from(CAPTURE_BUCKET).remove([path]);
  if (error) {
    throw error;
  }
}

function getPathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const key = `${CAPTURE_BUCKET}/`;
    const idx = parsed.pathname.indexOf(key);
    if (idx === -1) return null;
    const path = parsed.pathname.slice(idx + key.length);
    return decodeURIComponent(path);
  } catch (error) {
    console.warn('Failed to parse capture photo URL', error);
    return null;
  }
}
