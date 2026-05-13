"""
routers/ia_router.py — Génération IA avec cache (Ollama/Mistral) + health check.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

import auth, models
from database import get_db
from services.ia_service import build_ia_prompt, stream_ollama_response, stream_ollama_and_cache
import httpx

router = APIRouter(tags=["IA"])


@router.post("/api/generate")
async def ia_generate(request: Request, db: Session = Depends(get_db)):
    from sqlite_models import IaCache, SessionLocal as SqliteSession

    body = await request.json()
    mode         = body.get("mode", "resume")
    text         = body.get("text", "")
    subject      = body.get("subject", "")
    user_answer  = body.get("user_answer", "")
    language     = body.get("language", "fr")
    wrong_topics = body.get("wrongTopics") or body.get("wrong_topics") or ""

    cacheable_modes = ("resume", "qcm", "qr_question", "qcm_remedial")
    user_id = None

    # Extraction de l'utilisateur depuis le token Bearer
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ", 1)[1]
            payload = auth.verify_token(token)
            email = payload.get("sub")
            if email:
                user = db.query(models.User).filter(models.User.email == email).first()
                if user:
                    user_id = user.id
        except Exception:
            pass

    cache_extra = wrong_topics.strip() if mode == "qcm_remedial" else ""

    # ── Cache lookup ──────────────────────────────────────────────────────────
    if user_id and mode in cacheable_modes and not user_answer:
        sqlite_db = SqliteSession()
        input_hash = IaCache.compute_hash(text, mode, subject, language, cache_extra)
        try:
            cached = sqlite_db.query(IaCache).filter(
                IaCache.user_id  == user_id,
                IaCache.input_hash == input_hash,
                IaCache.mode     == mode,
            ).first()

            if cached:
                sqlite_db.close()
                return JSONResponse(content={
                    "cached":    True,
                    "full_text": cached.response,
                    "mode":      cached.mode,
                    "subject":   cached.subject or "",
                })
        finally:
            sqlite_db.close()

    # ── Cache miss — streaming Ollama ─────────────────────────────────────────
    prompt  = build_ia_prompt(mode, text, subject, user_answer, language, wrong_topics)
    is_json = False
    sse_headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }

    if user_id and mode in cacheable_modes and not user_answer:
        input_hash = IaCache.compute_hash(text, mode, subject, language, cache_extra)
        return StreamingResponse(
            stream_ollama_and_cache(prompt, is_json, user_id, input_hash, mode, subject, text),
            media_type="text/event-stream",
            headers=sse_headers,
        )

    return StreamingResponse(
        stream_ollama_response(prompt, is_json),
        media_type="text/event-stream",
        headers=sse_headers,
    )


@router.get("/api/health")
async def ia_health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("http://localhost:11434/api/tags")
            models_list = resp.json().get("models", [])
            return {"status": "ok", "ollama": True, "models": [m["name"] for m in models_list]}
    except Exception:
        return {"status": "ok", "ollama": False, "models": []}
