import { useLocation, useNavigate } from '@solidjs/router'
import { createEffect } from 'solid-js'
import { normalizeAppPath } from '@/lib/routerBase'

/** Replaces history when the URL contains duplicate slashes (common with GH Pages + router base). */
export function PathNormalizer() {
  const location = useLocation()
  const navigate = useNavigate()

  createEffect(() => {
    const normalized = normalizeAppPath(location.pathname)
    if (normalized === location.pathname) return

    navigate(normalized + location.search + location.hash, {
      replace: true,
      resolve: false,
    })
  })

  return null
}
