
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupVisibilityTracking } from './components/waveform/WaveformCache';

// Update the document title
document.title = "Demo Manager";

// Set up global visibility tracking only once at application start
const cleanupVisibilityTracking = setupVisibilityTracking();

// Store the starting timestamp for this session
try {
  sessionStorage.setItem('app_session_start', Date.now().toString());
} catch (e) {
  console.warn('Error setting session start time:', e);
}

// Initialize React app
createRoot(document.getElementById("root")!).render(<App />);

// Add unload handler to clean up resources
window.addEventListener('beforeunload', () => {
  // Clean up visibility tracking
  if (cleanupVisibilityTracking) {
    cleanupVisibilityTracking();
  }
  
  // Persist important state if needed
  try {
    // Mark the session end time
    const sessionData = {
      endTime: Date.now(),
      startTime: parseInt(sessionStorage.getItem('app_session_start') || '0', 10)
    };
    localStorage.setItem('last_session_data', JSON.stringify(sessionData));
  } catch (e) {
    console.warn('Error during unload cleanup:', e);
  }
});
