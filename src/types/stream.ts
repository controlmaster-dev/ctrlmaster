/**
 * Video stream and monitoring types
 */

/**
 * Stream variant types
 */
export enum StreamVariant {
  DEFAULT = 'default',
  PREVIEW = 'preview',
  PROGRAM = 'program',
}

/**
 * Video stream interface
 */
export interface VideoStream {
  title: string;
  url: string;
  label: string;
  id?: string;
}

/**
 * Stream metrics interface
 */
export interface StreamMetrics {
  streamId: string;
  timestamp: Date;
  bitrate?: number;
  fps?: number;
  resolution?: string;
  isOnline: boolean;
  latency?: number;
}

/**
 * Stream statistics interface
 */
export interface StreamStats {
  totalStreams: number;
  onlineStreams: number;
  offlineStreams: number;
  averageLatency: number;
  uptime: number;
}

/**
 * Monitoring state interface
 */
export interface MonitoringState {
  pvwIndex: number;
  prgIndex: number;
  currentTime: string;
}

/**
 * Stream player props
 */
export interface StreamPlayerProps {
  url: string;
  title: string;
  variant: StreamVariant;
  autoplay?: boolean;
  muted?: boolean;
  onReady?: () => void;
  onError?: (error: Error) => void;
}
