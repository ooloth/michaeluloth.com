import { type ReactElement } from 'react'

const outerStylesDefault = 'my-6'
const videoStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full'
const iframeStylesDefault = 'shadow-xl rounded bg-zinc-800 w-full aspect-video'

type Props = Readonly<{
  url: string
  caption: string | null
  videoStyles?: string
  outerStyles?: string
}>

const YOUTUBE_HOSTS: ReadonlySet<string> = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

/** An 11-character YouTube video ID, safe to put in an embed URL. */
type YouTubeVideoId = string & { readonly __brand: 'YouTubeVideoId' }

type VideoSource = { kind: 'youtube'; videoId: YouTubeVideoId } | { kind: 'file'; url: string }

/**
 * Decides whether a video URL is on YouTube by its host, and extracts the video ID from
 * youtube.com/watch?v=, youtu.be/ or youtube.com/embed/ URLs. Other URLs are video files.
 *
 * @throws When the URL is on a YouTube host but has no valid video ID
 */
function parseVideoSource(url: string): VideoSource {
  const parsed = URL.canParse(url) ? new URL(url) : null
  if (parsed === null || !YOUTUBE_HOSTS.has(parsed.hostname)) {
    return { kind: 'file', url }
  }

  const candidate =
    parsed.hostname === 'youtu.be'
      ? parsed.pathname.slice(1)
      : parsed.pathname.startsWith('/embed/')
        ? parsed.pathname.slice('/embed/'.length)
        : parsed.searchParams.get('v')

  if (candidate === null || !YOUTUBE_VIDEO_ID.test(candidate)) {
    throw new Error(`Failed to extract YouTube video ID from URL: ${url}`)
  }

  return { kind: 'youtube', videoId: candidate as YouTubeVideoId }
}

/**
 * Renders a video element with optional caption.
 * Automatically detects YouTube URLs and renders them as iframes.
 * Other video URLs are rendered as HTML5 video elements.
 *
 * @example
 * // YouTube video with caption
 * <Video url="https://youtube.com/watch?v=dQw4w9WgXcQ" caption="Tutorial" />
 *
 * @example
 * // Direct video file without caption
 * <Video url="https://example.com/video.mp4" caption={null} />
 *
 * @returns A JSX element containing the video, optionally wrapped in a figure with a caption.
 */
export default function Video({ url, caption, videoStyles, outerStyles }: Props): ReactElement {
  const outerClasses = outerStyles ? `${outerStylesDefault} ${outerStyles}` : outerStylesDefault

  let videoElement: ReactElement

  const source = parseVideoSource(url)

  if (source.kind === 'youtube') {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${source.videoId}`
    const iframeClasses = videoStyles ? `${iframeStylesDefault} ${videoStyles}` : iframeStylesDefault

    videoElement = (
      <iframe
        src={embedUrl}
        title={caption || 'YouTube video'}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        loading="lazy"
        allowFullScreen
        className={iframeClasses}
      />
    )
  } else {
    const videoClasses = videoStyles ? `${videoStylesDefault} ${videoStyles}` : videoStylesDefault

    videoElement = (
      <video controls preload="metadata" playsInline className={videoClasses}>
        <source src={url} />
        Your browser does not support the video tag.
      </video>
    )
  }

  return caption ? (
    <figure className={outerClasses}>
      {videoElement}
      <figcaption className="caption">{caption}</figcaption>
    </figure>
  ) : (
    <div className={outerClasses}>{videoElement}</div>
  )
}
