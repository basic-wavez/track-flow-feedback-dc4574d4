
import { ColorMapType } from '../utils/colorMapUtils';

export interface SpectrogramOptions {
  colorStart?: string;
  colorEnd?: string;
  colorMid?: string;
  timeScale?: number;
  backgroundColor?: string;
  maxFrequency?: number;
  targetFPS?: number;
  bufferSize?: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  useLogScale?: boolean;
  useDevicePixelRatio?: boolean;
  colorMap?: ColorMapType;
}
