import type { ReactNode } from "react";
import type { Accept } from "react-dropzone";

export type CardSize = "sm" | "md" | "lg";

export type UploadTaskStatus = "uploading" | "done" | "error";

export interface UploadTask {
  id: string;
  fileName: string;
  file: File;
  status: UploadTaskStatus;
  /** Object URL of the compressed file, shown while the request is still in flight. */
  previewUrl?: string;
}

export interface PreviewItem {
  src: string;
  /** Full-size URL used when a thumbnail conversion is not available yet. */
  fallbackSrc?: string;
}

export interface RHFFileUploaderCardProps {
  name: string;
  title: string;
  description?: string;
  boxTitle?: string;
  boxDescription?: string;
  size?: CardSize;
  borderVariant?: "primary" | "destructive";
  buttonText?: string;
  icon?: ReactNode;
  maxSizeMB?: number;
  multiple?: boolean;
  isRequired?: boolean;
  accept?: Accept;
  isOptionalVariant?: boolean;
  /** Optional sibling form field holding the storage URL (single upload, edit mode). */
  previewUrlField?: string;
  /** Optional sibling form field holding storage URLs (multiple upload, edit mode). */
  previewUrlsField?: string;
}

export type FileUploaderFieldItem =
  | string
  | File
  | { id: string; link: string };

export type FileUploaderFieldValue =
  | FileUploaderFieldItem
  | FileUploaderFieldItem[]
  | null
  | undefined;
