import { tripConfig } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase-client";

export const STORAGE_PHOTO_PREFIX = "storage:";

export function isStoragePhotoRef(value: string) {
  return value.startsWith(STORAGE_PHOTO_PREFIX);
}

export function isLegacyDataUrl(value: string) {
  return value.startsWith("data:");
}

export function storagePathFromRef(ref: string) {
  return ref.slice(STORAGE_PHOTO_PREFIX.length);
}

export function toStoragePhotoRef(path: string) {
  return `${STORAGE_PHOTO_PREFIX}${path}`;
}

function createPhotoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  const fromType = file.type.split("/")[1]?.toLowerCase() ?? "";
  if (fromType === "jpeg") return "jpg";
  if (/^[a-z0-9]{1,8}$/.test(fromType)) return fromType;
  return "jpg";
}

export function canUsePhotoStorage() {
  return (
    tripConfig.storage.enabled &&
    tripConfig.supabase.enabled &&
    Boolean(tripConfig.supabase.projectUrl) &&
    Boolean(getSupabaseClient())
  );
}

export function buildTripPhotoPath(tripId: string, file: File) {
  return `${tripId}/${createPhotoId()}.${fileExtension(file)}`;
}

export async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadTripPhoto(tripId: string, file: File) {
  const client = getSupabaseClient();
  if (!client || !canUsePhotoStorage()) {
    throw new Error("photo_storage_unavailable");
  }

  const path = buildTripPhotoPath(tripId, file);
  const { error } = await client.storage
    .from(tripConfig.storage.bucket)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });

  if (error) throw error;
  return toStoragePhotoRef(path);
}

export async function deleteStoredPhoto(ref: string) {
  if (!isStoragePhotoRef(ref)) return;

  const client = getSupabaseClient();
  if (!client || !tripConfig.storage.enabled) return;

  await client.storage.from(tripConfig.storage.bucket).remove([storagePathFromRef(ref)]);
}

export async function resolvePhotoUrl(ref: string, expiresIn = 3600) {
  if (isLegacyDataUrl(ref) || ref.startsWith("http://") || ref.startsWith("https://")) {
    return ref;
  }

  if (!isStoragePhotoRef(ref)) return ref;

  const client = getSupabaseClient();
  if (!client) return "";

  const { data, error } = await client.storage
    .from(tripConfig.storage.bucket)
    .createSignedUrl(storagePathFromRef(ref), expiresIn);

  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

export async function resolvePhotoUrls(refs: string[]) {
  return Promise.all(refs.map((ref) => resolvePhotoUrl(ref)));
}

export async function uploadTripPhotos(tripId: string, files: File[]) {
  const refs: string[] = [];

  for (const file of files) {
    if (canUsePhotoStorage()) {
      refs.push(await uploadTripPhoto(tripId, file));
      continue;
    }
    refs.push(await readFileAsDataUrl(file));
  }

  return refs;
}
