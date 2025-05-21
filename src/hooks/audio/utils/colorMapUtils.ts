
// Color palettes for the different perceptual color maps
// These are simplified versions - in production you'd want more granular color stops
const INFERNO_PALETTE = [
  [0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106], 
  [186, 54, 85], [227, 89, 51], [249, 140, 10], [249, 201, 50], [252, 255, 164]
];

const MAGMA_PALETTE = [
  [0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129], 
  [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191]
];

const TURBO_PALETTE = [
  [48, 18, 59], [70, 45, 129], [63, 81, 181], [43, 116, 202], 
  [32, 149, 218], [34, 181, 229], [68, 209, 209], [121, 231, 155], 
  [174, 240, 98], [222, 238, 35], [249, 189, 0], [249, 140, 0], [227, 69, 14], [180, 0, 0]
];

export type ColorMapType = 'default' | 'inferno' | 'magma' | 'turbo';
export type RGBColor = { r: number, g: number, b: number };

/**
 * Helper to interpolate between two hex colors
 */
export const interpolateHexColors = (color1: string, color2: string, factor: number): RGBColor => {
  // Parse hex colors to RGB
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);
  
  // Interpolate between the two colors
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  return { r, g, b };
};

/**
 * Helper to interpolate within a color palette array
 */
export const interpolateColorArray = (palette: number[][], value: number): RGBColor => {
  if (value <= 0) return { r: palette[0][0], g: palette[0][1], b: palette[0][2] };
  if (value >= 1) return { r: palette[palette.length-1][0], g: palette[palette.length-1][1], b: palette[palette.length-1][2] };
  
  // Map value to the palette segments
  const segment = value * (palette.length - 1);
  const index = Math.floor(segment);
  const fraction = segment - index;
  
  // If exact match or at the end
  if (fraction === 0 || index >= palette.length - 1) {
    return { r: palette[index][0], g: palette[index][1], b: palette[index][2] };
  }
  
  // Interpolate between two palette entries
  const r = Math.round(palette[index][0] + fraction * (palette[index+1][0] - palette[index][0]));
  const g = Math.round(palette[index][1] + fraction * (palette[index+1][1] - palette[index][1]));
  const b = Math.round(palette[index][2] + fraction * (palette[index+1][2] - palette[index][2]));
  
  return { r, g, b };
};

/**
 * Generates a color cache based on selected color map
 */
export const generateColorCache = (
  colorMap: ColorMapType,
  colorStart: string,
  colorMid: string,
  colorEnd: string
): RGBColor[] => {
  const colorCache: RGBColor[] = Array(256).fill({ r: 0, g: 0, b: 0 });
  
  // Generate all 256 possible colors and cache them
  for (let i = 0; i < 256; i++) {
    const normalizedValue = i / 255;
    
    if (colorMap === 'inferno') {
      colorCache[i] = interpolateColorArray(INFERNO_PALETTE, normalizedValue);
    } else if (colorMap === 'magma') {
      colorCache[i] = interpolateColorArray(MAGMA_PALETTE, normalizedValue);
    } else if (colorMap === 'turbo') {
      colorCache[i] = interpolateColorArray(TURBO_PALETTE, normalizedValue);
    } else {
      // Default color map (original three-color gradient)
      let rgb;
      if (normalizedValue < 0.5) {
        // Interpolate between colorStart and colorMid
        const t = normalizedValue * 2;
        rgb = interpolateHexColors(colorStart, colorMid, t);
      } else {
        // Interpolate between colorMid and colorEnd
        const t = (normalizedValue - 0.5) * 2;
        rgb = interpolateHexColors(colorMid, colorEnd, t);
      }
      colorCache[i] = rgb;
    }
  }
  
  return colorCache;
};

export const COLOR_MAPS = {
  INFERNO_PALETTE,
  MAGMA_PALETTE,
  TURBO_PALETTE
};
