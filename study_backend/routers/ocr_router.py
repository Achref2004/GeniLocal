"""
routers/ocr_router.py — Upload de fichiers et extraction OCR + parsing calendrier.
"""
import os
import json
import re as _re
import tempfile
from datetime import datetime as _dt

from fastapi import APIRouter, File, UploadFile
import httpx

from config import OLLAMA_URL, OLLAMA_MODEL

router = APIRouter(prefix="/api/ocr", tags=["OCR"])


# ── Helpers internes ──────────────────────────────────────────────────────────

async def _run_ocr(tmp_path: str, filename: str) -> str:
    """Exécute l'OCR sur le fichier temporaire et retourne le texte brut."""
    try:
        from ocr_hybrid import process_document
        result = process_document(tmp_path, languages=["fr", "en"], verbose=False)
        return result.full_text or ""
    except ImportError:
        return f"[OCR module not available] File received: {filename}"
    except Exception as e:
        return f"[OCR Error] {str(e)}"


def _parse_events_with_regex(raw_text: str) -> list[dict]:
    """
    Tente d'extraire des événements de calendrier depuis le texte OCR
    via des expressions régulières sur les dates et horaires.
    """
    current_year = _dt.now().year
    events: list[dict] = []

    date_pattern = _re.compile(
        r'(?:(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+)?'
        r'(\d{1,2})\s*[/\-\.]\s*(\d{1,2})\s*[/\-\.]\s*(\d{2,4})',
        _re.IGNORECASE,
    )
    time_pattern = _re.compile(r'\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}')

    date_matches = list(date_pattern.finditer(raw_text))
    if not date_matches:
        return events

    print(f"[OCR] Found {len(date_matches)} dates via regex")

    for i, match in enumerate(date_matches):
        day = match.group(1).zfill(2)
        month = match.group(2).zfill(2)
        year_str = match.group(3)
        year = year_str if len(year_str) == 4 else str(current_year)
        date_iso = f"{year}-{month}-{day}"

        try:
            _dt.strptime(date_iso, "%Y-%m-%d")
        except ValueError:
            continue

        start_pos = match.end()
        end_pos = date_matches[i + 1].start() if i + 1 < len(date_matches) else len(raw_text)
        section_text = raw_text[start_pos:end_pos]

        times_found = time_pattern.findall(section_text)
        cleaned = section_text
        for t in times_found:
            cleaned = cleaned.replace(t, " ")

        parts = _re.split(r'[\n\r\t|]+', cleaned)
        course_names = []
        for part in parts:
            part = part.strip()
            if not part or len(part) < 3:
                continue
            if _re.match(r'^[\s\-\u2013\u2014.]+$', part):
                continue
            if _re.match(r'^\d{1,2}:\d{2}', part):
                continue
            if part in ["-", "--"]:
                continue
            course_names.append(part)

        time_idx = 0
        for course_raw in course_names:
            prof_match = _re.search(
                r'[(\n]\s*((?:Mr|Mme|Prof|Dr)\.?\s+.+?)(?:\)|$)',
                course_raw,
                _re.IGNORECASE,
            )
            if prof_match:
                subject = course_raw[: prof_match.start()].strip().rstrip("(").strip()
                prof = prof_match.group(1).strip()
                title = f"{subject} - {prof}"
            else:
                lines = [ln.strip() for ln in course_raw.split("\n") if ln.strip()]
                if len(lines) >= 2 and _re.match(r'^(?:Mr|Mme|Prof|Dr)\b', lines[-1], _re.IGNORECASE):
                    subject = " ".join(lines[:-1])
                    title = f"{subject} - {lines[-1]}"
                else:
                    subject = course_raw.strip()
                    title = subject

            subject = _re.sub(r'\s+', ' ', subject).strip()
            title   = _re.sub(r'\s+', ' ', title).strip()

            if not subject or len(subject) < 2:
                continue

            time_slot = times_found[time_idx] if time_idx < len(times_found) else ""
            time_idx += 1

            events.append({
                "title":    title,
                "date":     date_iso,
                "subject":  subject,
                "time":     time_slot,
                "category": "etude",
            })

    print(f"[OCR] Regex extracted {len(events)} events")
    return events


