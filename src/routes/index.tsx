import { Navigate, Route, Router } from '@solidjs/router'
import { AppLayout } from '@/components/layout'
import ChannelsPage from '@/pages/ChannelsPage'
import ManualAssetKeyPage from '@/pages/ManualAssetKeyPage'

export function AppRoutes() {
  return (
    <Router root={AppLayout}>
      <Route path="/" component={() => <Navigate href="/manual-asset-key" />} />
      <Route path="/manual-asset-key" component={ManualAssetKeyPage} />
      <Route path="/channels" component={ChannelsPage} />
    </Router>
  )
}
