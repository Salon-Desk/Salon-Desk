import type { FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/**
 * Native Zod v4 resolver adapter for React Hook Form.
 * Directly maps Zod v4 `issues` to RHF error records.
 */
export function zodResolver<TValues extends FieldValues = FieldValues>(
  schema: z.ZodTypeAny,
): Resolver<TValues> {
  return async (values) => {
    const result = await schema.safeParseAsync(values)
    if (result.success) {
      return {
        values: result.data as TValues,
        errors: {},
      }
    }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        }
      }
    }

    return {
      values: {} as TValues,
      errors: errors as never,
    }
  }
}

export default zodResolver
