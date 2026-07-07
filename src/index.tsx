/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import { logger } from '@/lib/logger'
import { setupGlobalErrorHandlers } from '@/lib/setupGlobalErrorHandlers'

setupGlobalErrorHandlers()
logger.info('Application starting')

const root = document.getElementById('root')

render(() => <App />, root!)
