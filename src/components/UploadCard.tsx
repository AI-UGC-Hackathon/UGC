import { useCallback, useRef, useState } from "react";
import type { ProductImage } from "../types";
import { Upload, Trash, Image as ImageIcon } from "./icons";

type Props = {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
};

const ACCEPT = "image/jpeg,image/png,image/webp";
const SLOTS = ["Front", "Back", "Left", "Right", "Top", "Packaging"];

function fileToProductImage(file: File): Promise<ProductImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: reader.result as string,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function UploadCard({ images, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) =>
        ACCEPT.split(",").includes(f.type),
      );
      const next = await Promise.all(arr.map(fileToProductImage));
      const merged = [...images, ...next].slice(0, 8);
      onChange(
        merged.map((img, i) => ({
          ...img,
          label: img.label ?? SLOTS[i] ?? `Image ${i + 1}`,
        })),
      );
    },
    [images, onChange],
  );

  const removeAt = (id: string) => onChange(images.filter((i) => i.id !== id));

  return (
    <div className="card p-7">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[20px] font-semibold tracking-tight">
          Product photos
        </h3>
        <span className="text-[12px] text-ink-500">
          {images.length} / 8
        </span>
      </div>
      <p className="text-[14px] text-ink-500 mb-5">
        Front, back, and a few angles work best. JPG, PNG or WEBP. Gemini reads
        these for the script, and the first image is sent to fal.ai as the
        first frame of your video.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 ${
          dragOver
            ? "border-accent bg-accent-soft"
            : "border-ink-100 bg-canvas hover:border-ink-300 hover:bg-white"
        } px-6 py-10 grid place-items-center text-center`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-full bg-white shadow-card grid place-items-center mb-3">
          <Upload className="w-5 h-5 text-ink-700" />
        </div>
        <div className="text-[16px] font-medium text-ink-900">
          Drop product images here
        </div>
        <div className="text-[13px] text-ink-500 mt-1">
          or click to browse — up to 8 photos
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-ink-900/5 border border-black/[0.04] animate-fadeUp"
            >
              <img
                src={img.dataUrl}
                alt={img.label ?? img.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span className="text-[11px] font-medium text-white">
                  {img.label ?? SLOTS[i] ?? `Image ${i + 1}`}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(img.id);
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-card"
                aria-label="Remove"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, i) => (
            <div
              key={`p-${i}`}
              className="aspect-square rounded-2xl border border-dashed border-ink-100 grid place-items-center text-ink-300"
            >
              <ImageIcon className="w-5 h-5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
