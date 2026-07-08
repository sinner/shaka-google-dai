import { Navigate, Route, Router } from '@solidjs/router'
import { AppLayout } from '@/components/layout'
import ChannelsPage from '@/pages/ChannelsPage'
import ManualAssetKeyPage from '@/pages/ManualAssetKeyPage'

// Vite BASE_URL includes a trailing slash; Router paths start with `/`.
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, '')

export function AppRoutes() {
  return (
    <Router root={AppLayout} base={routerBase}>
      <Route path="/" component={() => <Navigate href="/manual-asset-key" />} />
      <Route path="/manual-asset-key" component={ManualAssetKeyPage} />
      <Route path="/channels" component={ChannelsPage} />
    </Router>
  )
}
