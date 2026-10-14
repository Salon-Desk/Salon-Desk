export interface ApiResponse<Data = unknown, Error = unknown> {
  data?: Data
  error?: Error
}

export interface ShegaEngineInfo {
  service: string
  status: 'healthy' | string
  version: string
  portal_context: 'customer' | 'supplier' | 'admin' | string
  features: string[]
  region: string
  docs: string | string[]
}
