import parsePhoneNumberFromString from "libphonenumber-js";
import { z } from "zod";

import { validationMessages as m } from "@/constant/validation-messages";
import { MEDIA_UUID_REGEX } from "@/lib/media";

const NAME_REGEX = /^[A-Za-z]+$/;

export const validateUSPhone = (value: string) => {
  const cleaned = value.replace(/[\s-.]/g, "");

  // Must be numeric + optional +1
  if (!/^(\+?1)?\d{10}$/.test(cleaned)) {
    return "Phone number must contain 10 digits (with optional +1).";
  }

  // Remove +1 if present
  const digits = cleaned.startsWith("+1")
    ? cleaned.slice(2)
    : cleaned.startsWith("1")
      ? cleaned.slice(1)
      : cleaned;

  const area = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);

  if (/^[01]/.test(area)) {
    return "Area code cannot start with 0 or 1.";
  }

  if (/^[01]/.test(exchange)) {
    return "Exchange code cannot start with 0 or 1.";
  }

  return true; // Valid
};

export const usePhoneValidation = (isRequired = true) => {
  return (value: string) => {
    if (!value) {
      return isRequired ? m.required : true;
    }
    const phoneNumber = parsePhoneNumberFromString(`+${value}`);
    return phoneNumber
      ? phoneNumber.isValid()
      : isRequired
        ? m.invalidPhone
        : true;
  };
};

const validationMessages = {
  required: "This field is required",
  invalidEmail: "Please enter a valid email address",
  invalidPhone: "Please enter a valid phone number",
  passwordTooShort: (min: number) =>
    `Password must be at least ${min} characters`,
};

/** Matches digit-only international numbers from intl-tel-input (same as login). */
export const INTERNATIONAL_PHONE_REGEX = /^[1-9]\d{7,14}$/;

export const normalizePhoneDigits = (value?: string | null) =>
  (value ?? "").replace(/\D/g, "");

export const refineInternationalPhone = (
  value: string | null | undefined,
  ctx: z.RefinementCtx,
  path: (string | number)[],
  isRequired: boolean,
) => {
  const normalizedPhone = normalizePhoneDigits(value);
  if (!normalizedPhone) {
    if (isRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required",
        path,
      });
    }
    return;
  }
  if (!INTERNATIONAL_PHONE_REGEX.test(normalizedPhone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid international phone number",
      path,
    });
  }
};

export const internationalPhoneField = (isRequired = true) =>
  z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      refineInternationalPhone(value, ctx, [], isRequired);
    });

// Helper to apply optional schema. RHF often uses "" for empty inputs; Zod's .optional()
// only allows undefined, so we normalize empty / whitespace strings to undefined.
const optional = <T extends z.ZodTypeAny>(schema: T, isRequired: boolean) =>
  isRequired
    ? schema
    : z.preprocess((val) => {
        if (val === null || val === undefined) {
          return undefined;
        }
        if (typeof val === "string" && val.trim() === "") {
          return undefined;
        }
        return val;
      }, schema.optional());

