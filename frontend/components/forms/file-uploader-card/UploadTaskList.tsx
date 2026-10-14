"use client";

import { Check, RotateCcw } from "lucide-react";
import Image from "next/image";

import { Spinner } from "@/components/ui/spinner";

import {
  uploadTaskFileNameClassName,
  uploadTaskItemClassName,
  uploadTaskListClassName,
  uploadTaskRetryClassName,
  uploadTaskThumbClassName,
} from "./constants";
import type { UploadTask } from "./types";

interface UploadTaskListProps {
  tasks: UploadTask[];
  onRetry: (task: UploadTask) => void;
}

export function UploadTaskList({ tasks, onRetry }: UploadTaskListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul className={uploadTaskListClassName} aria-live="polite">
      {tasks.map((task) => (
        <li key={task.id} className={uploadTaskItemClassName}>
          {task.previewUrl ? (
            <Image
              src={task.previewUrl}
              alt=""
              width={28}
              height={28}
              unoptimized
              className={uploadTaskThumbClassName}
            />
          ) : null}
          <span className={uploadTaskFileNameClassName}>{task.fileName}</span>
          {task.status === "uploading" ? <Spinner className="h-4 w-4" /> : null}
          {task.status === "done" ? (
            <Check size={14} className="shrink-0 text-primary" />
          ) : null}
          {task.status === "error" ? (
            <button
              type="button"
              onClick={() => onRetry(task)}
              className={uploadTaskRetryClassName}
              aria-label={`Retry upload for ${task.fileName}`}
            >
              <RotateCcw size={13} />
              Retry
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
