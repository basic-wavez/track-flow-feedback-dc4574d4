
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Update the document title
document.title = "Demo Manager";

// Store the starting timestamp for this session
try {
  sessionStorage.setItem('app_session_start', Date.now().toString());
  
  // Create a persistent track cache if it doesn't exist
  if (!sessionStorage.getItem('track_data_cache')) {
    sessionStorage.setItem('track_data_cache', JSON.stringify({}));
  }
} catch (e) {
  console.warn('Error setting session data:', e);
}

// Initialize React app
createRoot(document.getElementById("root")!).render(<App />);

// Add unload handler to clean up resources
window.addEventListener('beforeunload', () => {
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

// Function to safely access session storage
window.getSessionItem = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

// Function to safely set session storage item
window.setSessionItem = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
};

// Declare the window methods for TypeScript
declare global {
  interface Window {
    getSessionItem: (key: string) => string | null;
    setSessionItem: (key: string, value: string) => boolean;
  }
}
