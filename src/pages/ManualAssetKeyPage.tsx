import { createSignal, Show } from 'solid-js'
import { Play, Radio, RotateCcw } from 'lucide-solid'
import liveDaiSamples from '@/data/live-dai-samples.json'
import { AdEventsDashboard } from '@/components/features/AdEventsDashboard'
import { SampleStreamButtons } from '@/components/features/SampleStreamButtons'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { Button, Input, Title } from '@/components/ui'
import { useShakaDaiPlayer } from '@/hooks/useShakaDaiPlayer'
import type { LiveDaiSample, LiveDaiSamplesFile } from '@/types/dai'

const samplesData = liveDaiSamples as LiveDaiSamplesFile

export default function ManualAssetKeyPage() {
  const player = useShakaDaiPlayer()
  const [assetKey, setAssetKey] = createSignal('')
  const [drmLicenseUrl, setDrmLicenseUrl] = createSignal('')
  const [imaApiKey, setImaApiKey] = createSignal(samplesData.defaultImaApiKey)
  const [requiresApiKey, setRequiresApiKey] = createSignal(false)

  const handleLoadStream = () => {
    void player.loadStream(
      {
        assetKey: assetKey(),
        drmLicenseUrl: drmLicenseUrl(),
        imaApiKey: requiresApiKey() ? imaApiKey() : undefined,
      },
      'Manual load',
    )
  }

  const handleSampleSelect = (sample: LiveDaiSample) => {
    setAssetKey(sample.assetKey)
    setRequiresApiKey(sample.requiresApiKey)

    if (sample.requiresApiKey) {
      setImaApiKey(samplesData.defaultImaApiKey)
    }

    void player.loadStream(
      {
        assetKey: sample.assetKey,
        drmLicenseUrl: drmLicenseUrl(),
        imaApiKey: sample.requiresApiKey
          ? samplesData.defaultImaApiKey
          : undefined,
      },
      sample.label,
    )
  }

  const handleClear = () => {
    setAssetKey('')
    setDrmLicenseUrl('')
    setImaApiKey(samplesData.defaultImaApiKey)
    setRequiresApiKey(false)
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
              placeholder="https://license.example.com/widevine"
              hint="Leave empty for unencrypted DAI sample streams."
              value={drmLicenseUrl()}
              onInput={(event) => setDrmLicenseUrl(event.currentTarget.value)}
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
