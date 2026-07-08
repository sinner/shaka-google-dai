import shaka from 'shaka-player'
import { logger } from '@/lib/logger'

const LICENSE_CONTENT_TYPE = 'application/octet-stream'
const playersWithLicenseFilter = new WeakSet<shaka.Player>()

function isDituLicenseProxy(uri: string): boolean {
  return uri.includes('/CONTENT/LICENSE')
}

function registerLicenseRequestFilter(player: shaka.Player): void {
  if (playersWithLicenseFilter.has(player)) {
    return
  }

  const networkingEngine = player.getNetworkingEngine()
  if (!networkingEngine) {
    return
  }

  // Matches caracol-samsung player license filter for Ditu AGL middleware.
  networkingEngine.registerRequestFilter((type, request) => {
    if (type !== shaka.net.NetworkingEngine.RequestType.LICENSE) {
      return
    }

    const isLocalLicenseRequest = (request.uris || []).some(isDituLicenseProxy)

    if (!isLocalLicenseRequest) {
      const drmServers = player.getConfiguration().drm.servers
      const localLicenseUrl =
        drmServers['com.widevine.alpha'] || drmServers['com.microsoft.playready']

      if (localLicenseUrl) {
        request.uris = [localLicenseUrl]
      }
    }

    const isRoutedToProxy = (request.uris || []).some(isDituLicenseProxy)
    if (!isRoutedToProxy) {
      return
    }

    request.allowCrossSiteCredentials = true
    request.headers['Content-Type'] =
      request.headers['Content-Type'] || LICENSE_CONTENT_TYPE
    request.contentType = request.headers['Content-Type']
    request.headers['restful'] = request.headers['restful'] || 'yes'

    logger.debug('License request headers applied', {
      uri: request.uris[0],
      contentType: request.headers['Content-Type'],
      restful: request.headers['restful'],
      allowCrossSiteCredentials: request.allowCrossSiteCredentials,
    })
  })

  playersWithLicenseFilter.add(player)
}

/**
 * Ditu middleware sets `playback_token` / `sessionId` cookies on VIDEOURL.
 * LICENSE requests must include those cookies or Axinom auth fails with HTTP 500.
 */
export async function primeDrmCookies(
  cookieResolverUrl?: string,
): Promise<void> {
  const url = cookieResolverUrl?.trim()
  if (!url) {
    return
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        restful: 'yes',
      },
    })

    logger.info('DRM cookie resolver completed', {
      url,
      status: response.status,
      ok: response.ok,
    })
  } catch (error) {
    logger.warn('DRM cookie resolver failed', { url, error })
  }
}

export function applyDrmConfig(
  player: shaka.Player,
  drmLicenseUrl?: string,
): void {
  const licenseUrl = drmLicenseUrl?.trim()

  if (!licenseUrl) {
    player.configure({
      drm: {
        servers: {},
      },
      manifest: {
        dash: {
          ignoreDrmInfo: false,
        },
      },
    })
    return
  }

  // Same middleware URL for Widevine + PlayReady as in caracol-samsung.
  // ignoreDrmInfo forces Shaka to use our proxy URL instead of LA_URL in PSSH.
  player.configure({
    drm: {
      servers: {
        'com.widevine.alpha': licenseUrl,
        'com.microsoft.playready': licenseUrl,
      },
    },
    manifest: {
      dash: {
        ignoreDrmInfo: true,
      },
    },
  })

  registerLicenseRequestFilter(player)
  logger.info('DRM license server configured', { licenseUrl })
}

export function initShakaPlayer(video: HTMLVideoElement): shaka.Player {
  shaka.polyfill.installAll()
  const player = new shaka.Player(video)
  registerLicenseRequestFilter(player)
  return player
}
