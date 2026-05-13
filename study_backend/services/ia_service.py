"""
services/ia_service.py — Prompt builder et générateurs de streaming Ollama.
"""
import json
from typing import AsyncGenerator
import httpx
from config import OLLAMA_URL, OLLAMA_MODEL


# ── Prompt Builder ────────────────────────────────────────────────────────────

def build_ia_prompt(
    mode: str,
    text: str,
    subject: str = "",
    user_answer: str = "",
    language: str = "fr",
    wrong_topics: str = "",
) -> str:
    """Construit le prompt Ollama adapté au mode et à la langue demandée."""
    lang = (language or "fr").lower()
    if lang not in ("fr", "en", "ar"):
        lang = "fr"

    if mode == "resume":
        if lang == "en":
            return (
                f"You are an expert teacher in {subject}. "
                f"Create a clear, structured and concise summary of the following text. "
                f"Use headings, bullet points and key takeaways. "
                f"Respond only in ENGLISH.\n\nText:\n{text}"
            )
        if lang == "ar":
            return (
                f"أنت معلم خبير في {subject}. "
                f"قدم ملخصًا واضحًا ومنظمًا ومختصرًا للنص التالي. "
                f"استخدم عناوين ونقاطًا رئيسية. "
                f"أجب باللغة العربية فقط.\n\nالنص:\n{text}"
            )
        return (
            f"Tu es un professeur expert en {subject}. "
            f"Fais un résumé clair, structuré et concis du texte suivant. "
            f"Utilise des titres, des puces et des points clés. "
            f"Réponds uniquement en français.\n\nTexte:\n{text}"
        )

    if mode == "qcm":
        if lang == "en":
            return (
                f"You are an expert quiz creator. Generate exactly 5 multiple choice questions based on the following text. "
                f"Each question must have exactly 4 options and one correct answer. "
                f"Respond ONLY with valid JSON, no extra text, in this exact format:\n"
                f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n'
                f"Text:\n{text}"
            )
        if lang == "ar":
            return (
                f"أنت خبير في إنشاء الاختبارات. أنشئ 5 أسئلة اختيار من متعدد استنادًا إلى النص التالي. "
                f"يجب أن تحتوي كل سؤال على 4 خيارات وإجابة صحيحة واحدة. "
                f"أجب فقط بصيغة JSON صحيحة، بدون نص إضافي.\n"
                f'[{{"question":"...","choices":["الخيار أ","الخيار ب","الخيار ج","الخيار د"],"correct":0}}]\n'
                f"النص:\n{text}"
            )
        return (
            f"Tu es un professeur. Génère exactement 5 questions QCM basées sur le texte suivant. "
            f"Chaque question doit avoir exactement 4 choix et une seule bonne réponse. "
            f"Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni apres, dans ce format exact:\n"
            f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n'
            f"Texte:\n{text}"
        )

    if mode == "qcm_remedial":
        topics = (wrong_topics or "").strip() or "les notions mal comprises"
        if lang == "en":
            return (
                f"You are an expert teacher. The learner struggled with these items:\n{topics}\n\n"
                f"Generate exactly 3 clear multiple-choice questions in ENGLISH based on the reference text below. "
                f'Each question must have exactly 4 options and one correct answer (index 0-3 in field "correct"). '
                f"Respond ONLY with a JSON array, no markdown, no extra text, in this exact shape:\n"
                f'[{{"question":"...","choices":["A","B","C","D"],"correct":0}}]\n\n'
                f"Reference text:\n{text}"
            )
        if lang == "ar":
            return (
                f"أنت معلم خبير. واجه المتعلم صعوبات في:\n{topics}\n\n"
                f"أنشئ بالضبط 3 أسئلة اختيار من متعدد واضحة بالعربية من النص المرجعي. "
                f"لكل سؤال 4 خيارات وإجابة صحيحة واحدة (حقل correct من 0 إلى 3). "
                f"أجب فقط بمصفوفة JSON بدون markdown:\n"
                f'[{{"question":"...","choices":["أ","ب","ج","د"],"correct":0}}]\n\n'
                f"النص:\n{text}"
            )
        return (
            f"Tu es un professeur expert. L'apprenant a eu des difficultés sur les sujets suivants :\n{topics}\n\n"
            f"Génère exactement 3 questions QCM SIMPLES en FRANÇAIS, basées sur le texte de référence ci-dessous, "
            f"pour consolider ces notions. Chaque question : exactement 4 choix, une seule bonne réponse "
            f'(champ "correct" = 0 à 3). '
            f"Réponds UNIQUEMENT avec un tableau JSON (commence par [ et finit par ]), sans markdown, sans texte avant ou après :\n"
            f'[{{"question":"...","choices":["Option A","Option B","Option C","Option D"],"correct":0}}]\n\n'
            f"Texte de référence :\n{text}"
        )

    if mode == "qr_question":
        if lang == "en":
            return (
                f"You are an expert teacher. Ask ONE single meaningful question based on the following text "
                f"to test the learner's understanding. "
                f"Ask only the question, nothing else.\n\nText:\n{text}"
            )
        if lang == "ar":
            return (
                f"أنت معلم خبير. اطرح سؤالًا واحدًا فقط بناءً على النص التالي لاختبار فهم الطالب. "
                f"اطرح السؤال فقط، دون أي نص إضافي.\n\nالنص:\n{text}"
            )
        return (
            f"Tu es un professeur. Pose UNE seule question pertinente basée sur le texte suivant "
            f"pour tester la compréhension de l'étudiant. "
            f"Pose uniquement la question, rien d'autre.\n\nTexte:\n{text}"
        )

    if mode == "qr_correct":
        if lang == "en":
            return (
                f"You are a kind expert teacher. Here is the reference text:\n{text}\n\n"
                f"Student answer: {user_answer}\n\n"
                f"Evaluate the answer. Say if it is correct or incorrect, explain why, and stay encouraging. "
                f"Respond only in ENGLISH."
            )
        if lang == "ar":
            return (
                f"أنت معلم خبير وودود. إليك النص المرجعي:\n{text}\n\n"
                f"إجابة الطالب: {user_answer}\n\n"
                f"قيم الإجابة. قل إذا كانت صحيحة أم خاطئة واشرح لماذا. كن مشجعًا. "
                f"أجب باللغة العربية فقط."
            )
        return (
            f"Tu es un professeur bienveillant. Voici le contexte:\n\n"
            f"Texte de référence:\n{text}\n\n"
            f"Réponse de l'étudiant : {user_answer}\n\n"
            f"Évalue la réponse. Dis si c'est correct ou incorrect, explique pourquoi. "
            f"Sois encourageant. Réponds uniquement en français."
        )

    return text


