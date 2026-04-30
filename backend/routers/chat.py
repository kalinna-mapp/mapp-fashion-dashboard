from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import openai
import json
from typing import List
from config import settings

router = APIRouter(prefix="/api", tags=["chat"])

SYSTEM_PROMPT_TEMPLATE = """\
Du bist ein eingebetteter Analyst im Mapp Fashion Live Analytics Dashboard.
Deine Aufgabe ist es, dem User zu helfen die aktuellen Zahlen zu verstehen
und konkrete Next-Best-Actions zu empfehlen.

## Verfügbare Daten
- Live-Stream: Echtzeit-Events der aktuellen Session (letzte 20 Events im Kontext)
- MI Baseline: Aggregierte Produkt-, Kategorie- und Occasion-Daten der letzten 28 Tage
- Forecast: Projektion auf Basis der aktuellen Session
- Datenstand der Baseline: {cachedAt}

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
Unbekannte Felder im Kontext sind neue Features oder Segmente — interpretiere sie sinnvoll.\
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    dashboardContext: dict


def _build_billing(feature: str) -> dict:
    """Internal billing params — no customer context for this dev dashboard."""
    user = f"internal:{settings.app_product}:{settings.app_name}:{feature}"
    return {
        "user": user,
        "extra_body": {
            "metadata": {
                "user": user,
                "spend_logs_metadata": {
                    "app": settings.app_name,
                    "environment": "development",
                    "feature": feature,
                    "user": user,
                },
            },
        },
    }


@router.post("/chat")
async def chat(request: ChatRequest):
    cached_at = (
        request.dashboardContext
        .get("miBaseline", {})
        .get("cachedAt", "nicht verfügbar")
    )
    context_json = json.dumps(request.dashboardContext, ensure_ascii=False, indent=2)

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        cachedAt=cached_at,
        dashboardContext=context_json,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    billing = _build_billing("chat-analyst")

    def generate():
        client = openai.OpenAI(
            api_key=settings.litellm_api_key,
            base_url=settings.litellm_base_url,
        )
        stream = client.chat.completions.create(
            model="anthropic/claude-sonnet-4-6",
            max_tokens=1024,
            messages=messages,
            stream=True,
            **billing,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield f"data: {json.dumps(delta)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
