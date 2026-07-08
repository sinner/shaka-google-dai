# Google DAI + Shaka Player — Integration Reference

**Project:** `google-dai-integration` (SolidJS debug SPA)  
**Purpose:** Reproduce and debug server-side Google DAI with Shaka Player, aligned with the Samsung TV app (`caracol-samsung`).
**Repository:** https://github.com/sinner/shaka-google-dai
**Live demo:** https://sinner.github.io/shaka-google-dai/manual-asset-key
**Related internal doc:** `caracol-samsung/docs/general/14-DAI-INTEGRATION-CHALLENGES.md`

---

## Glossary

Terms that appear often in this doc and in the challenges write-up. **VAST** and **FAST** are unrelated acronyms — they show up in the same DAI/streaming context but mean different things.

### VAST (Video Ad Serving Template)

An **IAB/Google XML standard** that describes a single video ad: creative URL, duration, click-through, and **tracking URLs** (impression, start, first quartile, midpoint, third quartile, complete).

In server-side DAI, the chain looks like this:

1. The stitched manifest carries timed metadata (`urn:google:dai:2018` tokens in `manifest.mpd`).
2. Each token resolves through `id3-events.json` to a **VAST** document for that ad.
3. The VAST contains the **`/interaction`** and impression beacon URLs that the IMA SDK fires as playback progresses.

So when this doc says slates do not emit `/interaction` pings, it means: **slates are not VAST-backed ads** — there are no quartile or impression URLs for filler content, only for real creatives.

### FAST (Free Ad-Supported Streaming TV)

A **business/model term**, not a file format. Linear, TV-like channels streamed free to viewers and monetized with ads — e.g. **Ditu** and **Tastemade** in this project.

| | **VAST** | **FAST** |
|---|----------|----------|
| **What it is** | Ad description format (XML) | Type of streaming service |
| **Layer** | Ad tech / tracking | Content distribution model |
| **In this project** | Source of `/interaction` tracking URLs | Label for production channels vs Google’s Tears of Steel sample |

### Other terms (brief)

| Term | Meaning |
|------|---------|
| **DAI** | Dynamic Ad Insertion — Google’s server-side ad stitching into live/VOD streams. |
| **SSAI** | Server-Side Ad Insertion — same idea as DAI; often used interchangeably in player docs. |
| **Slate** | Filler video stitched into the stream while ads are loading or fill is slow; not a VAST ad. |
| **Ad pod / ad break** | A contiguous block of ad time (may include multiple ads + slates) before returning to content. |
| **Interaction ping** | HTTP beacon to a GAM `/interaction` URL (quartile or related tracking), not the Shaka `ad-interaction` event alone. |

---

## 1. Library versions

| Library | Version in this project | Notes |
|--------|-------------------------|-------|
| **Shaka Player** | `4.12.2` (pinned in `package.json`) | Matches the Samsung TV app baseline. Shaka auto-sets `adTagParameters.mpv=v4.12.2` and `mpt=shaka-player` on every `requestServerSideStream()`. |
| **Google IMA DAI SDK** | Unpinned (CDN) | Loaded from `https://imasdk.googleapis.com/js/sdkloader/ima3_dai.js` in `index.html`. Google serves the latest compatible build; there is no lockfile entry. |
| **SolidJS** | `^1.9.13` | UI framework |
| **Vite** | `^8.1.1` | Bundler / dev server |

### Samsung TV app (for comparison)

| Library | Version (per challenges doc) |
|--------|------------------------------|
| Shaka Player | `4.16.39` |
| IMA DAI SDK | Same CDN loader (`ima3_dai.js`) |

> **Version gap:** This debug app intentionally pins **4.12.2** to mirror production Samsung builds. If interaction-ping behavior differs between 4.12.2 and 4.16.39, compare both here before changing production.

### Test asset keys (network `21775744923`)