// Reusable field validators
export const fieldValidators = {
  string: (isRequired = true, message?: string) =>
    optional(
      z
        .string()
        .trim()
        .min(1, message ?? m.required),
      isRequired,
    ),
  uuid: (isRequired = true) => optional(z.string().uuid(), isRequired),
  // CUSTOMER FIELDS
  customerType: (isRequired = true) =>
    optional(
      z.enum(["individual", "company"], {
        message: m.requiredCustomerType,
      }),
      isRequired,
    ),
  customerName: (isRequired = true, min = 2) =>
    optional(z.string().trim().min(min, m.requiredCustomerName), isRequired),
  location: (isRequired = true, min = 3) =>
    optional(
      z.string().trim().min(min, m.requiredCustomerLocation),
      isRequired,
    ),
  notes: (isRequired = false) => optional(z.string().trim(), isRequired),
  // AUTH FIELDS
  email: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .min(1, m.requiredEmail)
        .email(m.invalidEmail)
        .max(255, m.maxEmail),
      isRequired,
    ),

  username: (isRequired = true) =>
    optional(
      z.string().trim().min(2, m.minLength(2)).max(50, m.maxLength(50)),
      isRequired,
    ),

  password: (min = 8, isRequired = true, validateComplexity = false) => {
    const baseSchema = z.string().trim().min(min, m.minPassword);
    const schema = validateComplexity
      ? baseSchema.refine(
          (s) =>
            /[A-Z]/.test(s) &&
            /[a-z]/.test(s) &&
            /\d/.test(s) &&
            /[^A-Za-z0-9]/.test(s),
          {
            message: m.weakPassword,
          },
        )
      : baseSchema;

    return optional(schema, isRequired);
  },

  otp: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .min(6, m.minLength(6))
        .max(6, m.maxLength(6))
        .regex(/^\d+$/, m.invalidOtp),
      isRequired,
    ),

  // USER DETAILS
  date: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
          message: "Date must be in YYYY-MM-DD format",
        })
        .refine((v) => !Number.isNaN(new Date(v).getTime()), {
          message: "Invalid date",
        }),
      isRequired,
    ),

  firstName: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .min(2, m.minLength(2))
        .max(50, m.maxLength(50))
        .regex(NAME_REGEX, "First name can only contain letters"),
      isRequired,
    ),

  middleName: (isRequired = false) =>
    optional(
      z
        .string()
        .trim()
        .min(1, m.minLength(1))
        .max(50, m.maxLength(50))
        .regex(NAME_REGEX, "Middle name can only contain letters"),
      isRequired,
    ),

  lastName: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .min(2, m.minLength(2))
        .max(50, m.maxLength(50))
        .regex(NAME_REGEX, "Last name can only contain letters"),
      isRequired,
    ),

  /**
   * Phone validator - validates format using regex
   * Supports:
   * - International format: +1 234 567 8900
   * - US format: (234) 567-8900 or 234-567-8900
   * - Ethiopia format: 9XX XXX XXXX
   * @param isRequired - Whether the field is required
   */
  phone: (isRequired = true) => {
    const phoneRegex =
      /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$|^(\+251|0)?9\d{8}$/;

    if (isRequired) {
      return z
        .string()
        .trim()
        .min(1, validationMessages.required)
        .regex(phoneRegex, validationMessages.invalidPhone);
    }

    return z
      .string()
      .trim()
      .regex(phoneRegex, validationMessages.invalidPhone)
      .optional();
  },

  gender: (isRequired = false) =>
    optional(
      z.enum(["Male", "Female", "Other", "Prefer not to say"]),
      isRequired,
    ),

  dateOfBirth: (isRequired = false, minAge = 18) => {
    const validateAge = (value: string) => {
      const birthday = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      const dayDiff = today.getDate() - birthday.getDate();
      // Adjust if birthday hasn't occurred yet this year
      const realAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return realAge >= minAge;
    };

    return isRequired
      ? z
          .string()
          .trim()
          .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), {
            message: "Date must be in YYYY-MM-DD format",
          })
          .refine((v) => !Number.isNaN(new Date(v).getTime()), {
            message: "Invalid date",
          })
          .refine(validateAge, {
            message: `Must be at least ${minAge} years old`,
          })
      : z
          .string()
          .trim()
          .optional()
          .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
            message: "Date must be in YYYY-MM-DD format",
          })
          .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), {
            message: "Invalid date",
          })
          .refine((v) => !v || validateAge(v), {
            message: `Must be at least ${minAge} years old`,
          });
  },

  // JOB
  employeeId: (isRequired = true) =>
    optional(z.string().trim().max(50, m.maxLength(50)), isRequired),

  employmentType: (isRequired = true) =>
    optional(
      z.enum(["Full-Time", "Part-Time", "Contract", "Internship"]),
      isRequired,
    ),

  status: (isRequired = true) =>
    optional(z.enum(["Active", "On Leave", "Terminated"]), isRequired),

  salary: (isRequired = false) =>
    optional(z.number().positive(m.invalidSalary), isRequired),

  // ADDRESS
  country: (isRequired = true) => optional(z.string().trim(), isRequired),
  city: (isRequired = true) => optional(z.string().trim(), isRequired),
  address: (isRequired = false) => optional(z.string().trim(), isRequired),

  postalCode: (isRequired = false) =>
    optional(
      z
        .string()
        .trim()
        .regex(/^\d{4,10}$/, m.invalidPostalCode),
      isRequired,
    ),

  // FILES
  resume: (isRequired = true) =>
    optional(
      z.instanceof(File).refine((f) => f.size > 0, m.requiredFile),
      isRequired,
    ),

  profileImage: (isRequired = false) =>
    optional(
      z
        .instanceof(File)
        .refine((file) => file.type.startsWith("image/"), m.invalidFileType),
      isRequired,
    ),

  // ARRAYS
  skills: (isRequired = false) =>
    optional(z.array(z.string().trim()).min(1, m.requiredSkills), isRequired),

  languages: (isRequired = false) =>
    optional(
      z.array(
        z.object({
          language: z.string().trim(),
          proficiency: z.enum(["Basic", "Intermediate", "Advanced", "Native"]),
        }),
      ),
      isRequired,
    ),

  // TAX SPECIFIC VALIDATORS
  ssn: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .regex(/^\d{9}$/, "SSN must be exactly 9 digits"),
      isRequired,
    ),

  zipCode: (isRequired = false) =>
    optional(
      z
        .string()
        .trim()
        .min(1, "Zip code is required")
        .regex(/^\d{4,5}$/, "Zip code must be 4 or 5 digits"),
      isRequired,
    ),

  taxId: (isRequired = true) =>
    optional(
      z
        .number()
        .min(1, "Tax ID is required")
        .int("Tax ID must be a whole number"),
      isRequired,
    ),

  income: (isRequired = true) =>
    optional(
      z
        .number()
        .min(0, "Income cannot be negative")
        .max(999999999, "Income amount is too large"),
      isRequired,
    ),

  occupation: (isRequired = true) =>
    optional(
      z
        .string()
        .trim()
        .min(2, "Occupation must be at least 2 characters")
        .max(100, "Occupation is too long"),
      isRequired,
    ),
};

