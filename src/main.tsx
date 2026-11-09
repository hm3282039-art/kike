import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/outfit'
import App from './App'
import PetIndex from './components/PetIndex'
import Poker from './components/Poker'
import { IS_STATIC_BUILD } from './lib/appUrl'
import './dice-only.css'
import './dice-polish.css'
import './pet-variants.css'
import './pet-index.css'
import './live-dice.css'
import './visual-polish.css'
import './poker.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

function Root() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const updateHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', updateHash)
    return () => window.removeEventListener('hashchange', updateHash)
  }, [])

  const staticPage = hash.replace(/^#/, '')
  const page = IS_STATIC_BUILD
    ? staticPage === 'dice' || staticPage === 'poker' ? staticPage : 'pets'
    : path === '/poker' ? 'poker' : path === '/pets' || (path === '/' && import.meta.env.VITE_INDEX_ROOT === 'true') ? 'pets' : 'dice'

  useEffect(() => {
    document.title = page === 'pets' ? 'PS99 Pet Index — PawPlay' : page === 'poker' ? 'Diamond Poker — PawPlay' : 'Color Dice Duels — PawPlay'
  }, [page])

  return page === 'pets' ? <PetIndex /> : page === 'poker' ? <Poker /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
