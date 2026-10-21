'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'

export type ListingParamValue = string | number | boolean

type FieldSchema<V extends ListingParamValue> = {
  default: V
  urlKey?: string
  /** When set, this field is debounced for URL writes and for `params` (API). Only one debounced key per schema. */
  debounceMs?: number
  /**
   * When true and the value is `''`, that key is omitted from `params` (for API/query).
   * URL sync and `displayParams` still use the empty string.
   */
  omitEmptyForApi?: boolean
  /** When true and the value equals the field default, omit from `params`. */
  omitDefaultForApi?: boolean
  /** Omit from `params` when the value equals this sentinel (e.g. status `all`). */
  omitWhen?: ListingParamValue
  /** Rename this field in `params` for API calls (URL keys stay on `urlKey` / param name). */
  apiKey?: string
  /** When true, field syncs to the URL and `displayParams` but is omitted from `params` (UI-only). */
  urlOnly?: boolean
  parse?: (raw: string | null, defaultValue: V) => V
  serialize?: (value: V, defaultValue: V) => string | null
}

export type ListingParamSchema<T extends Record<string, ListingParamValue>> = {
  [K in keyof T]: FieldSchema<T[K]>
}

/**
 * Loose field shape for hook input. `never` in contravariant positions accepts
 * custom parse/serialize typed to a specific field value (avoids assignability failures).
 */
type ListingFieldSchemaInput = {
  default: ListingParamValue
  urlKey?: string
  debounceMs?: number
  omitEmptyForApi?: boolean
  omitDefaultForApi?: boolean
  omitWhen?: ListingParamValue
  apiKey?: string
  urlOnly?: boolean
  parse?: (raw: string | null, defaultValue: never) => ListingParamValue
  serialize?: (value: never, defaultValue: never) => string | null
}

const defaultParseString = (raw: string | null, defaultValue: string) =>
  raw === null || raw === '' || raw === 'undefined' || raw === 'null' ? defaultValue : raw

const defaultParsePage = (raw: string | null, defaultValue: number) => {
  if (raw === null || raw === '' || raw === 'undefined' || raw === 'null') {
    return defaultValue
  }
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 1 ? n : defaultValue
}

const defaultSerializeString = (value: string, defaultValue: string) =>
  value === defaultValue ? null : value

const defaultSerializePage = (value: number, defaultValue: number) =>
  value === defaultValue ? null : String(value)

const defaultParseBoolean = (raw: string | null, defaultValue: boolean) => {
  if (raw === null || raw === '' || raw === 'undefined' || raw === 'null') {
    return defaultValue
  }
  const lower = raw.toLowerCase()
  if (lower === 'true' || raw === '1') {
    return true
  }
  if (lower === 'false' || raw === '0') {
    return false
  }
  return defaultValue
}

const defaultSerializeBoolean = (value: boolean, defaultValue: boolean) =>
  value === defaultValue ? null : value ? 'true' : 'false'

function pickDefaultParse(defaultValue: ListingParamValue) {
  if (typeof defaultValue === 'number') {
    return defaultParsePage
  }
  if (typeof defaultValue === 'boolean') {
    return defaultParseBoolean
  }
  return defaultParseString
}

function pickDefaultSerialize(defaultValue: ListingParamValue) {
  if (typeof defaultValue === 'number') {
    return defaultSerializePage
  }
  if (typeof defaultValue === 'boolean') {
    return defaultSerializeBoolean
  }
  return defaultSerializeString
}

function parseFromSearchParams<T extends Record<string, ListingParamValue>>(
  sp: URLSearchParams,
  schema: ListingParamSchema<T>,
): T {
  const result = {} as T
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const field = schema[key]
    const urlKey = field.urlKey ?? String(key)
    const raw = sp.get(urlKey)
    const parseFn = (field.parse ?? pickDefaultParse(field.default)) as (
      r: string | null,
      d: ListingParamValue,
    ) => ListingParamValue
    result[key] = parseFn(raw, field.default) as T[typeof key]
  }
  return result
}

