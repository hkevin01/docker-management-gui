import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './apiClient'

// System hooks
export const useSystemInfo = () => {
  return useQuery({
    queryKey: ['system', 'info'],
    queryFn: () => apiClient.getSystemInfo(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useSystemDf = () => {
  return useQuery({
    queryKey: ['system', 'df'],
    queryFn: () => apiClient.getSystemDf(),
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Container hooks
export const useContainers = (params?: {
  all?: boolean
  limit?: number
  size?: boolean
  filters?: Record<string, string[]>
}) => {
  return useQuery({
    queryKey: ['containers', params],
    queryFn: () => apiClient.getContainers(params),
    staleTime: 1000 * 10, // 10 seconds
  })
}

export const useContainer = (id: string) => {
  return useQuery({
    queryKey: ['containers', id],
    queryFn: () => apiClient.getContainer(id),
    enabled: !!id,
  })
}

export const useStartContainer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.startContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const useStopContainer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, t }: { id: string; t?: number }) => 
      apiClient.stopContainer(id, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const useRestartContainer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, t }: { id: string; t?: number }) => 
      apiClient.restartContainer(id, t),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const useKillContainer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, signal }: { id: string; signal?: string }) => 
      apiClient.killContainer(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const useRemoveContainer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      options 
    }: { 
      id: string
      options?: { force?: boolean; v?: boolean; link?: boolean }
    }) => apiClient.removeContainer(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const usePruneContainers = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (filters?: Record<string, string[]>) => 
      apiClient.pruneContainers(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

// Image hooks
export const useImages = (params?: {
  all?: boolean
  filters?: Record<string, string[]>
  digests?: boolean
}) => {
  return useQuery({
    queryKey: ['images', params],
    queryFn: () => apiClient.getImages(params),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export const useImage = (id: string) => {
  return useQuery({
    queryKey: ['images', id],
    queryFn: () => apiClient.getImage(id),
    enabled: !!id,
  })
}

export const useRemoveImage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      options 
    }: { 
      id: string
      options?: { force?: boolean; noprune?: boolean }
    }) => apiClient.removeImage(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

export const usePruneImages = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (filters?: Record<string, string[]>) => 
      apiClient.pruneImages(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

// Volume hooks
export const useVolumes = (filters?: Record<string, string[]>) => {
  return useQuery({
    queryKey: ['volumes', filters],
    queryFn: () => apiClient.getVolumes(filters),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export const useVolume = (name: string) => {
  return useQuery({
    queryKey: ['volumes', name],
    queryFn: () => apiClient.getVolume(name),
    enabled: !!name,
  })
}

export const useCreateVolume = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (options: {
      Name?: string
      Driver?: string
      DriverOpts?: Record<string, string>
      Labels?: Record<string, string>
    }) => apiClient.createVolume(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volumes'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

export const useRemoveVolume = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ name, force }: { name: string; force?: boolean }) => 
      apiClient.removeVolume(name, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volumes'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

export const usePruneVolumes = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (filters?: Record<string, string[]>) => 
      apiClient.pruneVolumes(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volumes'] })
      queryClient.invalidateQueries({ queryKey: ['system'] })
    },
  })
}

// Network hooks
export const useNetworks = (filters?: Record<string, string[]>) => {
  return useQuery({
    queryKey: ['networks', filters],
    queryFn: () => apiClient.getNetworks(filters),
    staleTime: 1000 * 30, // 30 seconds
  })
}

export const useNetwork = (id: string) => {
  return useQuery({
    queryKey: ['networks', id],
    queryFn: () => apiClient.getNetwork(id),
    enabled: !!id,
  })
}

export const useCreateNetwork = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (options: {
      Name: string
      Driver?: string
      IPAM?: any
      Options?: Record<string, string>
      Labels?: Record<string, string>
    }) => apiClient.createNetwork(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] })
    },
  })
}

export const useRemoveNetwork = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.removeNetwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] })
    },
  })
}

export const useConnectNetwork = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      options 
    }: { 
      id: string
      options: { Container: string; EndpointConfig?: any }
    }) => apiClient.connectNetwork(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] })
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const useDisconnectNetwork = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      options 
    }: { 
      id: string
      options: { Container: string; Force?: boolean }
    }) => apiClient.disconnectNetwork(id, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] })
      queryClient.invalidateQueries({ queryKey: ['containers'] })
    },
  })
}

export const usePruneNetworks = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (filters?: Record<string, string[]>) => 
      apiClient.pruneNetworks(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] })
    },
  })
}
