import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import StylistApp from './stylist/StylistApp.jsx'

const isStylistRoute = window.location.pathname.startsWith('/stylist')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isStylistRoute ? <StylistApp /> : <App />}
  </StrictMode>,
)
