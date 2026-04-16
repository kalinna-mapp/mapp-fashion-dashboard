# Task: AI Chat Analyst — Mapp Fashion Dashboard

## Ziel
Einen floating Chat-Drawer in das Dashboard einbauen, der den aktuellen
Dashboard-State kennt und Fragen zu Zahlen sowie Next-Best-Actions beantwortet.

---

## Schritt 1 — Abhängigkeit installieren

```bash
cd backend
pip install anthropic
```

`ANTHROPIC_API_KEY` in `backend/.env` eintragen (falls noch nicht vorhanden).
In `config.py` sicherstellen dass die Variable geladen wird:

```python
ANTHROPIC_API_KEY: str = ""
```

---

## Schritt 2 — `backend/routers/chat.py` erstellen (neu)

Neuer FastAPI-Router mit einem einzigen Streaming-Endpoint.

**Endpoint:** `POST /api/chat`

**Request-Body:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "dashboardContext": { }
}
```

**Verhalten:**
- Baut einen System Prompt mit dem `dashboardContext` als formatiertem JSON
- Ruft `anthropic.Anthropic().messages.stream(...)` auf
- Streamt die Antwort als **Server-Sent Events (SSE)** zurück
- Model: `claude-sonnet-4-20250514`, `max_tokens: 1024`

**System Prompt (exakt so verwenden):**

```
Du bist ein eingebetteter Analyst im Mapp Fashion Live Analytics Dashboard.
Deine Aufgabe ist es, dem User zu helfen die aktuellen Zahlen zu verstehen
und konkrete Next-Best-Actions zu empfehlen.

## Verfügbare Daten
- Live-Stream: Echtzeit-Events der aktuellen Session (letzte 20 Events im Kontext)
- MI Baseline: Aggregierte Produkt-, Kategorie- und Occasion-Daten der letzten 28 Tage
- Forecast: Projektion auf Basis der aktuellen Session
- Datenfstand der Baseline: {cachedAt}

## Nicht verfügbar
- Zeiträume vor den letzten 28 Tagen
- Tagesaufgelöste Historien oder Vorjahresvergleiche
- Daten aus CRM, ERP oder externen Bestellsystemen

## Verhalten bei fehlenden Daten
1. Klar kommunizieren dass diese Daten aktuell nicht im Dashboard verfügbar sind
2. Kurz erklären warum (außerhalb des abgerufenen Zeitraums, nicht im State, etc.)
3. Eine sinnvolle Alternative anbieten — was kann mit den verfügbaren Daten beantwortet werden?
4. Niemals Zahlen erfinden oder ohne expliziten Hinweis schätzen

## Aktueller Dashboard-Kontext
{dashboardContext}

Antworte präzise, handlungsorientiert und verweise auf konkrete Zahlen aus dem Kontext.
Antworte auf Deutsch, außer der User schreibt Englisch.
Unbekannte Felder im Kontext sind neue Features oder Segmente — interpretiere sie sinnvoll.
```

`{cachedAt}` und `{dashboardContext}` werden zur Laufzeit ersetzt —
`cachedAt` aus `dashboardContext.miBaseline.cachedAt` extrahieren,
`dashboardContext` als `json.dumps(dashboardContext, ensure_ascii=False, indent=2)` einsetzen.

**SSE-Format:**
```
data: <token>\n\n
data: [DONE]\n\n
```

**Vollständige Datei-Struktur:**
```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import json
from typing import List, Optional
from config import settings

