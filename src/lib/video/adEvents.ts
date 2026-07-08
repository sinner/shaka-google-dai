import shaka from 'shaka-player'

export const TRACKED_AD_EVENTS = [
  shaka.ads.Utils.AD_PROGRESS,
  shaka.ads.Utils.AD_IMPRESSION,
  shaka.ads.Utils.AD_LOADED,
  shaka.ads.Utils.ALL_ADS_COMPLETED,
  shaka.ads.Utils.AD_ERROR,
  shaka.ads.Utils.AD_BREAK_READY,
  shaka.ads.Utils.AD_INTERACTION,
  shaka.ads.Utils.AD_STARTED,
  shaka.ads.Utils.AD_FIRST_QUARTILE,
  shaka.ads.Utils.AD_MIDPOINT,
  shaka.ads.Utils.AD_THIRD_QUARTILE,
  shaka.ads.Utils.AD_COMPLETE,
] as const

export type TrackedAdEvent = (typeof TRACKED_AD_EVENTS)[number]
