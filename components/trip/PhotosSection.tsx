"use client";

import { useLocale } from "@/contexts/LocaleContext";

type PhotosSectionProps = {
  photos: string[];
  onAdd: (dataUrls: string[]) => void;
  onDelete: (index: number) => void;
};

export function PhotosSection({ photos, onAdd, onDelete }: PhotosSectionProps) {
  const { t } = useLocale();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].slice(0, 12);
    if (!files.length) return;

    const reads = await Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    );

    onAdd(reads);
    event.target.value = "";
  };

  return (
    <section className="section photos-section" id="photos" aria-labelledby="photos-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">{t("photos.kicker")}</p>
          <h2 id="photos-title">{t("photos.title")}</h2>
        </div>
        <label className="upload-tile">
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
          <span>{t("photos.upload")}</span>
        </label>
      </div>
      <div className="photo-grid">
        {photos.length === 0 ? (
          <div className="empty-state">{t("photos.empty")}</div>
        ) : (
          photos.map((photo, index) => (
            <figure key={index} className="photo">
              <img src={photo} alt={t("photos.alt", { index: index + 1 })} />
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
