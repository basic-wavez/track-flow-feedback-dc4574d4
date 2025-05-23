
export interface OscilloscopeOptions {
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  sensitivity?: number;
  drawMode?: 'line' | 'dots' | 'bars';
  dashPattern?: number[];
  fillColor?: string;
  fillOpacity?: number;
  invertY?: boolean;
  targetFPS?: number;
}
