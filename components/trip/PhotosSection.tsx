"use client";

import { useEffect, useState } from "react";
import { resolvePhotoUrls } from "@/lib/photo-storage";
import { useLocale } from "@/contexts/LocaleContext";

type PhotosSectionProps = {
  photos: string[];
  onAdd: (files: File[]) => void | Promise<void>;
  onDelete: (index: number) => void;
};

export function PhotosSection({ photos, onAdd, onDelete }: PhotosSectionProps) {
  const { t } = useLocale();
  const [displayUrls, setDisplayUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const resolved = await resolvePhotoUrls(photos);
      if (!cancelled) setDisplayUrls(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, [photos]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, 12);
    event.target.value = "";
    if (!files.length) return;

    setUploadError("");
    setUploading(true);
    try {
      await onAdd(files);
    } catch {
      setUploadError(t("photos.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="section photos-section" id="photos" aria-labelledby="photos-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t("photos.kicker")}</p>
          <h2 id="photos-title">{t("photos.title")}</h2>
        </div>
        <label className={`upload-tile${uploading ? " is-busy" : ""}`}>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(event) => void handleFileChange(event)}
          />
          <span>{uploading ? t("photos.uploading") : t("photos.upload")}</span>
        </label>
      </div>
      {uploadError ? <p className="form-error">{uploadError}</p> : null}
      <div className="photo-grid">
        {photos.length === 0 ? (
          <div className="empty-state">{t("photos.empty")}</div>
        ) : (
          photos.map((photo, index) => (
            <figure key={`${photo}-${index}`} className="photo">
              {displayUrls[index] ? (
                <img src={displayUrls[index]} alt={t("photos.alt", { index: index + 1 })} />
              ) : (
                <div className="photo-placeholder" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={() => onDelete(index)}
                aria-label={t("photos.deleteAria")}
              >
                ×
              </button>
            </figure>
          ))
        )}
      </div>
    </section>
  );
}
