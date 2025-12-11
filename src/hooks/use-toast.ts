"use client"

import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  closeButton?: boolean
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      closeButton: options?.closeButton,
      ...(options?.action && {
        action: {
          label: options.action.label,
          onClick: options.action.onClick,
        },
      }),
    })
  },
  
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 6000,
      description: options?.description,
      closeButton: options?.closeButton !== false,
      ...(options?.action && {
        action: {
          label: options.action.label,
          onClick: options.action.onClick,
        },
      }),
    })
  },
  
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 5000,
      description: options?.description,
      closeButton: options?.closeButton,
      ...(options?.action && {
        action: {
          label: options.action.label,
          onClick: options.action.onClick,
        },
      }),
    })
  },
  
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      description: options?.description,
      closeButton: options?.closeButton,
      ...(options?.action && {
        action: {
          label: options.action.label,
          onClick: options.action.onClick,
        },
      }),
    })
  },
  
  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      closeButton: options?.closeButton,
    })
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}

export const useToast = () => toast
