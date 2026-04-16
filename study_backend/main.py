# ══════════════════════════════════════════════════════════════
# MODULE DATA PERSISTENCE — SQLite + Redis Cache
# ══════════════════════════════════════════════════════════════

# ─── IA HISTORY ENDPOINTS ───

@app.post("/api/ia-history")
async def save_ia_history(
    data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """
    Save AI-generated content to SQLite
    Expected: {mode, input_text, subject, result, question?, user_answer?, correction?, metadata?}
    """
    from sqlite_models import IaHistory, SessionLocal

    try:
        db_sqlite = SessionLocal()

        new_entry = IaHistory(
            user_id=current_user.id,
            timestamp=datetime.utcnow(),
            mode=data.get("mode", ""),
            input_text=data.get("input_text", ""),
            subject=data.get("subject", ""),
            result=data.get("result", ""),
            question=data.get("question"),
            user_answer=data.get("user_answer"),
            correction=data.get("correction"),
            metadata=data.get("metadata", {})
        )

        db_sqlite.add(new_entry)
        db_sqlite.commit()
        db_sqlite.refresh(new_entry)

        # Cache the response in Redis
        if cache_manager:
            cache_manager.set_ia_response(
                data.get("input_text", ""),
                data.get("subject", ""),
                data.get("mode", ""),
                data.get("result", "")
            )

        logger.info(f"✅ IA history saved for user {current_user.id}: {data.get('mode')}")

        return {
            "id": new_entry.id,
            "timestamp": new_entry.timestamp.isoformat(),
            "status": "saved"
        }

    except Exception as e:
        logger.error(f"❌ Error saving IA history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/ia-history")
async def get_ia_history(
    mode: str = None,
    subject: str = None,
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve IA history for current user
    Optional filters: mode, subject
    """
    from sqlite_models import IaHistory, SessionLocal

    try:
        db_sqlite = SessionLocal()
        query = db_sqlite.query(IaHistory).filter(IaHistory.user_id == current_user.id)

        if mode:
            query = query.filter(IaHistory.mode == mode)
        if subject:
            query = query.filter(IaHistory.subject == subject)

        items = query.order_by(IaHistory.timestamp.desc()).offset(offset).limit(limit).all()
        total = db_sqlite.query(IaHistory).filter(IaHistory.user_id == current_user.id).count()

        return {
            "items": [
                {
                    "id": item.id,
                    "timestamp": item.timestamp.isoformat(),
                    "mode": item.mode,
                    "subject": item.subject,
                    "input_text": item.input_text[:100] + "..." if len(item.input_text) > 100 else item.input_text,
                    "result": item.result[:200] + "..." if len(item.result) > 200 else item.result,
                }
                for item in items
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving IA history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/ia-history/{history_id}")
async def get_ia_history_detail(
    history_id: int,
    current_user: models.User = Depends(get_current_user)
):
    """Get full details of a specific IA history entry"""
    from sqlite_models import IaHistory, SessionLocal

    try:
        db_sqlite = SessionLocal()
        item = db_sqlite.query(IaHistory).filter(
            IaHistory.id == history_id,
            IaHistory.user_id == current_user.id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="History item not found")

        return {
            "id": item.id,
            "timestamp": item.timestamp.isoformat(),
            "mode": item.mode,
            "subject": item.subject,
            "input_text": item.input_text,
            "result": item.result,
            "question": item.question,
            "user_answer": item.user_answer,
            "correction": item.correction,
            "metadata": item.metadata
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving history detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.delete("/api/ia-history/{history_id}")
async def delete_ia_history(
    history_id: int,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a specific IA history entry"""
    from sqlite_models import IaHistory, SessionLocal

    try:
        db_sqlite = SessionLocal()
        item = db_sqlite.query(IaHistory).filter(
            IaHistory.id == history_id,
            IaHistory.user_id == current_user.id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="History item not found")

        db_sqlite.delete(item)
        db_sqlite.commit()

        logger.info(f"✅ Deleted IA history {history_id} for user {current_user.id}")

        return {"status": "deleted", "id": history_id}

    except Exception as e:
        logger.error(f"❌ Error deleting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


# ─── AVATAR ENDPOINTS ───

@app.get("/api/avatar")
async def get_avatar(current_user: models.User = Depends(get_current_user)):
    """Get user's avatar configuration"""
    from sqlite_models import AvatarConfig, SessionLocal

    try:
        db_sqlite = SessionLocal()
        config = db_sqlite.query(AvatarConfig).filter(
            AvatarConfig.user_id == current_user.id
        ).first()

        if not config:
            return {"status": "no_config"}

        return {
            "status": "found",
            "config": config.config,
            "updated_at": config.updated_at.isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Error getting avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.put("/api/avatar")
async def save_avatar(
    avatar_data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Save or update user's avatar configuration"""
    from sqlite_models import AvatarConfig, SessionLocal

    try:
        db_sqlite = SessionLocal()

        config = db_sqlite.query(AvatarConfig).filter(
            AvatarConfig.user_id == current_user.id
        ).first()

        if not config:
            config = AvatarConfig(
                user_id=current_user.id,
                config=avatar_data
            )
            db_sqlite.add(config)
        else:
            config.config = avatar_data
            config.updated_at = datetime.utcnow()

        db_sqlite.commit()

        logger.info(f"✅ Avatar saved for user {current_user.id}")

        return {
            "status": "saved",
            "config": config.config,
            "updated_at": config.updated_at.isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Error saving avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


# ─── CHAT PERSISTENCE ENDPOINTS ───

@app.post("/api/chat/messages")
async def save_chat_message(
    data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Save a chat message to persistent storage"""
    from sqlite_models import ChatMessage, SessionLocal

    try:
        db_sqlite = SessionLocal()

        msg = ChatMessage(
            user_id=current_user.id,
            session_id=data.get("session_id", str(uuid.uuid4())),
            timestamp=datetime.utcnow(),
            role=data.get("role", "user"),
            content=data.get("content", "")
        )

        db_sqlite.add(msg)
        db_sqlite.commit()
        db_sqlite.refresh(msg)

        logger.info(f"✅ Chat message saved for user {current_user.id}")

        return {
            "id": msg.id,
            "timestamp": msg.timestamp.isoformat(),
            "status": "saved"
        }

    except Exception as e:
        logger.error(f"❌ Error saving chat message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/chat/messages")
async def get_chat_messages(
    session_id: str = None,
    limit: int = 50,
    offset: int = 0,
    current_user: models.User = Depends(get_current_user)
):
    """Get chat messages for current user"""
    from sqlite_models import ChatMessage, SessionLocal

    try:
        db_sqlite = SessionLocal()
        query = db_sqlite.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)

        if session_id:
            query = query.filter(ChatMessage.session_id == session_id)

        messages = query.order_by(ChatMessage.timestamp.asc()).offset(offset).limit(limit).all()
        total = db_sqlite.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).count()

        return {
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "session_id": msg.session_id
                }
                for msg in messages
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving chat messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.post("/api/chat/sessions")
async def create_chat_session(current_user: models.User = Depends(get_current_user)):
    """Create a new chat session"""
    session_id = str(uuid.uuid4())

    return {
        "session_id": session_id,
        "status": "created",
        "created_at": datetime.utcnow().isoformat()
    }


@app.get("/api/chat/sessions")
async def get_chat_sessions(
    limit: int = 10,
    current_user: models.User = Depends(get_current_user)
):
    """Get list of recent chat sessions for current user"""
    from sqlite_models import ChatMessage, SessionLocal

    try:
        db_sqlite = SessionLocal()

        # Get unique sessions
        sessions = db_sqlite.query(ChatMessage.session_id).filter(
            ChatMessage.user_id == current_user.id
        ).distinct().order_by(ChatMessage.timestamp.desc()).limit(limit).all()

        return {
            "sessions": [{"session_id": s[0]} for s in sessions],
            "total": len(sessions)
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving chat sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


# ─── PROGRESSION STATS ENDPOINTS ───

@app.get("/api/progression/stats")
async def get_progression_stats(current_user: models.User = Depends(get_current_user)):
    """Get aggregated progression statistics for current user"""
    from sqlite_models import UserProgression, SessionLocal, IaHistory

    try:
        db_sqlite = SessionLocal()

        # Check Redis cache first
        if cache_manager:
            cached_stats = cache_manager.get_progression_stats(current_user.id)
            if cached_stats:
                return cached_stats

        # Get or create progression record
        prog = db_sqlite.query(UserProgression).filter(
            UserProgression.user_id == current_user.id
        ).first()

        if not prog:
            prog = UserProgression(user_id=current_user.id, subjects={})
            db_sqlite.add(prog)
            db_sqlite.commit()

        # Calculate stats from history
        history = db_sqlite.query(IaHistory).filter(
            IaHistory.user_id == current_user.id
        ).all()

        stats = {
            "user_id": current_user.id,
            "qcm_before": 0,
            "qcm_after": 0,
            "qr_score": 0,
            "resume_count": len([h for h in history if h.mode == "resume"]),
            "qcm_count": len([h for h in history if h.mode in ["qcm", "qcm_remedial"]]),
            "qr_count": len([h for h in history if h.mode == "qr"]),
            "chat_count": len([h for h in history if h.mode == "chat"]),
            "subjects": {},
            "last_activity": prog.last_activity.isoformat() if prog.last_activity else None,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Group by subject
        for h in history:
            if h.subject:
                if h.subject not in stats["subjects"]:
                    stats["subjects"][h.subject] = {"count": 0, "modes": []}
                stats["subjects"][h.subject]["count"] += 1
                stats["subjects"][h.subject]["modes"].append(h.mode)

        # Cache the stats
        if cache_manager:
            cache_manager.set_progression_stats(current_user.id, stats)

        return stats

    except Exception as e:
        logger.error(f"❌ Error getting progression stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


# ─── PLANNING ENDPOINTS ───

@app.post("/api/planning/items")
async def save_planning_item(
    data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Save a planning item (note or event)"""
    from sqlite_models import PlanningItem, SessionLocal

    try:
        db_sqlite = SessionLocal()

        item = PlanningItem(
            id=data.get("id", str(uuid.uuid4())),
            user_id=current_user.id,
            date=data.get("date", ""),
            item_type=data.get("type", "note"),
            title=data.get("title", ""),
            content=data.get("content", ""),
            category=data.get("category", "etude"),
            source=data.get("source", "manual"),
            checked=data.get("checked", False),
            created_at=datetime.utcnow()
        )

        db_sqlite.add(item)
        db_sqlite.commit()

        logger.info(f"✅ Planning item saved for user {current_user.id}")

        return {
            "id": item.id,
            "status": "saved",
            "created_at": item.created_at.isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Error saving planning item: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/planning/items")
async def get_planning_items(
    date: str = None,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user)
):
    """Get planning items for current user"""
    from sqlite_models import PlanningItem, SessionLocal

    try:
        db_sqlite = SessionLocal()
        query = db_sqlite.query(PlanningItem).filter(PlanningItem.user_id == current_user.id)

        if date:
            query = query.filter(PlanningItem.date == date)

        items = query.order_by(PlanningItem.created_at.desc()).limit(limit).all()

        return {
            "items": [
                {
                    "id": item.id,
                    "date": item.date,
                    "type": item.item_type,
                    "title": item.title,
                    "content": item.content,
                    "category": item.category,
                    "source": item.source,
                    "checked": item.checked,
                    "created_at": item.created_at.isoformat()
                }
                for item in items
            ]
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving planning items: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.put("/api/planning/items/{item_id}")
async def update_planning_item(
    item_id: str,
    data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Update a planning item"""
    from sqlite_models import PlanningItem, SessionLocal

    try:
        db_sqlite = SessionLocal()
        item = db_sqlite.query(PlanningItem).filter(
            PlanningItem.id == item_id,
            PlanningItem.user_id == current_user.id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Planning item not found")

        for key, value in data.items():
            if key in ["title", "content", "category", "checked", "date"]:
                setattr(item, key, value)

        db_sqlite.commit()

        logger.info(f"✅ Planning item {item_id} updated")

        return {"status": "updated", "id": item.id}

    except Exception as e:
        logger.error(f"❌ Error updating planning item: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.delete("/api/planning/items/{item_id}")
async def delete_planning_item(
    item_id: str,
    current_user: models.User = Depends(get_current_user)
):
    """Delete a planning item"""
    from sqlite_models import PlanningItem, SessionLocal

    try:
        db_sqlite = SessionLocal()
        item = db_sqlite.query(PlanningItem).filter(
            PlanningItem.id == item_id,
            PlanningItem.user_id == current_user.id
        ).first()

        if not item:
            raise HTTPException(status_code=404, detail="Planning item not found")

        db_sqlite.delete(item)
        db_sqlite.commit()

        logger.info(f"✅ Planning item {item_id} deleted")

        return {"status": "deleted", "id": item_id}

    except Exception as e:
        logger.error(f"❌ Error deleting planning item: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


# ─── EXPORT/IMPORT ENDPOINTS ───

@app.get("/api/export/backup")
async def export_backup(current_user: models.User = Depends(get_current_user)):
    """Export all user data as JSON"""
    from sqlite_models import IaHistory, ChatMessage, PlanningItem, AvatarConfig, UserProgression, SessionLocal, Backup

    try:
        db_sqlite = SessionLocal()

        # Collect all data
        ia_history = db_sqlite.query(IaHistory).filter(IaHistory.user_id == current_user.id).all()
        chat_messages = db_sqlite.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).all()
        planning_items = db_sqlite.query(PlanningItem).filter(PlanningItem.user_id == current_user.id).all()
        avatar_config = db_sqlite.query(AvatarConfig).filter(AvatarConfig.user_id == current_user.id).first()
        progression = db_sqlite.query(UserProgression).filter(UserProgression.user_id == current_user.id).first()

        backup_data = {
            "export_date": datetime.utcnow().isoformat(),
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "username": current_user.username,
                "fullname": current_user.fullname or ""
            },
            "ia_history": [
                {
                    "id": h.id,
                    "timestamp": h.timestamp.isoformat(),
                    "mode": h.mode,
                    "input_text": h.input_text,
                    "subject": h.subject,
                    "result": h.result,
                    "question": h.question,
                    "user_answer": h.user_answer,
                    "correction": h.correction,
                    "metadata": h.metadata
                }
                for h in ia_history
            ],
            "chat_messages": [
                {
                    "id": m.id,
                    "session_id": m.session_id,
                    "timestamp": m.timestamp.isoformat(),
                    "role": m.role,
                    "content": m.content
                }
                for m in chat_messages
            ],
            "planning_items": [
                {
                    "id": p.id,
                    "date": p.date,
                    "type": p.item_type,
                    "title": p.title,
                    "content": p.content,
                    "category": p.category,
                    "source": p.source,
                    "checked": p.checked,
                    "created_at": p.created_at.isoformat()
                }
                for p in planning_items
            ],
            "avatar": avatar_config.config if avatar_config else None,
            "progression": {
                "qcm_before": progression.qcm_before if progression else 0,
                "qcm_after": progression.qcm_after if progression else 0,
                "qr_score": progression.qr_score if progression else 0,
                "resume_count": progression.resume_count if progression else 0,
                "total_study_time": progression.total_study_time if progression else 0,
                "subjects": progression.subjects if progression else {}
            }
        }

        # Save backup to database
        backup_id = str(uuid.uuid4())
        backup_json = json.dumps(backup_data)

        backup = Backup(
            id=backup_id,
            user_id=current_user.id,
            filename=f"backup_{current_user.email}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
            data=backup_json,
            size=len(backup_json)
        )

        db_sqlite.add(backup)
        db_sqlite.commit()

        logger.info(f"✅ Backup created for user {current_user.id}")

        return {
            "status": "backup_created",
            "backup_id": backup_id,
            "size": len(backup_json),
            "data": backup_data
        }

    except Exception as e:
        logger.error(f"❌ Error exporting backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.post("/api/import/backup")
async def import_backup(
    data: dict,
    current_user: models.User = Depends(get_current_user)
):
    """Import backup data (Note: This overwrites existing data)"""
    from sqlite_models import IaHistory, ChatMessage, PlanningItem, AvatarConfig, UserProgression, SessionLocal

    try:
        db_sqlite = SessionLocal()

        # Clear existing data for this user (optional: could merge instead)
        db_sqlite.query(IaHistory).filter(IaHistory.user_id == current_user.id).delete()
        db_sqlite.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
        db_sqlite.query(PlanningItem).filter(PlanningItem.user_id == current_user.id).delete()

        # Import IA history
        for h in data.get("ia_history", []):
            item = IaHistory(
                user_id=current_user.id,
                timestamp=datetime.fromisoformat(h.get("timestamp", str(datetime.utcnow()))),
                mode=h.get("mode", ""),
                input_text=h.get("input_text", ""),
                subject=h.get("subject", ""),
                result=h.get("result", ""),
                question=h.get("question"),
                user_answer=h.get("user_answer"),
                correction=h.get("correction"),
                metadata=h.get("metadata", {})
            )
            db_sqlite.add(item)

        # Import chat messages
        for m in data.get("chat_messages", []):
            msg = ChatMessage(
                user_id=current_user.id,
                session_id=m.get("session_id", str(uuid.uuid4())),
                timestamp=datetime.fromisoformat(m.get("timestamp", str(datetime.utcnow()))),
                role=m.get("role", "user"),
                content=m.get("content", "")
            )
            db_sqlite.add(msg)

        # Import planning items
        for p in data.get("planning_items", []):
            item = PlanningItem(
                id=p.get("id", str(uuid.uuid4())),
                user_id=current_user.id,
                date=p.get("date", ""),
                item_type=p.get("type", "note"),
                title=p.get("title", ""),
                content=p.get("content", ""),
                category=p.get("category", "etude"),
                source=p.get("source", "manual"),
                checked=p.get("checked", False),
                created_at=datetime.fromisoformat(p.get("created_at", str(datetime.utcnow())))
            )
            db_sqlite.add(item)

        # Commit all changes
        db_sqlite.commit()

        # Invalidate user cache
        if cache_manager:
            cache_manager.invalidate_user_cache(current_user.id)

        logger.info(f"✅ Data imported for user {current_user.id}")

        return {
            "status": "import_successful",
            "items_imported": {
                "ia_history": len(data.get("ia_history", [])),
                "chat_messages": len(data.get("chat_messages", [])),
                "planning_items": len(data.get("planning_items", []))
            }
        }

    except Exception as e:
        db_sqlite.rollback()
        logger.error(f"❌ Error importing backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/backups")
async def get_backups(
    limit: int = 10,
    current_user: models.User = Depends(get_current_user)
):
    """Get list of user's backups"""
    from sqlite_models import Backup, SessionLocal

    try:
        db_sqlite = SessionLocal()
        backups = db_sqlite.query(Backup).filter(
            Backup.user_id == current_user.id
        ).order_by(Backup.created_at.desc()).limit(limit).all()

        return {
            "backups": [
                {
                    "id": b.id,
                    "filename": b.filename,
                    "size": b.size,
                    "created_at": b.created_at.isoformat()
                }
                for b in backups
            ],
            "total": len(backups)
        }

    except Exception as e:
        logger.error(f"❌ Error retrieving backups: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db_sqlite.close()


@app.get("/api/redis/health")
async def redis_health():
    """Check Redis connection status"""
    if not cache_manager:
        return {
            "status": "disconnected",
            "message": "Redis is not connected"
        }

    return test_redis_connection(redis_client)
