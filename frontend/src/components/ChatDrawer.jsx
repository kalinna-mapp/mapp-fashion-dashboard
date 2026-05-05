import { useState, useRef, useEffect, useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { getDashboardSnapshot } from '../context/dashboardSnapshot.js'

const STARTER_CHIPS = [
  'Was sind die wichtigsten Zahlen gerade?',
  'Wo siehst du das größte Risiko?',
  'Was empfiehlst du als nächsten Schritt?',
  'Welche Kategorie performt am besten?',
]

const CHAT_API = 'http://localhost:8000/api/chat'

export default function ChatDrawer() {
  const state = useContext(DashboardContext)
  const [isOpen, setIsOpen]       = useState(false)
  const [messages, setMessages]   = useState([])   // { role, content }
  const [input, setInput]         = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 88) + 'px'
  }, [input])

  async function sendMessage(userText) {
    if (!userText.trim() || isStreaming) return

    const userMsg = { role: 'user', content: userText.trim() }
    const assistantMsg = { role: 'assistant', content: '' }

    // Build conversation history from existing messages + new user msg
    const history = [...messages, userMsg]

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsStreaming(true)

    const snapshot = getDashboardSnapshot(state)

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          dashboardContext: snapshot,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            setIsStreaming(false)
            return
          }
          // Token is JSON-encoded to handle newlines / special chars safely
          let token
          try { token = JSON.parse(data) } catch { token = data }
          setMessages(prev => {
            const msgs = [...prev]
            const last = msgs[msgs.length - 1]
            msgs[msgs.length - 1] = { ...last, content: last.content + token }
            return msgs
          })
        }
      }
    } catch (err) {
      setMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: `Fehler: ${err.message}. Bitte Backend prüfen und LITELLM_API_KEY in .env setzen.`,
        }
        return msgs
      })
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24,
          width: 48, height: 48, borderRadius: '50%',
          background: '#2D2A5E', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          zIndex: 1001,
        }}
        title="Mapp Analyst öffnen"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="#7B6FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed', right: 0, top: 0, width: 400, height: '100vh',
          background: '#EDE8E0', zIndex: 1000,
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            background: '#2D2A5E', color: '#fff',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>✦ Mapp Analyst</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none', border: 'none', color: '#fff',
                cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px',
              }}
            >×</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {messages.length === 0 && (
              <div>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                  Frag mich zu den aktuellen Dashboard-Daten.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {STARTER_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      style={{
                        background: '#fff', border: '1px solid #ddd',
                        borderRadius: 8, padding: '8px 12px',
                        cursor: 'pointer', textAlign: 'left', fontSize: 13,
                        color: '#2D2A5E', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.target.style.background = '#f0edf8'}
                      onMouseLeave={e => e.target.style.background = '#fff'}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user'
                    ? '12px 12px 2px 12px'
                    : '12px 12px 12px 2px',
                  background:  msg.role === 'user' ? '#2D2A5E' : '#fff',
                  color:       msg.role === 'user' ? '#fff' : '#1a1a2e',
                  fontSize: 13, lineHeight: 1.55,
                  border: msg.role === 'assistant' ? '1px solid #e0dbd0' : 'none',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content || (isStreaming && i === messages.length - 1
                    ? <span style={{ opacity: 0.5 }}>…</span>
                    : null
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #d8d2c8',
            background: '#EDE8E0',
            flexShrink: 0,
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Frage stellen…"
              rows={1}
              disabled={isStreaming}
              style={{
                flex: 1, resize: 'none', border: '1px solid #c8c2b8',
                borderRadius: 8, padding: '8px 12px', fontSize: 13,
                background: '#fff', outline: 'none', lineHeight: 1.5,
                fontFamily: 'inherit', minHeight: 36, maxHeight: 88,
                color: '#1a1a2e',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isStreaming || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: isStreaming || !input.trim() ? '#ccc' : '#7B6FE8',
                border: 'none', cursor: isStreaming || !input.trim() ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
              title="Senden (Enter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
