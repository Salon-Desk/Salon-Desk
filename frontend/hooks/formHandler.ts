// /hooks/formHandler.ts
import { toast } from "sonner";

import { toastColor } from "@/constant/toast-color";
import type { ApiResponse } from "@/types/api";

// Type guard to check if the data is of type ApiFunctionWithMethod input
const isApiFunctionWithMethodData = <T>(
  data: T | { body: T; method: "POST" | "PUT" | "DELETE" | "PATCH" },
): data is { body: T; method: "POST" | "PUT" | "DELETE" | "PATCH" } => {
  return typeof data === "object" && data !== null && "method" in data;
};

/** Function types for API calls */
type ApiFunction<T, R = unknown, E = unknown> = (
  data: T,
) => Promise<ApiResponse<R, E>>;
type ApiFunctionWithMethod<T, R = unknown, E = unknown> = (data: {
  body: T;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
}) => Promise<ApiResponse<R, E>>;

const useFormSubmitHandler = <T, R = unknown, E = unknown>(
  apiFunction: ApiFunction<T, R, E> | ApiFunctionWithMethod<T, R, E>,
  onSuccess: (response: ApiResponse<R, E>) => void,
  successMessage?: string,
  isSuccessToastVisible: boolean = true,
  onError?: (error: E) => void,
) => {
  const handleSubmit = async (
    data: T | { body: T; method: "POST" | "PUT" | "DELETE" | "PATCH" },
  ): Promise<ApiResponse<R, E>> => {
    try {
      let response: ApiResponse<R, E>;

      // Handle API method overload
      if (isApiFunctionWithMethodData(data)) {
        response = await (apiFunction as ApiFunctionWithMethod<T, R, E>)(
          data as { body: T; method: "POST" | "PUT" | "DELETE" | "PATCH" },
        );
      } else {
        response = await (apiFunction as ApiFunction<T, R, E>)(data);
      }

      if (response.error) {
        if (onError) {
          onError(response.error);
        }

        const errorMessage = getErrorMessage(response.error);

        // Special case
        if (errorMessage.toLowerCase().includes("deactivated")) {
          return response;
        }

        toast.error(errorMessage, toastColor.error);
      } else {
        if (isSuccessToastVisible) {
          const successMsg =
            (
              response.data as {
                data?: { message?: string };
                message?: string;
              }
            )?.data?.message ||
            (response.data as { message?: string })?.message ||
            successMessage ||
            "Action completed successfully";

          toast.success(successMsg, toastColor.success);
        }
        onSuccess(response);
      }

      return response;
    } catch (error: unknown) {
      let errorMessage = "Something went wrong";

      if (typeof error === "object" && error !== null) {
        const err = error as {
          data?: {
            data?: {
              errors?: Record<string, unknown>;
              message?: string;
              error?: string;
            };
            message?: string;
            error?: string | undefined;
          };
          message?: string;
          error?: string | undefined;
        };

        // ✅ 1. Handle validation errors (like your case)
        const validationErrors = err?.data?.data?.errors;

        if (validationErrors && typeof validationErrors === "object") {
          // Normalize field names by replacing dots and underscores with spaces
          const normalizedErrors: Record<string, unknown> = {};
          for (const [field, messages] of Object.entries(validationErrors)) {
            const normalizedField = field.replace(/[._]/g, " ");
            // Ensure messages is always an array
            const messagesArray = Array.isArray(messages)
              ? messages
              : [messages];
            normalizedErrors[normalizedField] = messagesArray;
          }
          errorMessage = Object.values(normalizedErrors)
            .flat()
            .filter((msg): msg is string => typeof msg === "string")
            .join("\n"); // or ', ' if you prefer inline
        } else {
          // ✅ 2. fallback to normal message extraction
          errorMessage =
            err?.data?.message ||
            err?.data?.data?.message ||
            err?.data?.error ||
            err?.error ||
            "Something went wrong";
        }
      }

      if (onError) {
        onError(error as E);
      }

      toast.error(errorMessage, toastColor.error);

      return { error: error as E } as ApiResponse<R, E>;
    }
  };

  return handleSubmit;
};

export default useFormSubmitHandler;

const getErrorMessage = (error: unknown): string => {
  const err = error as {
    data?: {
      message?: string;
      data?: {
        errors?: Record<string, string[]>;
        error_messages?: string[];
        error?: string;
      };
    };
  };

  const data = err?.data?.data;

  if (data) {
    if (Array.isArray(data.error_messages) && data.error_messages.length) {
      return data.error_messages.join("\n");
    }

    if (data.errors) {
      // Normalize field names by replacing dots and underscores with spaces
      const normalizedErrors: Record<string, string[]> = {};
      for (const [field, messages] of Object.entries(data.errors)) {
        const normalizedField = field.replace(/[._]/g, " ");
        // Ensure messages is always an array of strings
        const messagesArray = Array.isArray(messages)
          ? messages
          : [String(messages)];
        normalizedErrors[normalizedField] = messagesArray;
      }
      return Object.values(normalizedErrors).flat().join("\n");
    }

    return data.error || err?.data?.message || "Something went wrong";
  }

  return err?.data?.message || "Something went wrong";
};