| Channel | Asset key | Format | DRM |
|---------|-----------|--------|-----|
| Tears of Steel (reference — pings work) | `PSzZMzAkSXCmlJOWDmRj8Q` | DASH | Clear |
| Ditu (FAST — first-break-only pings) | `bZlVfExESNqF3-MgWO0VsA` | DASH | Clear |
| Tastemade (FAST — first-break-only pings) | `0emvnNXVRTumFKacd9P2Xg` | DASH | Widevine via AGL middleware |

---

## 2. Integration architecture

This project uses **Shaka Player native server-side DAI** (Approach 2 in the challenges doc). Shaka owns the timed-metadata → IMA `StreamManager.processMetadata()` pipeline; the app does not manually parse `urn:google:dai:2018` regions.

### High-level flow

```mermaid
flowchart TD
  A[Load IMA DAI SDK in index.html] --> B[Bind video + ad containers]
  B --> C[initShakaPlayer + getAdManager]
  C --> D[Register ad listeners BEFORE initServerSide]
  D --> E[initServerSide adContainer, video]
  E --> F[Register IMA_STREAM_MANAGER_LOADED listener]
  F --> G[createLiveStreamRequest + adTagParameters]
  G --> H[requestServerSideStream]
  H --> I[player.load manifest URI]
  I --> J[Shaka DASH parser: urn:google:dai:2018 EventStreams]
  J --> K[adManager.onDashTimedMetadata]
  K --> L[StreamManager.processMetadata]
  L --> M[/interaction + impression beacons]
  M --> N[PerformanceObserver logs pings in dashboard]

  H --> O{Channel change?}
  O -->|yes| P[player.unload]
  P --> Q[streamManager.reset + adManager.onAssetUnload]
  Q --> G
```

### Timed-metadata path (what drives `/interaction` pings)

On **DASH** server-side DAI, tracking depends on this chain inside Shaka + IMA:

```
manifest.mpd  <EventStream schemeIdUri="urn:google:dai:2018">
  → dash_parser.parseEventStream_
  → player.onTimelineRegionAdded
  → RegionTimeline.addRegion
  → adManager.onDashTimedMetadata
  → ServerSideAdManager.onTimedMetadata
  → google.ima.dai.api.StreamManager.processMetadata(...)
  → VAST impression / quartile /interaction HTTP beacons
```

Inband ID3 emsg (`https://aomedia.org/emsg/ID3`) on DASH is **not** routed to the ad manager in Shaka 4.x. HLS delivery uses inband ID3 instead.

---

## 3. Key integration sections (in execution order)

These are the sections that **must** run correctly for native DAI to work. File paths are relative to `src/`.

### 3.1 Load the IMA DAI SDK (before the app bundle)

**File:** `index.html`

```html
<script type="text/javascript" src="https://imasdk.googleapis.com/js/sdkloader/ima3_dai.js"></script>
```

Without this script, `google.ima.dai.api.LiveStreamRequest` is undefined and the player cannot start.

---

### 3.2 DOM: video element + server-side ad container

**File:** `components/features/VideoPlayer.tsx`

Shaka 4.x `initServerSide(adContainer, video)` needs:

1. A `<video>` element (content + stitched stream playback).
2. A visible overlay `<div class="dai-ad-container">` for server-side DAI UI / click-through during ad breaks.
3. A hidden client-side container (required by Shaka’s API surface even for server-side-only flows).

```tsx
<video ref={setVideoRef} controls playsinline autoplay muted />
<div ref={setAdContainerRef} class="dai-ad-container absolute inset-0 z-10" />
<div ref={setClientSideAdContainerRef} class="hidden" aria-hidden="true" />
```

`onReady` fires **once** when all three refs exist, then calls `bindElements()` in the player hook.

---

### 3.3 Initialize Shaka Player

**File:** `lib/video/shakaPlayer.ts`

