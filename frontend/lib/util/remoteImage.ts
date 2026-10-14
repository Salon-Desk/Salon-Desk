import { getPublicAbsoluteURL } from "@/lib/utils";

export function isRemoteImageSrc(src?: string | null): boolean {
  if (!src) {
    return false;
  }
  return /^(https?:|data:|blob:)/.test(src);
}

export function shouldUnoptimizeImage(src?: string | null): boolean {
  if (!src) {
    return false;
  }
  return src.startsWith("blob:") || src.startsWith("data:");
}

export function resolveImageSrc(src?: string | null, fallback = ""): string {
  const resolved = src?.trim() ? src : fallback;
  if (!resolved) {
    return "";
  }
  if (isRemoteImageSrc(resolved) || resolved.startsWith("/")) {
    return getPublicAbsoluteURL(resolved);
  }
  return getPublicAbsoluteURL(`/${resolved}`);
}
