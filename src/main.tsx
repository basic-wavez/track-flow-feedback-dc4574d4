
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupVisibilityTracking } from './components/waveform/WaveformCache';

// Update the document title
document.title = "Demo Manager";

// Set up global visibility tracking
setupVisibilityTracking();

// Initialize React app
createRoot(document.getElementById("root")!).render(<App />);
