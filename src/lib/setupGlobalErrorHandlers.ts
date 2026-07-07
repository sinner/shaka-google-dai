import { logger } from '@/lib/logger'

export function setupGlobalErrorHandlers() {
  window.addEventListener('error', (event) => {
    logger.error('Unhandled window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
    })
  })

  logger.info('Global error handlers registered')
}
