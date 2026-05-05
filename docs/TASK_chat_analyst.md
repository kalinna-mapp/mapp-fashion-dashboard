# Task: AI Chat Analyst — Mapp Fashion Dashboard

## Goal
Add a floating chat drawer to the dashboard that is aware of the current dashboard state and can answer questions about metrics as well as recommend next-best actions.

---

## Step 1 — Install dependency

```bash
cd backend
pip install anthropic
```

Add `ANTHROPIC_API_KEY` to `backend/.env` (if not already present).
Ensure the variable is loaded in `config.py`:

```python
ANTHROPIC_API_KEY: str = ""
```

---

## Step 2 — Create `backend/routers/chat.py` (new)

New FastAPI router with a single streaming endpoint.

**Endpoint:** `POST /api/chat`

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "dashboardContext": { }
}
```

**Behaviour:**
- Builds a system prompt with `dashboardContext` as formatted JSON
- Calls `anthropic.Anthropic().messages.stream(...)`
- Streams the response back as **Server-Sent Events (SSE)**
- Model: `claude-sonnet-4-20250514`, `max_tokens: 1024`

**System prompt (use exactly as-is):**

```
You are an embedded analyst in the Mapp Fashion Live Analytics Dashboard.
Your job is to help the user understand the current metrics
and recommend concrete next-best actions.

## Available data
- Live stream: real-time events from the current session (last 20 events in context)
- MI Baseline: aggregated product, category, and occasion data for the last 28 days
- Forecast: projection based on the current session
- Baseline data as of: {cachedAt}

## Not available
- Time periods before the last 28 days
- Day-level history or year-over-year comparisons
- Data from CRM, ERP, or external order management systems

## Behaviour when data is missing
1. Clearly communicate that this data is not currently available in the dashboard
2. Briefly explain why (outside the retrieved time range, not in state, etc.)
3. Offer a useful alternative — what can be answered with the available data?
4. Never invent numbers or estimate without an explicit disclaimer

## Current dashboard context
{dashboardContext}

Respond precisely, action-oriented, and reference specific numbers from the context.
Reply in the same language the user writes in.
Unknown fields in the context are new features or segments — interpret them sensibly.
```

`{cachedAt}` and `{dashboardContext}` are replaced at runtime —
extract `cachedAt` from `dashboardContext.miBaseline.cachedAt`,
insert `dashboardContext` as `json.dumps(dashboardContext, ensure_ascii=False, indent=2)`.

**SSE format:**
```
data: <token>\n\n
data: [DONE]\n\n
```

**Complete file structure:**
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
    # Build system prompt
    # Streaming generator
    # Return StreamingResponse with media_type="text/event-stream"
    ...
```

---

## Step 3 — Register router in `backend/main.py`

```python
from routers.chat import router as chat_router
app.include_router(chat_router)
```

Check CORS: `http://localhost:5173` must be in `allow_origins` (likely already the case for other endpoints).

---

## Step 4 — `getDashboardSnapshot()` in `frontend/src/context/DashboardContext.jsx`

Add a new exported function — reads the current state and returns a compact snapshot. No hardcoding of individual fields — always pass complete state objects so new segments/KPIs are captured automatically:

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

Adjust the exact state field names to match the actual structure in `DashboardContext.jsx` — field names may differ.

---

## Step 5 — Create `frontend/src/components/ChatDrawer.jsx` (new)

### Layout & Design

- **Floating button:** `position: fixed`, bottom right (24px margin), round (48px),
  `background: #2D2A5E` (--navy), icon: chat symbol in `#7B6FE8` (--violet)
- **Drawer:** `position: fixed`, right 0, top 0, `width: 400px`, full height,
  `background: #EDE8E0` (--bg), `z-index: 1000`, box shadow on left
- **Header:** `background: #2D2A5E`, white text, "✦ Mapp Analyst" + close button
- **Message bubbles:**
  - User: right-aligned, `background: #2D2A5E`, white text, `border-radius: 12px 12px 2px 12px`
  - Assistant: left-aligned, `background: white`, dark text, `border-radius: 12px 12px 12px 2px`, subtle border
- **Input row:** textarea (1–3 lines auto-resize) + send button in `--violet`
- **Starter chips:** appear when `messages.length === 0`, disappear after first send

### Starter chips — tab-sensitive

```js
const STARTER_CHIPS = {
  "Live Stream": [
    "What are the top categories doing right now?",
    "Are there any notable return-risk events?",
    "Which segment is most active today?",
  ],
  "MI Baseline": [
    "Which category has the highest return risk?",
    "What do you recommend to reduce outerwear returns?",
    "Which product has the best conversion?",
  ],
  "Forecast": [
    "Will we hit the forecast today?",
    "What is the biggest risk position?",
    "What should I do now to secure the target?",
  ],
  "Historical": [
    "What do the historical data show right now?",
    "Are there any notable trends?",
  ],
  "E-Commerce": [
    "How is the E-Commerce tab performing right now?",
    "Which products should I push?",
  ],
}

// Fallback if tab not found:
const chips = STARTER_CHIPS[currentTab] ?? [
  "What are the most important metrics right now?",
  "Where do you see the biggest risk?",
  "What do you recommend as a next step?",
]
```

Get `currentTab` from DashboardContext.

### Streaming logic

```js
async function sendMessage(userText) {
  // 1. Append user message to messages state
  // 2. Append empty assistant message (to be filled)
  // 3. Call getDashboardSnapshot(state) for current context
  // 4. fetch("http://localhost:8000/api/chat", { method: "POST", body: JSON.stringify({
  //      messages: [...conversationHistory],
  //      dashboardContext: snapshot
  //    })})
  // 5. Read response.body as ReadableStream
  // 6. Parse each SSE chunk, catch [DONE]
  // 7. Append token to last assistant message (setState)
  // 8. Auto-scroll to last message
}
```

### State (local — no global state needed)

```js
const [isOpen, setIsOpen] = useState(false)
const [messages, setMessages] = useState([])   // { role, content }
const [input, setInput] = useState("")
const [isStreaming, setIsStreaming] = useState(false)
```

### Keyboard shortcut

`Enter` sends, `Shift+Enter` inserts a line break in the textarea.

---

## Step 6 — Wire into `frontend/src/App.jsx`

```jsx
import ChatDrawer from './components/ChatDrawer'

// Directly before the closing tag of the root div:
<ChatDrawer />
```

---

## Expected result

- Floating button appears on all tabs
- Click opens/closes the drawer
- Tab-sensitive starter chips when chat is empty
- Questions are answered with current dashboard context
- Streaming responses appear token by token
- For questions outside the available time range: honest answer + alternative

---

## Out of scope for this task

- Chat history persistence (localStorage) → separate backlog item
- Tool use / direct MI API queries from chat → Phase 4+
- Adjusting baseline data depth → decide after first test
