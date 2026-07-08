import { Navigate, Route, Router } from '@solidjs/router'
import { AppLayout } from '@/components/layout'
import { normalizeAppPath, normalizeRouterBase } from '@/lib/routerBase'
import ChannelsPage from '@/pages/ChannelsPage'
import ManualAssetKeyPage from '@/pages/ManualAssetKeyPage'

const routerBase = normalizeRouterBase(import.meta.env.BASE_URL)

export function AppRoutes() {
  return (
    <Router
      root={AppLayout}
      base={routerBase}
      transformUrl={normalizeAppPath}
    >
      <Route path="/" component={() => <Navigate href="/manual-asset-key" />} />
      <Route path="/manual-asset-key" component={ManualAssetKeyPage} />
      <Route path="/channels" component={ChannelsPage} />
    </Router>
  )
}