function serializeToSearchParams<T extends Record<string, ListingParamValue>>(
  values: T,
  schema: ListingParamSchema<T>,
): URLSearchParams {
  const out = new URLSearchParams()
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const field = schema[key]
    const urlKey = field.urlKey ?? String(key)
    const serializeFn = (field.serialize ?? pickDefaultSerialize(field.default)) as (
      v: ListingParamValue,
      d: ListingParamValue,
    ) => string | null
    const str = serializeFn(values[key], field.default)
    if (str !== null && str !== '') {
      out.set(urlKey, str)
    }
  }
  return out
}

function shallowEqual<T extends Record<string, ListingParamValue>>(a: T, b: T): boolean {
  return (Object.keys(a) as (keyof T)[]).every((k) => a[k] === b[k])
}

function mergeValuesForUrl<T extends Record<string, ListingParamValue>>(
  state: T,
  debouncedKey: keyof T | undefined,
  debouncedValue: ListingParamValue | undefined,
): T {
  if (debouncedKey === undefined) {
    return state
  }
  return { ...state, [debouncedKey]: debouncedValue }
}

type FieldApiOutputKey<
  K extends PropertyKey,
  S extends Record<PropertyKey, ListingFieldSchemaInput>,
> = K extends keyof S ? (S[K] extends { apiKey: infer A extends string } ? A : K) : K

type FieldOmitFromApi<
  K extends PropertyKey,
  T extends Record<string, ListingParamValue>,
  S extends Record<keyof T, ListingFieldSchemaInput>,
> = K extends keyof S
  ? S[K] extends { omitEmptyForApi: true }
    ? true
    : S[K] extends { omitDefaultForApi: true }
      ? true
      : S[K] extends { omitWhen: ListingParamValue }
        ? true
        : false
  : false

export type ListingApiParamsFromSchema<
  T extends Record<string, ListingParamValue>,
  S extends Record<keyof T, ListingFieldSchemaInput>,
> = {
  [K in keyof T as FieldApiOutputKey<K, S>]: FieldOmitFromApi<K, T, S> extends true
    ? T[K] | undefined
    : T[K]
}

/** Default UI/API field values from a module-level listing schema (single source of truth). */
export function listingDefaultsFromSchema<
  T extends Record<string, ListingParamValue>,
  S extends ListingParamSchema<T>,
>(schema: S): T {
  const out = {} as T
  for (const key of Object.keys(schema) as (keyof T)[]) {
    out[key] = schema[key].default as T[keyof T]
  }
  return out
}

/** Build API query args from a listing schema + optional overrides (same rules as hook `params`). */
export function listingApiParams(
  schema: Record<string, ListingFieldSchemaInput>,
  patch: Record<string, ListingParamValue> = {},
): Record<string, ListingParamValue> {
  const defaults: Record<string, ListingParamValue> = {}
  for (const key of Object.keys(schema)) {
    defaults[key] = schema[key].default
  }
  const merged = { ...defaults, ...patch }
  return buildListingApiParams(
    merged as Record<string, ListingParamValue>,
    schema as ListingParamSchema<Record<string, ListingParamValue>>,
  )
}

function buildListingApiParams<T extends Record<string, ListingParamValue>>(
  values: T,
  schema: ListingParamSchema<T>,
): ListingParamValue extends never ? never : Record<string, ListingParamValue> {
  const out: Record<string, ListingParamValue> = {}
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const field = schema[key]
    if (field.urlOnly) {
      continue
    }
    const value = values[key]
    if (field.omitEmptyForApi && value === '') {
      continue
    }
    if (field.omitWhen !== undefined && value === field.omitWhen) {
      continue
    }
    if (field.omitDefaultForApi && value === field.default) {
      continue
    }
    const outputKey = field.apiKey ?? String(key)
    out[outputKey] = value
  }
  return out
}

export type UseListingParamsResult<
  T extends Record<string, ListingParamValue>,
  S extends Record<keyof T, ListingFieldSchemaInput> = ListingParamSchema<T>,
> = {
  /** Values for API calls: debounced fields use settled values; others match URL/UI. */
  params: ListingApiParamsFromSchema<T, S>
  /** Full UI state (immediate); use for controlled inputs (e.g. search while typing). */
  displayParams: T
  setParam: <K extends keyof T>(key: K, value: T[K]) => void
  setParams: (patch: Partial<T>) => void
}

