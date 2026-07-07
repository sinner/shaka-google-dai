import shaka from 'shaka-player'

export function applyDrmConfig(
  player: shaka.Player,
  drmLicenseUrl?: string,
): void {
  if (!drmLicenseUrl?.trim()) {
    return
  }

  player.configure({
    drm: {
      servers: {
        'com.widevine.alpha': drmLicenseUrl,
        'com.microsoft.playready': drmLicenseUrl,
        'com.apple.fps': drmLicenseUrl,
      },
    },
  })
}

export function initShakaPlayer(video: HTMLVideoElement): shaka.Player {
  shaka.polyfill.installAll()
  return new shaka.Player(video)
}
