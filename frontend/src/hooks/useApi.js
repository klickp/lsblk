import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi, menuApi, healthApi } from '../services/api'

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => healthApi.check(),
    retry: 3,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Orders hooks
export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.getOrders(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getOrder(id),
    enabled: !!id,
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => orderApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => orderApi.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export const useDeleteOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => orderApi.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// Menu hooks
export const useMenu = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: () => menuApi.getMenu(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export const useMenuItem = (id) => {
  return useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.getMenuItem(id),
    enabled: !!id,
  })
}
