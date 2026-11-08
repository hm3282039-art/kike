import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/outfit'
import App from './App'
import PetIndex from './components/PetIndex'
import { IS_STATIC_BUILD } from './lib/appUrl'
import './dice-only.css'
import './dice-polish.css'
import './pet-variants.css'
import './pet-index.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const staticPage = new URLSearchParams(window.location.search).get('page')
const isPetIndex = IS_STATIC_BUILD
  ? staticPage !== 'dice'
  : path === '/pets' || (path === '/' && import.meta.env.VITE_INDEX_ROOT === 'true')
document.title = isPetIndex ? 'PS99 Pet Index — PawPlay' : 'Color Dice Duels — PawPlay'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isPetIndex ? <PetIndex /> : <App />}
  </React.StrictMode>,
)
