import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#111118',
          color: '#e5e7eb',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#111118',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#111118',
          },
        },
      }}
    />
  </StrictMode>,
)
