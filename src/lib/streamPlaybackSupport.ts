import Hls from "hls.js";

const H264_AAC_CODEC = 'video/mp4; codecs="avc1.64001f,mp4a.40.2"';
const H264_AAC_BASELINE = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';

export type StreamPlaybackIssue = "none" | "no-mse" | "no-codec" | "no-native-hls";

export function detectStreamPlaybackIssue(): StreamPlaybackIssue {
  if (typeof window === "undefined") return "none";

  if (Hls.isSupported()) {
    if (typeof MediaSource === "undefined") return "no-mse";
    if (
      MediaSource.isTypeSupported(H264_AAC_CODEC) ||
      MediaSource.isTypeSupported(H264_AAC_BASELINE)
    ) {
      return "none";
    }
    return "no-codec";
  }

  const probe = document.createElement("video");
  if (probe.canPlayType("application/vnd.apple.mpegurl")) {
    return "none";
  }

  return "no-native-hls";
}

export function streamPlaybackErrorMessage(issue: StreamPlaybackIssue): string {
  switch (issue) {
    case "no-codec":
      return (
        "Este navegador no puede decodificar H.264/AAC (común en Firefox en Fedora). " +
        "Habilita fedora-cisco-openh264 e instala mozilla-openh264, o abre monitoreo en Chrome/Chromium."
      );
    case "no-mse":
      return "Tu navegador no soporta reproducción HLS en esta página.";
    case "no-native-hls":
      return "Tu navegador no soporta señales HLS. Prueba con Chrome, Edge o Safari.";
    default:
      return "No se pudo reproducir la señal.";
  }
}

export function isVideoDecodeError(video: HTMLVideoElement): boolean {
  const code = video.error?.code;
  return (
    code === MediaError.MEDIA_ERR_DECODE ||
    code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
  );
}
