
import { OscilloscopeOptions } from './types';

/**
 * Draw the oscilloscope visualization on the canvas
 */
export function drawOscilloscope(
  ctx: CanvasRenderingContext2D,
  dataArray: Float32Array,
  width: number,
  height: number,
  options: OscilloscopeOptions
) {
  const {
    lineColor,
    lineWidth,
    backgroundColor,
    sensitivity,
    drawMode,
    dashPattern,
    fillColor,
    fillOpacity,
    invertY
  } = options;

  // Clear the canvas
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Calculate vertical scaling based on sensitivity
  const verticalScale = height * 0.4 * sensitivity;
  const sliceWidth = width / dataArray.length;
  
  // Set up dash pattern if specified
  if (dashPattern && dashPattern.length > 0) {
    ctx.setLineDash(dashPattern);
  } else {
    ctx.setLineDash([]);
  }
  
  // Draw the waveform based on draw mode
  if (drawMode === 'line') {
    drawLineMode(ctx, dataArray, width, height, sliceWidth, verticalScale, invertY, lineWidth, lineColor, fillColor, fillOpacity);
  } else if (drawMode === 'dots') {
    drawDotsMode(ctx, dataArray, sliceWidth, height, verticalScale, invertY, lineWidth, lineColor);
  } else if (drawMode === 'bars') {
    drawBarsMode(ctx, dataArray, sliceWidth, height, verticalScale, invertY, lineWidth, lineColor);
  }
}

/**
 * Draw the oscilloscope in line mode
 */
function drawLineMode(
  ctx: CanvasRenderingContext2D,
  dataArray: Float32Array,
  width: number,
  height: number,
  sliceWidth: number,
  verticalScale: number,
  invertY: boolean,
  lineWidth: number,
  lineColor: string,
  fillColor: string,
  fillOpacity: number
) {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  
  // Reduce the number of points we draw for better performance
  const skipPoints = Math.max(1, Math.floor(dataArray.length / 300));
  
  for (let i = 0; i < dataArray.length; i += skipPoints) {
    const x = i * sliceWidth;
    
    const yValue = dataArray[i];
    const yValueWithInversion = invertY ? -yValue : yValue;
    const y = height / 2 - (yValueWithInversion * verticalScale);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  
  // Fill below the line if fillColor is provided
  if (fillColor !== 'transparent' && fillOpacity > 0) {
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = fillOpacity;
    ctx.fill();
    ctx.globalAlpha = 1.0; // Reset alpha
  }
}

/**
 * Draw the oscilloscope in dots mode
 */
function drawDotsMode(
  ctx: CanvasRenderingContext2D,
  dataArray: Float32Array,
  sliceWidth: number,
  height: number,
  verticalScale: number,
  invertY: boolean,
  lineWidth: number,
  lineColor: string
) {
  ctx.fillStyle = lineColor;
  
  // Draw fewer dots for better performance
  const skipPoints = Math.max(2, Math.floor(dataArray.length / 100));
  
  for (let i = 0; i < dataArray.length; i += skipPoints) {
    const x = i * sliceWidth;
    
    const yValue = dataArray[i];
    const yValueWithInversion = invertY ? -yValue : yValue;
    const y = height / 2 - (yValueWithInversion * verticalScale);
    
    ctx.beginPath();
    ctx.arc(x, y, lineWidth, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Draw the oscilloscope in bars mode
 */
function drawBarsMode(
  ctx: CanvasRenderingContext2D,
  dataArray: Float32Array,
  sliceWidth: number,
  height: number,
  verticalScale: number,
  invertY: boolean,
  lineWidth: number,
  lineColor: string
) {
  ctx.fillStyle = lineColor;
  
  // Draw fewer bars for better performance
  const skipPoints = Math.max(4, Math.floor(dataArray.length / 75));
  
  for (let i = 0; i < dataArray.length; i += skipPoints) {
    const x = i * sliceWidth;
    
    const yValue = dataArray[i];
    const yValueWithInversion = invertY ? -yValue : yValue;
    const y = height / 2 - (yValueWithInversion * verticalScale);
    
    // Draw bar from center line to signal point
    const barHeight = Math.abs(y - height / 2);
    
    ctx.fillRect(
      x - lineWidth / 2, 
      Math.min(y, height / 2), 
      lineWidth, 
      barHeight
    );
  }
}
