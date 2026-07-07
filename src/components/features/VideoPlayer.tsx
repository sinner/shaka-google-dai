import { onMount, onCleanup } from 'solid-js';
import shaka from 'shaka-player';


type DrmVideoPlayerProps = {
  streamUrl: string;
  drmLicenseUrl: string;
}


export default function DrmVideoPlayer(props: DrmVideoPlayerProps) {
  let videoRef: HTMLVideoElement | undefined;
  let player: shaka.Player | undefined;

  onMount(() => {
    // 1. Install polyfills if needed (useful for Safari/FairPlay)
    shaka.polyfill.installAll();

    // 2. Initialize Shaka Player
    player = new shaka.Player(videoRef);

    // 3. Configure DRM servers
    player.configure({
      drm: {
        servers: {
          'com.widevine.alpha': props.drmLicenseUrl,
          'com.microsoft.playready': props.drmLicenseUrl,
          'com.apple.fps': props.drmLicenseUrl // For FairPlay
        }
      }
    });

    // 4. Load the video
    player.load(props.streamUrl).then(() => {
      console.log('The video has now been loaded!');
    }).catch((error) => {
      console.error('Error code', error);
    });
  });

  // 5. Clean up the player on unmount
  onCleanup(() => {
    if (player) {
      player.destroy();
    }
  });

  return (
    <div>
      <video
        ref={videoRef}
        width="640"
        controls
        autoplay
      />
    </div>
  );
}