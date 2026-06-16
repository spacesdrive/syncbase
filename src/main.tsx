import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// @ts-expect-error CSS handled by bundler
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let reloading = false

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => { })

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) return
          reloading = true
          window.location.reload()
        })
      })
      .catch(() => { })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