async def _parse_events_with_ai(raw_text: str) -> list[dict]:
    """Fallback Ollama pour extraire les événements si le regex n'en trouve aucun."""
    current_year = _dt.now().year
    events: list[dict] = []

    print("[OCR] No dates found via regex, falling back to Ollama AI...")
    try:
        parse_prompt = (
            "Extrait les cours de cet emploi du temps. "
            'Retourne un JSON: {"events": [{"title": "...", "date": "YYYY-MM-DD", '
            '"subject": "...", "time": "", "category": "etude"}]}. '
            f"Si l'annee manque, utilise {current_year}. "
            "Convertis les dates jj/mm/aaaa ou jj-mm-aaaa en YYYY-MM-DD. "
            f"Texte:\n{raw_text[:4000]}\nJSON:"
        )

        async with httpx.AsyncClient(timeout=90.0) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": parse_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.1, "num_predict": 2048},
                },
            )

            if resp.status_code == 200:
                data = resp.json()
                response_text = data.get("response", "")
                try:
                    parsed = json.loads(response_text)
                    if isinstance(parsed, list):
                        events = parsed
                    elif isinstance(parsed, dict) and "events" in parsed:
                        events = parsed["events"]
                except json.JSONDecodeError:
                    pass

                for ev in events:
                    date_str = str(ev.get("date", "")).strip()
                    if date_str:
                        for fmt_in, fmt_out in [
                            (
                                r'^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$',
                                lambda m: f"{m.group(3)}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}",
                            ),
                            (
                                r'^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$',
                                lambda m: f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}",
                            ),
                            (
                                r'^(\d{1,2})[/\-.](\d{1,2})$',
                                lambda m: f"{current_year}-{m.group(2).zfill(2)}-{m.group(1).zfill(2)}",
                            ),
                        ]:
                            m = _re.match(fmt_in, date_str)
                            if m:
                                ev["date"] = fmt_out(m)
                                break

                    if not _re.match(r'^\d{4}-\d{2}-\d{2}$', str(ev.get("date", ""))):
                        ev["date"] = ""

                    if not ev.get("subject") and ev.get("title"):
                        ev["subject"] = ev["title"]

    except Exception as parse_err:
        print(f"[OCR] AI parsing error: {parse_err}")

    return events


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/schedule")
async def ocr_schedule(file: UploadFile = File(...)):
    """
    Reçoit un fichier (PDF, image, DOCX), lance l'OCR,
    puis parse le texte en événements de calendrier (regex → fallback IA).
    """
    suffix = os.path.splitext(file.filename or "upload")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        raw_text = await _run_ocr(tmp_path, file.filename or "upload")

        if not raw_text.strip():
            return {"events": [], "raw_text": "Aucun texte detecte dans le document."}

        events = _parse_events_with_regex(raw_text)

        if not events:
            events = await _parse_events_with_ai(raw_text)

        return {"events": events, "raw_text": raw_text[:5000]}

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@router.post("/extract-text")
async def ocr_extract_text(file: UploadFile = File(...)):
    """
    Reçoit un fichier, lance l'OCR, puis utilise Ollama pour corriger
    le texte brut reconnu. Utilisé par la page Raisonnement.
    """
    suffix = os.path.splitext(file.filename or "upload")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        raw_text = await _run_ocr(tmp_path, file.filename or "upload")

        if not raw_text.strip():
            return {"raw_text": "", "cleaned_text": "", "error": "Aucun texte detecte dans le document."}

        cleaned_text = raw_text  # fallback si Ollama indisponible
        try:
            clean_prompt = (
                "Tu es un assistant specialise dans la correction de texte extrait par OCR. "
                "Le texte suivant a ete extrait automatiquement d'un document (PDF, image ou Word). "
                "Il peut contenir des erreurs d'OCR, des caracteres mal reconnus, ou un formatage casse. "
                "Corrige les erreurs evidentes, ameliore la mise en forme, "
                "et retourne le texte nettoye et bien structure. "
                "Garde le contenu original intact - ne resume PAS, ne supprime PAS d'information. "
                "Corrige seulement les erreurs de reconnaissance. "
                "Reponds UNIQUEMENT avec le texte corrige, sans commentaire.\n\n"
                f"Texte brut extrait par OCR:\n{raw_text[:4000]}"
            )

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    OLLAMA_URL,
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": clean_prompt,
                        "stream": False,
                        "options": {"temperature": 0.2, "num_predict": 4096},
                    },
                )
                if resp.status_code == 200:
                    response_text = resp.json().get("response", "")
                    if response_text.strip():
                        cleaned_text = response_text.strip()
        except Exception:
            pass  # Ollama non disponible — on garde le texte brut

        return {
            "raw_text":     raw_text[:8000],
            "cleaned_text": cleaned_text[:8000],
            "filename":     file.filename,
        }

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
