import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (!import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set, using localhost fallback')
}

// Appifex visual editing support
// This enables click-to-edit functionality in the Appifex preview iframe
// The script stays dormant until activated by a postMessage from the parent
import('./_appifex/visual-edit');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