export const MAX_UPLOAD_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

/** Form value for existing uploads: media UUID + preview URL. */
export const mediaRefSchema = z.object({
  id: z.string().regex(MEDIA_UUID_REGEX, "Invalid media ID"),
  link: z.string().min(1, "Media link is required"),
});

/** @deprecated Use mediaRefSchema */
export const attachmentSchema = mediaRefSchema;

// Schema for uploaded media - media refs, legacy UUID strings, and new File uploads
export const uploadedMediaSchema = z.union([
  z.string().regex(MEDIA_UUID_REGEX, "Invalid media ID"),
  mediaRefSchema,
  z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `File size must be less than ${MAX_UPLOAD_FILE_SIZE_MB}MB`,
    }),
]);

export const fileSchema = z
  .instanceof(File, { message: "File is required" })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File size must be less than ${MAX_UPLOAD_FILE_SIZE_MB}MB`,
  });

export const priceFieldOptinal = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    return Number(value.replace(/,/g, "").trim());
  }
  return value;
}, z.number().min(0).optional());
export const priceField = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (cleaned === "") {
      return undefined;
    }
    return Number(cleaned);
  }

  return value;
}, z.number().min(0));

export const integerField = (
  min = 0,
  minMessage?: string,
  options?: { emptyAsZero?: boolean },
) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return options?.emptyAsZero ? 0 : undefined;
      }

      if (typeof value === "string") {
        const cleaned = value.replace(/,/g, "").trim();
        if (cleaned === "") {
          return options?.emptyAsZero ? 0 : undefined;
        }
        return Number(cleaned);
      }

      if (typeof value === "number" && Number.isNaN(value)) {
        return options?.emptyAsZero ? 0 : undefined;
      }

      return value;
    },
    z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "This field is required"
            : "Enter a valid number",
      })
      .int()
      .min(min, minMessage ?? `Must be at least ${min}`),
  );
