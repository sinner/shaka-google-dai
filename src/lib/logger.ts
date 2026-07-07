const PREFIX = '[GoogleDAI]'

type LogContext = Record<string, unknown>

function formatContext(context?: LogContext): LogContext | undefined {
  if (!context || Object.keys(context).length === 0) {
    return undefined
  }

  return context
}

export const logger = {
  debug(message: string, context?: LogContext) {
    const data = formatContext(context)
    if (data) {
      console.log(PREFIX, '[debug]', message, data)
      return
    }

    console.log(PREFIX, '[debug]', message)
  },

  info(message: string, context?: LogContext) {
    const data = formatContext(context)
    if (data) {
      console.log(PREFIX, '[info]', message, data)
      return
    }

    console.log(PREFIX, '[info]', message)
  },

  event(message: string, context?: LogContext) {
    const data = formatContext(context)
    if (data) {
      console.log(PREFIX, '[event]', message, data)
      return
    }

    console.log(PREFIX, '[event]', message)
  },

  warn(message: string, context?: LogContext) {
    const data = formatContext(context)
    if (data) {
      console.warn(PREFIX, '[warn]', message, data)
      return
    }

    console.warn(PREFIX, '[warn]', message)
  },

  error(message: string, context?: LogContext) {
    const data = formatContext(context)
    if (data) {
      console.error(PREFIX, '[error]', message, data)
      return
    }

    console.error(PREFIX, '[error]', message)
  },
}
