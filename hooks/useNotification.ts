import { useCallback } from 'react'

import { createScopedLogger } from '@/lib/clientLogger'

const logger = createScopedLogger('[useNotification]')

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationOptions {
  duration?: number
}

/**
 * Simple notification hook that uses console logging as fallback
 * In a production app, this could be extended to use a toast library
 * like react-hot-toast, react-toastify, or sonner
 */
export function useNotification() {
  const notify = useCallback((
    message: string,
    type: NotificationType = 'info',
    options?: NotificationOptions
  ) => {
    // Log the notification
    switch (type) {
      case 'error':
        logger.error(message)
        break
      case 'warning':
        logger.warn(message)
        break
      case 'info':
      case 'success':
        logger.info(message)
        break
    }

    // Future: Could integrate with toast library here
    // Example: toast[type](message, { duration: options?.duration })
  }, [])

  return { notify }
}