```typescript
export function initShakaPlayer(video: HTMLVideoElement): shaka.Player {
  shaka.polyfill.installAll()
  const player = new shaka.Player(video)
  registerLicenseRequestFilter(player)
  return player
}
```

Shaka **4.12.2** uses the constructor form `new shaka.Player(video)`. (Shaka 5+ prefers `new Player()` + `attach()`.)

---

### 3.4 Register listeners **before** server-side init

**File:** `hooks/useShakaDaiPlayer.ts` → `initPlayer()`

Order matters:

1. `player = initShakaPlayer(video)`
2. `adManager = player.getAdManager()`
3. `registerAdEventListeners(adManager)` — includes interaction ping observer
4. `watchImaStreamManager(adManager, …)` — subscribes to `IMA_STREAM_MANAGER_LOADED`
5. `configureDaiAdContainers(adManager, elements)` → calls `initServerSide`

```typescript
configureDaiAdContainers(adManager, elements)
unregisterAdEvents = registerAdEventListeners(adManager)
unregisterStreamManagerWatch = watchImaStreamManager(adManager, {
  onManager: (manager) => { streamManager = manager },
  onAdBreakChange: (active) => setIsAdBreakActive(active),
})
```

> **Critical (from Samsung app findings):** `ima-stream-manager-loaded` is dispatched **synchronously inside** `initServerSide()`. The listener on `adManager` must be registered **before** `initServerSide()` runs. Registering after `initServerSide()` misses the event and you lose access to `StreamManager` for `reset()` on channel change.

**File:** `lib/video/shakaPlayer.ts`

```typescript
export function configureDaiAdContainers(adManager, elements) {
  // Shaka 4.x
  adManager.initServerSide(elements.adContainer, elements.video)
  // Shaka 5.x would use: adManager.setContainers(clientSide, serverSide)
}
```

---

### 3.5 Build the live stream request (asset key + ad tag parameters)

**File:** `lib/video/daiStream.ts`

```typescript
export function createLiveStreamRequest(config) {
  const request = new google.ima.dai.api.LiveStreamRequest()
  request.assetKey = config.assetKey
  if (config.imaApiKey) request.apiKey = config.imaApiKey
  if (config.adTagParameters) {
    request.adTagParameters = { ...config.adTagParameters }
  }
  return request
}
```

Samsung TV parameters live in `data/live-dai-samples.json` under `samsungTvAdTagParameters` and are merged for Ditu / Tastemade samples.

Shaka **overwrites** `mpt` and `mpv` inside `requestServerSideStream()` for adoption tracking (`shaka-player` / `v4.12.2`).

---

### 3.6 Request stream URI and load manifest

**File:** `hooks/useShakaDaiPlayer.ts` → `loadStream()`

```typescript
// On channel switch: tear down previous DAI session first
if (activeAssetKey()) {
  await player.unload()
  resetDaiStream(adManager, streamManager)
}

configureDaiAdContainers(adManager, elements)

// DRM (Tastemade): prime cookies, then configure license proxy
await primeDrmCookies(config.cookieResolverUrl)
applyDrmConfig(player, config.drmLicenseUrl)

const streamRequest = createLiveStreamRequest({ assetKey, imaApiKey, adTagParameters })
const uri = await adManager.requestServerSideStream(streamRequest)
await player.load(uri)
```

**File:** `hooks/useAdEventHandlers.ts` — session reset on channel change:

```typescript
export function resetDaiStream(adManager, streamManager) {
  streamManager?.reset()
  adManager?.onAssetUnload()
}
```

---

### 3.7 DRM (Tastemade only)

**Files:** `lib/video/shakaPlayer.ts`

1. **`primeDrmCookies(cookieResolverUrl)`** — GET the VIDEOURL endpoint so Axinom `playback_token` cookies exist before LICENSE.
2. **`applyDrmConfig(player, licenseUrl)`** — sets Widevine + PlayReady servers and `manifest.dash.ignoreDrmInfo: true` (Shaka 4.x path).
3. **License request filter** — routes LICENSE to the AGL proxy, sets `Content-Type: application/octet-stream`, `restful: yes`, `allowCrossSiteCredentials: true`.