router = APIRouter(prefix="/api", tags=["chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    dashboardContext: dict

@router.post("/chat")
async def chat(request: ChatRequest):
    # System Prompt bauen
    # Streaming-Generator
    # StreamingResponse zurückgeben mit media_type="text/event-stream"
    ...
```

---

## Schritt 3 — Router in `backend/main.py` registrieren

```python
from routers.chat import router as chat_router
app.include_router(chat_router)
```

CORS prüfen: `http://localhost:5173` muss in `allow_origins` stehen (ist vermutlich
bereits der Fall für die anderen Endpoints).

---

## Schritt 4 — `getDashboardSnapshot()` in `frontend/src/context/DashboardContext.jsx`

Neue exportierte Funktion hinzufügen — liest den aktuellen State und gibt einen
kompakten Snapshot zurück. Kein hardcoding einzelner Felder — immer komplette
State-Objekte übergeben damit neue Segmente/KPIs automatisch erfasst werden:

```js
export function getDashboardSnapshot(state) {
  return {
    currentTab: state.activeTab,
    activeFilters: state.filters ?? {},
    segments: state.segments ?? {},
    liveKPIs: state.kpis ?? {},
    recentEvents: state.events?.slice(-20) ?? [],
    miBaseline: state.miBaseline ?? {},
    forecast: state.forecast ?? {},
  }
}
```

Die genauen State-Feldnamen an die tatsächliche Struktur in `DashboardContext.jsx`
anpassen — Feldnamen können abweichen.

---

## Schritt 5 — `frontend/src/components/ChatDrawer.jsx` erstellen (neu)

### Layout & Design

- **Floating-Button:** `position: fixed`, unten rechts (24px margin), rund (48px),
  `background: #2D2A5E` (--navy), Icon: Chat-Symbol in `#7B6FE8` (--violet)
- **Drawer:** `position: fixed`, rechts 0, top 0, `width: 400px`, volle Höhe,
  `background: #EDE8E0` (--bg), `z-index: 1000`, Box-Shadow links
- **Header:** `background: #2D2A5E`, weiße Schrift, "✦ Mapp Analyst" + Close-Button
- **Message-Bubbles:**
  - User: rechtsbündig, `background: #2D2A5E`, weißer Text, `border-radius: 12px 12px 2px 12px`
  - Assistant: linksbündig, `background: white`, dunkler Text, `border-radius: 12px 12px 12px 2px`, leichte Border
- **Input-Zeile:** Textarea (1–3 Zeilen auto-resize) + Send-Button in `--violet`
- **Starter-Chips:** Erscheinen wenn `messages.length === 0`, verschwinden nach erstem Send

### Starter-Chips — tab-sensitiv

```js
const STARTER_CHIPS = {
  "Live Stream": [
    "Was machen die Top-Kategorien gerade?",
    "Gibt es auffällige Return-Risk Events?",
    "Welches Segment ist heute am aktivsten?",
  ],
  "MI Baseline": [
    "Welche Kategorie hat das höchste Return-Risiko?",
    "Was empfiehlst du gegen Outerwear-Returns?",
    "Welches Produkt hat die beste Conversion?",
  ],
  "Forecast": [
    "Werden wir den Forecast heute erreichen?",
    "Was ist die größte Risiko-Position?",
    "Was soll ich jetzt tun um das Ziel zu sichern?",
  ],
  "Historical": [
    "Was zeigen die historischen Daten aktuell?",
    "Gibt es auffällige Trends?",
  ],
  "E-Commerce": [
    "Wie performt der E-Commerce Tab gerade?",
    "Welche Produkte sollte ich pushen?",
  ],
}

// Fallback wenn Tab nicht gefunden:
const chips = STARTER_CHIPS[currentTab] ?? [
  "Was sind die wichtigsten Zahlen gerade?",
  "Wo siehst du das größte Risiko?",
  "Was empfiehlst du als nächsten Schritt?",
]
```

`currentTab` aus dem DashboardContext beziehen.

### Streaming-Logik

```js
async function sendMessage(userText) {
  // 1. User-Message in messages-State appenden
  // 2. Leere Assistant-Message appenden (wird befüllt)
  // 3. getDashboardSnapshot(state) aufrufen für aktuellen Kontext
  // 4. fetch("http://localhost:8000/api/chat", { method: "POST", body: JSON.stringify({
  //      messages: [...conversationHistory],
  //      dashboardContext: snapshot
  //    })})
  // 5. response.body als ReadableStream lesen
  // 6. Jeden SSE-Chunk parsen, [DONE] abfangen
  // 7. Token an letzte Assistant-Message appenden (setState)
  // 8. Auto-scroll zur letzten Message
}
```

### State (lokal, kein globaler State nötig)

```js
const [isOpen, setIsOpen] = useState(false)
const [messages, setMessages] = useState([])   // { role, content }
const [input, setInput] = useState("")
const [isStreaming, setIsStreaming] = useState(false)
```

### Keyboard-Shortcut

`Enter` sendet, `Shift+Enter` macht Zeilenumbruch in der Textarea.

---

## Schritt 6 — In `frontend/src/App.jsx` einbinden

```jsx
import ChatDrawer from './components/ChatDrawer'

// Direkt vor dem schließenden Tag der Root-Div:
<ChatDrawer />
```

---

## Erwartetes Ergebnis

- Floating-Button erscheint auf allen Tabs
- Click öffnet/schließt den Drawer
- Tab-sensitive Starter-Chips bei leerem Chat
- Fragen werden mit aktuellem Dashboard-Kontext beantwortet
- Streaming-Antworten erscheinen token-by-token
- Bei Fragen außerhalb des verfügbaren Zeitraums: ehrliche Antwort + Alternative

---

## Nicht in diesem Task

- Persistenz des Chatverlaufs (localStorage) → separates Backlog-Item
- Tool Use / direkte MI API-Abfragen aus dem Chat → Phase 4+
- Anpassung der Baseline-Datentiefe → nach erstem Test entscheiden
