
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format time in seconds to mm:ss format
 */
export function formatTime(time: number): string {
  // Handle invalid time values
  if (!isFinite(time) || isNaN(time)) {
    return "--:--";
  }
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
