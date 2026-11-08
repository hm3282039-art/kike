import { useEffect, useRef, useState } from 'react'
import { Gift, Info, MessageCircle, Send, Smile, Sparkles, Users, X } from 'lucide-react'
import { formatCoins, initialMessages } from '../data'
import { PawCoin, PlayerAvatar } from './GameArt'

export default function Chat({ open, onClose, onBonus }: { open: boolean; onClose: () => void; onBonus: (amount: number) => void }) {
  const [messages, setMessages] = useState(initialMessages)
  const [message, setMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [bonusClaimed, setBonusClaimed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

  const sendMessage = (text = message) => {
    const clean = text.trim()
    if (!clean) return
    const now = new Date()
    setMessages((current) => [...current, { id: Date.now(), user: 'Alex', avatar: 0, time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), text: clean }])
    setMessage('')
    setShowEmojis(false)
  }

  const claimBonus = () => {
    if (bonusClaimed) return
    setBonusClaimed(true)
    onBonus(100)
    setMessages((current) => [...current, { id: Date.now(), user: 'PawBot', avatar: 5, time: 'maintenant', text: 'Alex a récupéré le drop de la meute !', type: 'win', amount: 100 }])
  }

  return (
    <aside className={`live-chat ${open ? 'chat-open' : ''}`} aria-label="Chat communautaire simulé">
      <div className="chat-header">
        <div><span className="chat-title-icon"><MessageCircle size={18} /></span><div><h2>Chat de la meute</h2><span><span className="live-dot" />128 en ligne</span></div></div>
        <button className="icon-button chat-close" aria-label="Fermer le chat" onClick={onClose}><X size={19} /></button>
      </div>
      <div className="chat-drop">
        <div className="drop-icon"><Gift size={21} /></div>
        <div><span>DROP DE LA MEUTE</span><strong>{bonusClaimed ? 'Drop récupéré !' : 'Un cadeau pour toi'}</strong></div>
        <button disabled={bonusClaimed} onClick={claimBonus}>{bonusClaimed ? '✓' : <><PawCoin size={15} />+100</>}</button>
      </div>
      <div className="chat-demo-note"><Info size={12} /> Messages simulés, uniquement sur ton appareil</div>
      <div className="chat-messages">
        {messages.map((item) => (
          <div className={`chat-message ${item.type === 'system' ? 'system-message' : ''}`} key={item.id}>
            <PlayerAvatar index={item.avatar} size="small" />
            <div className="message-body">
              <div className="message-meta"><strong>{item.user}</strong><span>{item.time}</span></div>
              <p>{item.text}</p>
              {item.type === 'win' && item.amount && <div className="message-win"><Sparkles size={12} /><PawCoin size={15} />+{formatCoins(item.amount)}</div>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-compose">
        {showEmojis && <div className="emoji-picker">{['💜', '✨', '🎲', '👑', '🐾', '🚀'].map((emoji) => <button key={emoji} onClick={() => sendMessage(emoji)}>{emoji}</button>)}</div>}
        <form onSubmit={(event) => { event.preventDefault(); sendMessage() }}>
          <input value={message} maxLength={120} onChange={(event) => setMessage(event.target.value)} placeholder="Écris à la meute…" aria-label="Ton message" />
          <button className="emoji-button" type="button" aria-label="Choisir un emoji" onClick={() => setShowEmojis(!showEmojis)}><Smile size={19} /></button>
          <button className="send-button" type="submit" aria-label="Envoyer" disabled={!message.trim()}><Send size={17} /></button>
        </form>
        <span><Users size={12} /> Sois cool, fais partie de la meute.</span>
      </div>
    </aside>
  )
}