---

### 3.8 Observe ad events and interaction pings

**Shaka ad events** — `hooks/useAdEventHandlers.ts` listens on `adManager` for `AD_STARTED`, quartiles, `AD_COMPLETE`, `AD_INTERACTION`, etc.

**Ad break boundaries** — Shaka 4.x does **not** emit `AD_BREAK_STARTED` / `AD_BREAK_ENDED` on `adManager` for server-side DAI. This project listens on the IMA `StreamManager` after `IMA_STREAM_MANAGER_LOADED`:

```typescript
streamManager.addEventListener(Type.AD_BREAK_STARTED, onStarted)
streamManager.addEventListener(Type.AD_BREAK_ENDED, onEnded)
```

**Interaction pings** — `lib/video/interactionPings.ts` uses `PerformanceObserver` on `resource` entries and logs matching URLs to the Events Dashboard (`dai-interaction-ping`).

```typescript
function isDaiInteractionUrl(url: string): boolean {
  // Matches /pagead/live/interaction/, /pagead/interaction/, dai.google.com/.../interaction/, etc.
  return /\/interaction(\/|\?|$)/i.test(url)
}
```

#### Interaction ping URL matching (important for the Events Dashboard)

GAM serves `/interaction` beacons on **different path shapes** depending on the asset. Both are valid; a naive substring check can hide pings for one stream while showing them for another:

| Stream | Example path | Matches `pagead/interaction`? | Matches `pagead/live/interaction`? | Matches `/\/interaction(\/|\?|$)/`? |
|--------|----------------|--------------------------------|-------------------------------------|--------------------------------------|
| Tears of Steel (sample) | `.../pagead/**live**/interaction/...` | **No** (`/live/` is in the way) | Yes | Yes |
| Ditu / Tastemade (FAST) | `.../pagead/interaction/...` | Yes | No | Yes |

**Do not** rely on only `pagead/interaction` or only `pagead/live/interaction`. The regex above (implemented in `src/lib/video/interactionPings.ts`) catches every variant regardless of host (`pubads.g.doubleclick.net`, `googleads.g.doubleclick.net`, `dai.google.com`, etc.).

**Dashboard checklist if pings look missing:**

1. **Hide Interaction Ping** must be **unchecked** (default).
2. Confirm `[GoogleDAI] DAI interaction ping` in the browser console — if console shows pings but the table does not, the filter is wrong; if neither shows, tracking is not firing (Section 6).
3. **Slates do not produce `/interaction` pings** — only real creatives do. A break that is mostly slate will look “quiet” in the network column even when the player is healthy.

Pings appear in the Events Dashboard under category **Network** / event `dai-interaction-ping`.

---

## 4. File map

| File | Responsibility |
|------|----------------|
| `index.html` | IMA DAI SDK script tag |
| `components/features/VideoPlayer.tsx` | Video + ad container DOM |
| `hooks/useShakaDaiPlayer.ts` | Player lifecycle, load/reset, DRM priming |
| `lib/video/shakaPlayer.ts` | Shaka init, `initServerSide`, DRM config |
| `lib/video/daiStream.ts` | `LiveStreamRequest` + ad tag parameters |
| `hooks/useAdEventHandlers.ts` | Shaka + IMA listeners, DAI reset |
| `lib/video/interactionPings.ts` | Network observer for `/interaction` |
| `lib/video/adEvents.ts` | Shaka ad event constants to track |
| `data/live-dai-samples.json` | Asset keys, Samsung ad tag params |
| `components/features/AdEventsDashboard.tsx` | Live event + ping feed |

---

## 5. What to review in the Samsung app (`caracol-samsung`)

Use this debug app as the **known-good wiring reference**. If Tears of Steel pings work here but Ditu/Tastemade fail in both apps, the issue is likely stream/timed-metadata related (see Section 6), not missing glue code. If Tears works here but fails on TV, compare the checklist below.

### 5.1 Integration wiring (fix if different from this project)

| # | Area | What to verify |
|---|------|----------------|
| 1 | **SDK load** | `ima3_dai.js` loaded before player code; `LiveStreamRequest` available at runtime. |
| 2 | **Listener order** | `IMA_STREAM_MANAGER_LOADED` listener on `adManager` registered **before** `initServerSide()`. |
| 3 | **initServerSide args** | `(adContainer, video)` — ad container must overlay the video (`dai-ad-container`), not be `display:none` during ads. |
| 4 | **Channel change teardown** | On every asset-key switch: `player.unload()` → `streamManager.reset()` → `adManager.onAssetUnload()` **before** the next `requestServerSideStream()`. Stale sessions cause silent tracking failure. |
| 5 | **Re-init on reload** | Call `initServerSide(adContainer, video)` again before each new stream (this project calls `configureDaiAdContainers` on every `loadStream`). |
| 6 | **adTagParameters** | Same Samsung TV params as `live-dai-samples.json` (`an`, `cust_params`, `idtype=tifa`, `ppid`, `rdid`, etc.). Wrong identity params affect ad decisioning, not usually ping mechanics, but must match production. |
| 7 | **DRM order (Tastemade)** | VIDEOURL cookie priming **before** LICENSE; `manifest.dash.ignoreDrmInfo: true`; license filter headers match AGL (`application/octet-stream`, `restful: yes`). |
| 8 | **Playback during ads** | Do not pause the video during ad breaks (slates + ads). Pausing can stall the metadata timeline. This project forces resume on ad-break pause and when scrolled off-screen. |
| 9 | **Muted autoplay** | TV browsers often require `muted` + `playsinline` for autoplay; stalled playback can desync live-edge metadata. |

### 5.2 Monitoring / observability traps

| # | Trap | Fix |
|---|------|-----|
| 1 | **Beacon URL path / dashboard filter** | Sample uses `.../pagead/live/interaction/`; FAST channels use `.../pagead/interaction/`. **`pagead/interaction` does not match the sample path** (see §3.8 table). Use `/\/interaction(\/|\?|$)/` in code or filter on `/interaction` in DevTools — never only `/live/interaction/`. |
| 2 | **Slates vs ads** | Real channels insert **~30 s slates** when fill is slow; Tears of Steel slates are ~0.1 s. **Slates do not emit `/interaction` pings** — only actual ads do. Do not count slate periods as “missing pings”. |
| 3 | **First break vs later breaks** | Known symptom on real channels: break #1 fires full `ad-started` → quartiles → `/interaction`; break #2+ may play video with **zero** new ad events and **zero** pings. Compare against a clean session (new tab, tune channel directly — not after long session on another channel). |
| 4 | **`timelineregionadded`** | On Tears of Steel this Shaka event fires continuously (~100+ per session). On Ditu it often fires **0 times** for the entire session. Instrument this event in the Samsung app to confirm metadata delivery. |
| 5 | **`AD_INTERACTION` vs network pings** | Shaka `ad-interaction` events and actual `/interaction` HTTP beacons are related but not identical. Trust **network** beacons for monetization verification. |

### 5.3 Stream / player configuration experiments (from challenges doc)

If wiring matches this project and Tears works but Ditu/Tastemade still fail on **break #2+**:

| # | Hypothesis | Experiment |
|---|------------|------------|
| 1 | **Timeline desync after long slates** | After ~30 s slate, stream-time ↔ content-time mapping may break `processMetadata` for later pods. Compare manifest period boundaries at slate→ad transitions vs Tears sample. |
| 2 | **Live-edge region drop** | Shaka drops DASH regions when `endTime < availabilityStart` (fast `PT2S` refresh, `PT1M40S` DVR). Log skipped regions; try larger `suggestedPresentationDelay` / buffer. |
| 3 | **Inband ID3 on DASH** | Real streams carry elemental timestamps in ID3, not DAI tokens — unlikely alternate path. Do not expect `emsg` to replace `urn:google:dai:2018` on DASH. |
| 4 | **HLS delivery** | Ask Ad Ops if asset can return HLS (SDK default). HLS DAI tracking uses inband ID3, a path Shaka+IMA handle without manual forwarding. |
| 5 | **Shaka version** | Issues #2716, #9039, #9556 affect multi-period live DASH DAI. Test 4.12.2 (this app) vs 4.16.39 (current Samsung) vs latest 4.x. |
| 6 | **Manual `processMetadata` fallback** | Challenges doc reports feeding tokens manually after first break **did not** revive pings — points to IMA `StreamManager` internal state, not missing app forwarding. |

### 5.4 Suggested instrumentation to add in Samsung app

```typescript
// Counters per session (reset on channel change)
let timelineregionadded = 0
let interactionBeacons = 0
let processMetadataCalls = 0 // if you can hook StreamManager

player.addEventListener('timelineregionadded', (e) => {
  timelineregionadded++
  logger.debug('timelineregionadded', { count: timelineregionadded, scheme: e?.schemeIdUri })
})

// Network: match interaction/ broadly
performance.getEntriesByType('resource').forEach(e => {
  if (e.name.includes('interaction/')) interactionBeacons++
})
```

Log these **per ad break id** (from manifest period id or `id3-events.json`) to see exactly where the chain stops.

---

## 6. Known behavior summary (Tears vs Ditu/Tastemade)

| Signal | Tears of Steel (sample) | Ditu / Tastemade (real FAST) |
|--------|-------------------------|------------------------------|
| Ads play | Yes, all breaks | Yes, all breaks |
| Shaka ad lifecycle events | Every break | Often **first break only** |
| `timelineregionadded` | Continuous (~100+) | Often **0** entire session |
| `/interaction` beacons | Every break | **First break only** (when they appear at all) |
| Slate duration in break | ~0.1 s | ~30 s when fill is slow |
| Beacon URL path | `/pagead/live/interaction/` | `/pagead/interaction/` |
| SCTE-35 in manifest | Few / none | Multiple `urn:scte:scte35:2013:xml` streams |

**Working theory (from challenges doc):** After a long slate, the stitched timeline introduces a discontinuity. IMA’s `StreamManager` stops consuming `urn:google:dai:2018` metadata for subsequent pods even though the manifest and `id3-events.json` remain valid. The Google sample never hits this because its slates are negligible.

**Definition of done (production):** On Ditu **and** Tastemade, three consecutive **ad-filled** breaks (not slate-only) each emit the full `/interaction` quartile chain plus impressions, verified in network logs.

### 6.1 Opinion: Is “fixing slates” relevant for the Samsung TV app?

**Short answer:** Slates are **highly relevant to diagnosis**, but **not something the Samsung TV web app can fix on its own**. Treating “remove slates in the player” as the fix will not resolve the interaction-ping problem.

**What slates are:** On Ditu and Tastemade, Google DAI stitches **filler slate** into the live stream when ad decisioning is slow (~30 s is common). Tears of Steel (Google’s sample) uses negligible slate (~0.1 s). Slates are part of the **server-stitched manifest**, not a UI or Shaka configuration the TV app toggles.

**What is expected vs broken:**

| Behavior | Expected? | Notes |
|----------|-----------|--------|
| No `/interaction` pings **during slate-only** periods | **Yes** | Slates are not ads; VAST quartile/impression URLs apply to creatives, not filler. |
| `/interaction` pings on **first ad-filled break** on Ditu/Tastemade | **Yes** (observed) | Proves wiring, `adTagParameters`, and IMA session setup can work on real FAST streams. |
| `/interaction` pings on **break #2+** on Ditu/Tastemade | **Should work; currently broken** | Ads often still play; Shaka/IMA ad events and beacons frequently **stop after the first pod**. |
| `/interaction` pings on **every break** on Tears of Steel | **Yes** (observed) | Known-good reference in this debug app and in the challenges doc. |

**Why slates still matter:** The leading hypothesis (see `14-DAI-INTEGRATION-CHALLENGES.md` §10–11) is that a **long slate introduces a timeline discontinuity** in multi-period live DASH. After that discontinuity, Shaka stops delivering `urn:google:dai:2018` timed metadata to IMA (`timelineregionadded` ≈ 0 on Ditu for the whole session), and `StreamManager.processMetadata()` stops firing for later pods — even though `manifest.mpd` and `id3-events.json` still contain valid tokens. Tears of Steel avoids this because its slate window is too short to desync the stream-time ↔ content-time mapping the SDK relies on.

**What the Samsung team should do (in priority order):**

1. **Do not chase “slate bugs” in app code** — you cannot strip or skip slate periods in the client without breaking the stitched stream.
2. **Do fix observability** — use the broad `/interaction` URL matcher (§3.8); do not conclude “no pings” because the DevTools filter only matches `/live/interaction/`.
3. **Do separate slate silence from tracking failure** — during a slate, zero pings is normal; during a **filled ad pod on break #2+**, zero pings is the monetization bug.
4. **Do pursue stream/player remedies with Google / Ad Ops**, not only front-end tweaks:
   - Ask whether **HLS** delivery is available (different metadata carrier; SDK default).
   - Escalate multi-period live DASH DAI issues to Google (Shaka [#2716](https://github.com/google/shaka-player/issues/2716), [#9039](https://github.com/google/shaka-player/issues/9039)) with HAR + manifest captures from break #1 (works) vs break #2 (fails).
   - Experiment with **live-edge buffer** (`suggestedPresentationDelay`, DVR window) — secondary hypothesis, not proven.
   - Discuss **slate/fill policy** with Ad Ops (shorter slates, higher fill) as a **business/stream config** lever, not a player patch.
5. **Do not expect a Samsung-only glue-code fix** — manual `processMetadata()` forwarding did not revive pings after the first break in the challenges doc; the failure sits in IMA/Shaka timed-metadata delivery after the first pod.

**Bottom line:** The slate difference between Tears of Steel and Ditu/Tastemade is a **strong clue pointing at timeline/metadata desync**, not a checklist item to “implement slate handling” in the TV app. The Samsung app should match this debug app’s DAI wiring (Section 5.1); if Tears works everywhere but real FAST channels fail on break #2+, invest in **Google/Shaka/stream-delivery** escalation rather than client-side slate workarounds.

---

## 7. Local development

```bash
pnpm install
pnpm dev
# → http://localhost:5173/manual-asset-key
```

1. Select **Tears of Steel** — confirm interaction pings on multiple breaks.  
2. Select **Ditu** or **Tastemade** — compare ping count across breaks in Events Dashboard.  
3. Uncheck **Hide Interaction Ping** to see all network beacons.  
4. Console filter: `[GoogleDAI]` for structured logs.

---

## 8. References

- [Shaka ad monetization tutorial (server-side)](https://shaka-project.github.io/shaka-player/docs/api/tutorial-ad_monetization.html#streaming-with-server-side-ads-insertion)
- [Google DAI — timed metadata with Shaka](https://developers.google.com/ad-manager/dynamic-ad-insertion/sdk/html5/timed-metadata#shaka_player)
- [Google DAI sample streams](https://developers.google.com/ad-manager/dynamic-ad-insertion/streams)
- Shaka issues: [#2716](https://github.com/google/shaka-player/issues/2716), [#9039](https://github.com/shaka-project/shaka-player/issues/9039), [#9556](https://github.com/shaka-project/shaka-player/issues/9556)

