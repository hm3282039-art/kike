import React, { useEffect, useState } from 'react'
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
import './live-dice.css'
import './visual-polish.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const staticPage = hash.replace(/^#/, '')
  const isPetIndex = IS_STATIC_BUILD
    ? staticPage !== 'dice'
    : path === '/pets' || (path === '/' && import.meta.env.VITE_INDEX_ROOT === 'true')

  useEffect(() => {
    document.title = isPetIndex ? 'PS99 Pet Index — PawPlay' : 'Color Dice Duels — PawPlay'
  }, [isPetIndex])

  return isPetIndex ? <PetIndex /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
