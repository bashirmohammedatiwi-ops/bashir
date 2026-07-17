export const IMAGE_VARIANTS = [
  { name: "thumb", width: 320 },
  { name: "small", width: 640 },
  { name: "medium", width: 1000 },
  { name: "large", width: 1600 },
] as const;

export type ImageVariantName = (typeof IMAGE_VARIANTS)[number]["name"];

export const OUTPUT_FORMATS = ["avif", "webp", "jpg"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export interface VariantSet {
  width: number;
  formats: Partial<Record<OutputFormat, string>>; // public url
}

export type VariantsRecord = Record<ImageVariantName, VariantSet>;
