/**
 * Video stream configurations
 */

import { VideoStream } from '@/types/stream';

/**
 * Available video streams
 */
export const VIDEO_STREAMS: VideoStream[] = [
  {
    title: 'Enlace TV',
    url: 'https://livecdn.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8',
    label: 'CAM 01',
  },
  {
    title: 'Enlace Dallas',
    url: 'https://livecdn-tx.enlace.plus/enlace/smil:enlace-hd.smil/playlist.m3u8',
    label: 'CAM 02',
  },
  {
    title: 'EJTV',
    url: 'https://livecdn.enlace.plus/ejtv/smil:ejtv-hd.smil/playlist.m3u8',
    label: 'CAM 03',
  },
  {
    title: 'Planeta Creación',
    url: 'https://livecdn.enlace.plus/planetacreacion/smil:planetacreacion-hd.smil/playlist.m3u8',
    label: 'CAM 04',
  },
  {
    title: 'En Concierto',
    url: 'https://livecdn.enlace.plus/enconcierto/smil:enconcierto-hd.smil/playlist.m3u8',
    label: 'CAM 05',
  },
  {
    title: 'Los Evangelios',
    url: 'https://livecdn.enlace.plus/evangelios/smil:evangelios-hd.smil/playlist.m3u8',
    label: 'CAM 06',
  },
  {
    title: 'Armando Alducin',
    url: 'https://livecdn.enlace.plus/armandoalducin/smil:aatv-hd.smil/playlist.m3u8',
    label: 'CAM 07',
  },
  {
    title: 'Mujeres de Fe',
    url: 'https://livecdn.enlace.plus/mujeresdefe/smil:mujeresdefe-hd.smil/playlist.m3u8',
    label: 'CAM 08',
  },
] as const;

/**
 * Stream player configuration
 */
export const STREAM_PLAYER_CONFIG = {
  autoplay: true,
  muted: false,
  fluid: true,
  responsive: true,
  html5: {
    hls: {
      overrideNative: true,
    },
  },
  sources: [
    {
      type: 'application/x-mpegURL',
    },
  ],
} as const;

/**
 * Video.js options for different variants
 */
export const VIDEO_JS_OPTIONS = {
  preview: {
    ...STREAM_PLAYER_CONFIG,
    controls: false,
    muted: true,
  },
  program: {
    ...STREAM_PLAYER_CONFIG,
    controls: true,
    muted: false,
  },
  default: {
    ...STREAM_PLAYER_CONFIG,
    controls: false,
    muted: true,
  },
} as const;
