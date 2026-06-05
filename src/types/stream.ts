


export enum StreamVariant {
  DEFAULT = 'default',
  PREVIEW = 'preview',
  PROGRAM = 'program',
}


export interface VideoStream {
  title: string;
  url: string;
  label: string;
  id?: string;
}


export interface StreamMetrics {
  streamId: string;
  timestamp: Date;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  isOnline: boolean;
  latency?: number;
}


export interface StreamStats {
  totalStreams: number;
  onlineStreams: number;
  offlineStreams: number;
  averageLatency: number;
  uptime: number;
}


export interface MonitoringState {
  pvwIndex: number;
  prgIndex: number;
  currentTime: string;
}


export interface StreamPlayerProps {
  url: string;
  title: string;
  variant: StreamVariant;
  autoplay?: boolean;
  muted?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
