// Default to relative /api so it works behind a reverse proxy (nginx) in production
// and via Vite proxy in development. Override with VITE_API_URL when needed.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Health
  async getHealth() {
    return this.request('/health')
  }

  // System
  async getSystemInfo() {
    return this.request('/system/info')
  }

  async getSystemDf() {
    return this.request('/system/df')
  }

  async pruneSystem(filters?: Record<string, string[]>) {
    return this.request('/system/prune', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    })
  }

  // Containers
  async getContainers(params?: {
    all?: boolean
    limit?: number
    size?: boolean
    filters?: Record<string, string[]>
  }) {
    const searchParams = new URLSearchParams()
    if (params?.all) searchParams.set('all', 'true')
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.size) searchParams.set('size', 'true')
    if (params?.filters) searchParams.set('filters', JSON.stringify(params.filters))
    
    const query = searchParams.toString()
    return this.request(`/containers${query ? `?${query}` : ''}`)
  }

  async getContainer(id: string) {
    return this.request(`/containers/${id}`)
  }

  async startContainer(id: string) {
    return this.request(`/containers/${id}/start`, { method: 'POST' })
  }

  async stopContainer(id: string, t?: number) {
    return this.request(`/containers/${id}/stop`, {
      method: 'POST',
      body: JSON.stringify({ t }),
    })
  }

  async restartContainer(id: string, t?: number) {
    return this.request(`/containers/${id}/restart`, {
      method: 'POST',
      body: JSON.stringify({ t }),
    })
  }

  async killContainer(id: string, signal = 'SIGKILL') {
    return this.request(`/containers/${id}/kill`, {
      method: 'POST',
      body: JSON.stringify({ signal }),
    })
  }

  async removeContainer(id: string, options?: { force?: boolean; v?: boolean; link?: boolean }) {
    const searchParams = new URLSearchParams()
    if (options?.force) searchParams.set('force', 'true')
    if (options?.v) searchParams.set('v', 'true')
    if (options?.link) searchParams.set('link', 'true')
    
    const query = searchParams.toString()
    return this.request(`/containers/${id}${query ? `?${query}` : ''}`, {
      method: 'DELETE',
    })
  }

  async pruneContainers(filters?: Record<string, string[]>) {
    return this.request('/containers/prune', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    })
  }

  // Images
  async getImages(params?: {
    all?: boolean
    filters?: Record<string, string[]>
    digests?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.all) searchParams.set('all', 'true')
    if (params?.digests) searchParams.set('digests', 'true')
    if (params?.filters) searchParams.set('filters', JSON.stringify(params.filters))
    
    const query = searchParams.toString()
    return this.request(`/images${query ? `?${query}` : ''}`)
  }

  async getImage(id: string) {
    return this.request(`/images/${id}`)
  }

  async removeImage(id: string, options?: { force?: boolean; noprune?: boolean }) {
    const searchParams = new URLSearchParams()
    if (options?.force) searchParams.set('force', 'true')
    if (options?.noprune) searchParams.set('noprune', 'true')
    
    const query = searchParams.toString()
    return this.request(`/images/${id}${query ? `?${query}` : ''}`, {
      method: 'DELETE',
    })
  }

  async pruneImages(filters?: Record<string, string[]>) {
    return this.request('/images/prune', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    })
  }

  // Volumes
  async getVolumes(filters?: Record<string, string[]>) {
    const searchParams = new URLSearchParams()
    if (filters) searchParams.set('filters', JSON.stringify(filters))
    
    const query = searchParams.toString()
    return this.request(`/volumes${query ? `?${query}` : ''}`)
  }

  async getVolume(name: string) {
    return this.request(`/volumes/${name}`)
  }

  async createVolume(options: {
    Name?: string
    Driver?: string
    DriverOpts?: Record<string, string>
    Labels?: Record<string, string>
  }) {
    return this.request('/volumes', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  async removeVolume(name: string, force = false) {
    const searchParams = new URLSearchParams()
    if (force) searchParams.set('force', 'true')
    
    const query = searchParams.toString()
    return this.request(`/volumes/${name}${query ? `?${query}` : ''}`, {
      method: 'DELETE',
    })
  }

  async pruneVolumes(filters?: Record<string, string[]>) {
    return this.request('/volumes/prune', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    })
  }

  // Networks
  async getNetworks(filters?: Record<string, string[]>) {
    const searchParams = new URLSearchParams()
    if (filters) searchParams.set('filters', JSON.stringify(filters))
    
    const query = searchParams.toString()
    return this.request(`/networks${query ? `?${query}` : ''}`)
  }

  async getNetwork(id: string) {
    return this.request(`/networks/${id}`)
  }

  async createNetwork(options: {
    Name: string
    Driver?: string
    IPAM?: any
    Options?: Record<string, string>
    Labels?: Record<string, string>
  }) {
    return this.request('/networks', {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  async removeNetwork(id: string) {
    return this.request(`/networks/${id}`, {
      method: 'DELETE',
    })
  }

  async connectNetwork(id: string, options: { Container: string; EndpointConfig?: any }) {
    return this.request(`/networks/${id}/connect`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  async disconnectNetwork(id: string, options: { Container: string; Force?: boolean }) {
    return this.request(`/networks/${id}/disconnect`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  }

  async pruneNetworks(filters?: Record<string, string[]>) {
    return this.request('/networks/prune', {
      method: 'POST',
      body: JSON.stringify({ filters }),
    })
  }

  // WebSocket connections for streaming data
  createLogsWebSocket(containerId: string, options?: {
    follow?: boolean
    stdout?: boolean
    stderr?: boolean
    since?: number
    until?: number
    timestamps?: boolean
    tail?: string
  }) {
    const searchParams = new URLSearchParams()
    if (options?.follow) searchParams.set('follow', 'true')
    if (options?.stdout !== undefined) searchParams.set('stdout', options.stdout.toString())
    if (options?.stderr !== undefined) searchParams.set('stderr', options.stderr.toString())
    if (options?.since) searchParams.set('since', options.since.toString())
    if (options?.until) searchParams.set('until', options.until.toString())
    if (options?.timestamps) searchParams.set('timestamps', 'true')
    if (options?.tail) searchParams.set('tail', options.tail)
    
  const query = searchParams.toString()
  const originWs = window.location.origin.replace(/^http/, 'ws')
  const basePath = this.baseURL.startsWith('http') ? new URL(this.baseURL).pathname : this.baseURL
  return new WebSocket(`${originWs}${basePath}/containers/${containerId}/logs${query ? `?${query}` : ''}`)
  }

  createStatsWebSocket(containerId: string, stream = false) {
    const searchParams = new URLSearchParams()
    if (stream) searchParams.set('stream', 'true')
    
  const query = searchParams.toString()
  const originWs = window.location.origin.replace(/^http/, 'ws')
  const basePath = this.baseURL.startsWith('http') ? new URL(this.baseURL).pathname : this.baseURL
  return new WebSocket(`${originWs}${basePath}/containers/${containerId}/stats${query ? `?${query}` : ''}`)
  }

  createEventsWebSocket(options?: {
    since?: string
    until?: string
    filters?: Record<string, string[]>
  }) {
    const searchParams = new URLSearchParams()
    if (options?.since) searchParams.set('since', options.since)
    if (options?.until) searchParams.set('until', options.until)
    if (options?.filters) searchParams.set('filters', JSON.stringify(options.filters))
    
  const query = searchParams.toString()
  const originWs = window.location.origin.replace(/^http/, 'ws')
  const basePath = this.baseURL.startsWith('http') ? new URL(this.baseURL).pathname : this.baseURL
  return new WebSocket(`${originWs}${basePath}/system/events${query ? `?${query}` : ''}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient
