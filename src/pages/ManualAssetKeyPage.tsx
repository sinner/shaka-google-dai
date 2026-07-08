import { createSignal, Show } from 'solid-js'
import { Play, Radio, RotateCcw } from 'lucide-solid'
import liveDaiSamples from '@/data/live-dai-samples.json'
import { AdEventsDashboard } from '@/components/features/AdEventsDashboard'
import { SampleStreamButtons } from '@/components/features/SampleStreamButtons'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { Button, Input, Title } from '@/components/ui'
import { useShakaDaiPlayer } from '@/hooks/useShakaDaiPlayer'
import { resolveAdTagParameters } from '@/lib/video/daiStream'
import type { LiveDaiSample, LiveDaiSamplesFile, StreamLoadConfig } from '@/types/dai'

const samplesData = liveDaiSamples as LiveDaiSamplesFile

function getDefaultSample(data: LiveDaiSamplesFile): LiveDaiSample {
  const byId = data.defaultSampleId
    ? data.samples.find((sample) => sample.id === data.defaultSampleId)
    : undefined

  return byId ?? data.samples[0]
}

const defaultSample = getDefaultSample(samplesData)

function streamConfigFromSample(
  sample: LiveDaiSample,
  data: LiveDaiSamplesFile,
): StreamLoadConfig {
  return {
    assetKey: sample.assetKey,
    drmLicenseUrl: sample.drmLicenseUrl,
    cookieResolverUrl: sample.cookieResolverUrl,
    imaApiKey: sample.requiresApiKey ? data.defaultImaApiKey : undefined,
    adTagParameters: resolveAdTagParameters(
      sample,
      data.samsungTvAdTagParameters,
    ),
  }
}

export default function ManualAssetKeyPage() {
  const player = useShakaDaiPlayer({
    defaultLoad: {
      config: streamConfigFromSample(defaultSample, samplesData),
      label: defaultSample.label,
    },
  })
  const [assetKey, setAssetKey] = createSignal(defaultSample.assetKey)
  const [drmLicenseUrl, setDrmLicenseUrl] = createSignal(
    defaultSample.drmLicenseUrl ?? '',
  )
  const [cookieResolverUrl, setCookieResolverUrl] = createSignal(
    defaultSample.cookieResolverUrl ?? '',
  )
  const [imaApiKey, setImaApiKey] = createSignal(samplesData.defaultImaApiKey)
  const [requiresApiKey, setRequiresApiKey] = createSignal(
    defaultSample.requiresApiKey,
  )
  const [adTagParameters, setAdTagParameters] = createSignal(
    resolveAdTagParameters(defaultSample, samplesData.samsungTvAdTagParameters),
  )

  const handleLoadStream = () => {
    void player.loadStream(
      {
        assetKey: assetKey(),
        drmLicenseUrl: drmLicenseUrl(),
        cookieResolverUrl: cookieResolverUrl(),
        imaApiKey: requiresApiKey() ? imaApiKey() : undefined,
        adTagParameters: adTagParameters(),
      },
      'Manual load',
    )
  }

  const handleSampleSelect = (sample: LiveDaiSample) => {
    setAssetKey(sample.assetKey)
    setRequiresApiKey(sample.requiresApiKey)
    setDrmLicenseUrl(sample.drmLicenseUrl ?? '')
    setCookieResolverUrl(sample.cookieResolverUrl ?? '')
    setAdTagParameters(
      resolveAdTagParameters(sample, samplesData.samsungTvAdTagParameters),
    )

    if (sample.requiresApiKey) {
      setImaApiKey(samplesData.defaultImaApiKey)
    }

    void player.loadStream(
      streamConfigFromSample(sample, samplesData),
      sample.label,
    )
  }

  const handleClear = () => {
    setAssetKey('')
    setDrmLicenseUrl('')
    setCookieResolverUrl('')
    setImaApiKey(samplesData.defaultImaApiKey)
    setRequiresApiKey(false)
    setAdTagParameters(undefined)
    void player.resetPlayer()
  }

  return (
    <section class="space-y-6">
      <header class="space-y-2">
        <Title as="h1">Manual Asset Key</Title>
        <p class="max-w-3xl text-sm text-text-muted">
          Load Google DAI live streams through Shaka Player. Use the sample
          streams from the{' '}
          <a
            class="text-primary-300 underline-offset-2 hover:underline"
            href="https://developers.google.com/ad-manager/dynamic-ad-insertion/streams"
            rel="noreferrer"
            target="_blank"
          >
            DAI sample streams
          </a>{' '}
          documentation or enter a custom asset key.
        </p>
      </header>

      <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
        <div class="space-y-6">
          <VideoPlayer
            class="max-w-none"
            loading={player.loading()}
            muted={player.muted()}
            isAdBreakActive={player.isAdBreakActive}
            onToggleMute={player.toggleMute}
            onReady={(elements) =>
              player.bindElements(
                elements.video,
                elements.adContainer,
                elements.clientSideAdContainer,
              )
            }
          />

          <Show when={player.error()}>
            {(message) => (
              <p class="rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
                {message()}
              </p>
            )}
          </Show>

          <div class="space-y-4 rounded-xl border border-border bg-surface p-6">
            <Title as="h3">Stream Configuration</Title>

            <div class="space-y-2">
              <p class="text-sm font-medium text-white">Sample live streams</p>
              <SampleStreamButtons
                samples={samplesData.samples}
                onSelect={handleSampleSelect}
              />
            </div>

            <Input
              label="Asset Key"
              placeholder="Enter your live asset key"
              hint="Network code for samples: 21775744923"
              value={assetKey()}
              onInput={(event) => setAssetKey(event.currentTarget.value)}
            />

            <Show when={requiresApiKey()}>
              <Input
                label="IMA API Key"
                placeholder="Required for authenticated sample streams"
                hint="Use the active IMA test API key from Google DAI docs when required."
                value={imaApiKey()}
                onInput={(event) => setImaApiKey(event.currentTarget.value)}
              />
            </Show>

            <Input
              label="DRM License URL (optional)"
              placeholder="https://middleware.../CONTENT/LICENSE"
              hint="Widevine/PlayReady license proxy. Leave empty for clear streams."
              value={drmLicenseUrl()}
              onInput={(event) => setDrmLicenseUrl(event.currentTarget.value)}
            />

            <Input
              label="DRM Cookie Resolver URL (optional)"
              placeholder="https://middleware.../CONTENT/VIDEOURL/LIVE/{id}/{assetId}"
              hint="Primes playback_token cookies before LICENSE (same as Samsung/Cast cookieResolverUrl)."
              value={cookieResolverUrl()}
              onInput={(event) => setCookieResolverUrl(event.currentTarget.value)}
            />

            <div class="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleLoadStream}
                disabled={player.loading()}
              >
                <Play size={16} />
                Load Stream
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRequiresApiKey((current) => !current)}
              >
                <Radio size={16} />
                {requiresApiKey() ? 'API key required' : 'API key optional'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClear}
                disabled={player.loading()}
              >
                <RotateCcw size={16} />
                Clear
              </Button>
            </div>
          </div>
        </div>

        <aside class="xl:sticky xl:top-6 xl:self-start">
          <AdEventsDashboard class="xl:h-[calc(100dvh-5.5rem)]" />
        </aside>
      </div>
    </section>
  )
}
