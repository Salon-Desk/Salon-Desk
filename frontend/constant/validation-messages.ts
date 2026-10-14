// src/constants/validation-messages.ts
export const validationMessages = {
  // Generic
  required: "This field is required",
  invalid: "Invalid value",
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must not exceed ${max} characters`,
  minValue: (min: number) => `Value must be at least ${min}`,
  maxValue: (max: number) => `Value must not exceed ${max}`,
  pattern: "Invalid format",
  unique: "This value must be unique",

  // Name Fields
  requiredName: "Name is required",
  requiredFirstName: "First name is required",
  requiredLastName: "Last name is required",
  requiredMiddleName: "Middle name is required",
  invalidName: "Name can only contain letters, spaces, and periods",
  requiredPhone: "Phone number is required",
  invalidPhone: "Invalid phone number",
  // Customer Fields
  requiredCustomerName: "Name is required",
  requiredCustomerPhone: "Phone number is required",
  requiredCustomerLocation: "Delivery location is required",
  requiredCustomerType: "Customer type is required",
  // Authentication
  requiredUsername: "Username is required",
  requiredEmail: "Email is required",
  invalidEmail: "Invalid email address",
  maxEmail: "Email must be less than 255 characters",
  requiredPassword: "Password is required",
  minPassword: "Password must be at least 8 characters",
  weakPassword:
    "Password must include uppercase, lowercase, number, and special character",
  passwordRulesHint:
    "Use 8+ characters with at least 1 uppercase, 1 number, and 1 symbol.",
  passwordNotMatch: "Passwords do not match",

  // OTP
  requiredOtp: "OTP is required",
  invalidOtp: "OTP must contain only numbers",

  // Contact
  requiredMobile: "Mobile number is required",
  invalidMobile: "Invalid mobile number",
  invalidNumber: "Must be a valid number",

  // Dates
  requiredDate: "Date is required",
  invalidDate: "Invalid date",

  // Job / Work
  requiredJobTitle: "Job title is required",
  requiredEmployeeId: "Employee ID is required",
  requiredEmploymentType: "Employment type is required",
  requiredStatus: "Employment status is required",
  requiredDepartment: "Department is required",
  invalidSalary: "Invalid salary amount",

  // Address
  requiredCountry: "Country is required",
  requiredCity: "City is required",
  requiredAddress: "Address is required",
  invalidPostalCode: "Invalid postal code",

  // Files
  requiredFile: "File is required",
  invalidFileType: "Invalid file type",
  fileSizeLimit: "File size exceeds the allowed limit",

  // Skills, languages, qualifications
  requiredSkills: "At least one skill is required",
  requiredLanguages: "At least one language is required",
};
