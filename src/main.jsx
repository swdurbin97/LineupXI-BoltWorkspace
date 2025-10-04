import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TeamsProvider } from './store/TeamsContext'
import { LineupsProvider } from './store/LineupsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeamsProvider>
      <LineupsProvider>
        <App />
      </LineupsProvider>
    </TeamsProvider>
  </StrictMode>,
)
