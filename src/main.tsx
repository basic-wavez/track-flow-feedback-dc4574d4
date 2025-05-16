
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Update the document title
document.title = "Demo Manager";

createRoot(document.getElementById("root")!).render(<App />);
