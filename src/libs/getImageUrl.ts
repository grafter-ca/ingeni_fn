const FALLBACK_IMAGE_URL =
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=120&q=80";

export const getImageUrl = (
  image: string | { url?: string | null } | null | undefined
): string => {
  if (!image) return FALLBACK_IMAGE_URL;

  const rawUrl = typeof image === "string" ? image : image.url ?? "";
  const trimmed = rawUrl.trim();

  if (!trimmed) return FALLBACK_IMAGE_URL;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};