/**
 * Keeps listing filters in sync with URL query params (Next.js App Router).
 * Wrap the route segment in `<Suspense>` when using `useSearchParams`.
 *
 * - Pass a **stable** `schema` (e.g. module-level `const`) so effects do not re-subscribe every render.
 * - At most one field may use `debounceMs` (usually `search`); extras log a dev warning.
 * - Use `params` for data fetching; use `displayParams` for controlled inputs when that field is debounced.
 * - Use `omitEmptyForApi` on string fields (e.g. search) so empty string is not sent to APIs that reject `""`.
 * - Use `omitDefaultForApi` for sentinel defaults (e.g. status `all`) so they are omitted from `params`.
 * - Use `apiKey` to rename fields in `params` for backend query names (e.g. `search` → `q`, `limit` → `page_size`).
 */
export function useListingParams<
  T extends Record<string, ListingParamValue>,
  S extends ListingParamSchema<T>,
>(schema: S): UseListingParamsResult<T, S> {
  const typedSchema = schema as unknown as ListingParamSchema<T>

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const parse = useCallback(
    (sp: URLSearchParams) => parseFromSearchParams(sp, typedSchema),
    [typedSchema],
  )

  const [state, setState] = useState<T>(() => parse(new URLSearchParams(searchParamsString)))

  const schemaKeys = Object.keys(typedSchema) as (keyof T)[]
  const debouncedKeys = schemaKeys.filter((k) => (typedSchema[k].debounceMs ?? 0) > 0)

  if (process.env.NODE_ENV !== 'production' && debouncedKeys.length > 1) {
    // console.warn(
    //   '[useListingParams] Multiple debounced keys are not supported; using',
    //   String(debouncedKeys[0]),
    // )
  }

  const debouncedKey = debouncedKeys[0]
  const debounceMs = debouncedKey !== undefined ? (typedSchema[debouncedKey].debounceMs ?? 0) : 0

  const debouncedFieldValue = useDebounce(
    debouncedKey !== undefined ? state[debouncedKey] : '',
    debouncedKey !== undefined && debounceMs > 0 ? debounceMs : 0,
  )

  const urlValues = useMemo(
    () => mergeValuesForUrl(state, debouncedKey, debouncedFieldValue as T[keyof T]),
    [state, debouncedKey, debouncedFieldValue],
  )

  const params = useMemo((): ListingApiParamsFromSchema<T, S> => {
    const base =
      debouncedKey === undefined || debounceMs <= 0
        ? state
        : ({ ...state, [debouncedKey]: debouncedFieldValue } as T)
    return buildListingApiParams(base, typedSchema) as ListingApiParamsFromSchema<T, S>
  }, [state, debouncedKey, debouncedFieldValue, debounceMs, typedSchema])

  const lastReplacedQueryRef = useRef<string | null>(null)

  useEffect(() => {
    if (searchParamsString === lastReplacedQueryRef.current) {
      lastReplacedQueryRef.current = null
      return
    }
    const next = parse(new URLSearchParams(searchParamsString))
    setState((prev) => (shallowEqual(prev, next) ? prev : next))
  }, [searchParamsString, parse])

  useEffect(() => {
    const nextSp = serializeToSearchParams(urlValues, typedSchema)
    const schemaUrlKeys = new Set(
      (Object.keys(typedSchema) as (keyof T)[]).map(
        (key) => typedSchema[key].urlKey ?? String(key),
      ),
    )
    const currentSp = new URLSearchParams(searchParamsString)
    for (const [key, value] of currentSp.entries()) {
      if (!schemaUrlKeys.has(key)) {
        nextSp.set(key, value)
      }
    }
    const nextStr = nextSp.toString()
    if (nextStr === searchParamsString) {
      return
    }
    lastReplacedQueryRef.current = nextStr
    const qs = nextStr.length > 0 ? `?${nextStr}` : ''
    router.replace(`${pathname}${qs}`, { scroll: false })
  }, [urlValues, typedSchema, searchParamsString, pathname, router])

  const setParam = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setParams = useCallback((patch: Partial<T>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  return {
    params,
    displayParams: state,
    setParam,
    setParams,
  }
}