# ── Streaming helpers ─────────────────────────────────────────────────────────

async def stream_ollama_response(
    prompt: str, is_json: bool = False
) -> AsyncGenerator[str, None]:
    """Stream depuis Ollama sans mise en cache (chat, correction Q/R, etc.)."""
    payload: dict = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.4,
            "num_predict": 1200,
            "top_k": 20,
            "top_p": 0.9,
            "num_ctx": 3000,
            "num_thread": 3,
        },
    }
    if is_json:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as response:
            full_text = ""
            async for chunk in response.aiter_lines():
                line = str(chunk)
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = str(data.get("response", ""))
                        full_text += token
                        done = bool(data.get("done", False))
                        yield f"data: {json.dumps({'token': token, 'done': done})}\n\n"
                        if done:
                            yield f"data: {json.dumps({'token': '', 'done': True, 'full_text': full_text})}\n\n"
                            break
                    except json.JSONDecodeError:
                        continue


async def stream_ollama_and_cache(
    prompt: str,
    is_json: bool,
    user_id: int,
    input_hash: str,
    mode: str,
    subject: str,
    input_text: str,
) -> AsyncGenerator[str, None]:
    """Stream depuis Ollama et sauvegarde la réponse complète dans IaCache."""
    from sqlite_models import IaCache, SessionLocal as SqliteSession

    full_text = ""
    payload: dict = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": 0.7,
            "num_predict": 2048,
            "top_k": 40,
            "top_p": 0.9,
            "num_ctx": 4096,
        },
    }
    if is_json:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("POST", OLLAMA_URL, json=payload) as response:
            async for chunk in response.aiter_lines():
                line = str(chunk)
                if line.strip():
                    try:
                        data = json.loads(line)
                        token = str(data.get("response", ""))
                        full_text += token
                        done = bool(data.get("done", False))
                        yield f"data: {json.dumps({'token': token, 'done': done})}\n\n"
                        if done:
                            yield f"data: {json.dumps({'token': '', 'done': True, 'full_text': full_text})}\n\n"
                            break
                    except json.JSONDecodeError:
                        continue

    # Persistance du cache après la fin du streaming
    if full_text.strip():
        try:
            db = SqliteSession()
            cache_entry = IaCache(
                user_id=user_id,
                input_hash=input_hash,
                mode=mode,
                subject=subject or "",
                input_text=input_text[:2000],
                response=full_text,
            )
            db.add(cache_entry)
            db.commit()
            db.close()
        except Exception as e:
            print(f"⚠️ Cache save error: {e}")
