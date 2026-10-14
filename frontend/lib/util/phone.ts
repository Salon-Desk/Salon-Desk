import parsePhoneNumberFromString from "libphonenumber-js";

export function toPhoneFieldValue(value?: string | null): string {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  const parsed = parsePhoneNumberFromString(
    trimmed.startsWith("+") ? trimmed : `+${trimmed}`,
  );
  return parsed?.number ?? trimmed.replace(/\D/g, "");
}

export function phonesEqual(a?: string | null, b?: string | null): boolean {
  return toPhoneFieldValue(a) === toPhoneFieldValue(b);
}

export function isValidPhoneValue(
  value?: string | null,
  required = true,
): boolean {
  if (!value) {
    return !required;
  }
  const trimmed = value.trim();
  const parsed = parsePhoneNumberFromString(
    trimmed.startsWith("+") ? trimmed : `+${trimmed}`,
  );
  return parsed?.isValid() ?? false;
}
