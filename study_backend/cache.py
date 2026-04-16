"""
Redis Cache Management for PFE Study
Handles caching of IA responses, user stats, and session data
"""

import json
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    """Manages Redis caching operations"""

    # Cache TTLs
    TTL_IA_RESPONSE = 7 * 24 * 60 * 60  # 7 days for IA responses
    TTL_USER_PROFILE = 24 * 60 * 60  # 1 day
    TTL_PROGRESSION = 6 * 60 * 60  # 6 hours
    TTL_CHAT_SESSION = 24 * 60 * 60  # 24 hours
    TTL_RESUME_SUBJECT = 7 * 24 * 60 * 60  # 7 days

    def __init__(self, redis_client):
        """Initialize cache manager with Redis client"""
        self.redis = redis_client
        self.connected = self._check_connection()

    def _check_connection(self) -> bool:
        """Verify Redis connection"""
        try:
            self.redis.ping()
            logger.info("✅ Redis connected successfully")
            return True
        except Exception as e:
            logger.warning(f"❌ Redis connection failed: {e}. Caching disabled.")
            return False

    def _hash_input(self, input_text: str) -> str:
        """Generate hash for input text"""
        return hashlib.md5(input_text.encode()).hexdigest()[:8]

    # ==================== IA RESPONSE CACHING ====================

    def get_ia_response(self, input_text: str, subject: str, mode: str) -> Optional[str]:
        """
        Get cached IA response

        Returns:
            Cached response string or None
        """
        if not self.connected:
            return None

        try:
            input_hash = self._hash_input(input_text)
            key = f"ia:response:{input_hash}:{subject}:{mode}"

            cached = self.redis.get(key)
            if cached:
                logger.debug(f"✅ Cache HIT: {key}")
                return cached.decode('utf-8') if isinstance(cached, bytes) else cached

            logger.debug(f"❌ Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"❌ Error getting IA response from cache: {e}")
            return None

    def set_ia_response(self, input_text: str, subject: str, mode: str,
                       response: str, ttl: int = None):
        """
        Cache IA response

        Args:
            input_text: Original user input
            subject: Subject/topic
            mode: Generation mode (resume, qcm, qr, chat)
            response: Generated response
            ttl: Time to live in seconds (default: TTL_IA_RESPONSE)
        """
        if not self.connected:
            return

        try:
            input_hash = self._hash_input(input_text)
            key = f"ia:response:{input_hash}:{subject}:{mode}"
            ttl = ttl or self.TTL_IA_RESPONSE

            self.redis.setex(
                key,
                ttl,
                response if isinstance(response, str) else json.dumps(response)
            )
            logger.debug(f"✅ Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"❌ Error setting IA response cache: {e}")

    # ==================== USER PROFILE CACHING ====================

    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached user profile"""
        if not self.connected:
            return None

        try:
            key = f"user:profile:{user_id}"
            cached = self.redis.get(key)
            if cached:
                logger.debug(f"✅ Cache HIT: {key}")
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"❌ Error getting user profile from cache: {e}")
            return None

    def set_user_profile(self, user_id: int, profile_data: Dict[str, Any]):
        """Cache user profile"""
        if not self.connected:
            return

        try:
            key = f"user:profile:{user_id}"
            self.redis.setex(key, self.TTL_USER_PROFILE, json.dumps(profile_data))
            logger.debug(f"✅ Cache SET: {key}")
        except Exception as e:
            logger.error(f"❌ Error setting user profile cache: {e}")

    # ==================== PROGRESSION CACHING ====================

    def get_progression_stats(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached progression statistics"""
        if not self.connected:
            return None

        try:
            key = f"user:progression:{user_id}"
            cached = self.redis.get(key)
            if cached:
                logger.debug(f"✅ Cache HIT: {key}")
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"❌ Error getting progression stats from cache: {e}")
            return None

    def set_progression_stats(self, user_id: int, stats: Dict[str, Any]):
        """Cache progression statistics"""
        if not self.connected:
            return

        try:
            key = f"user:progression:{user_id}"
            self.redis.setex(key, self.TTL_PROGRESSION, json.dumps(stats))
            logger.debug(f"✅ Cache SET: {key}")
        except Exception as e:
            logger.error(f"❌ Error setting progression stats cache: {e}")

    # ==================== CHAT SESSION CACHING ====================

    def get_chat_session(self, session_id: str) -> Optional[list]:
        """Get cached chat messages for session"""
        if not self.connected:
            return None

        try:
            key = f"chat:session:{session_id}"
            cached = self.redis.get(key)
            if cached:
                logger.debug(f"✅ Cache HIT: {key}")
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"❌ Error getting chat session from cache: {e}")
            return None

    def set_chat_session(self, session_id: str, messages: list):
        """Cache chat session messages"""
        if not self.connected:
            return

        try:
            key = f"chat:session:{session_id}"
            self.redis.setex(key, self.TTL_CHAT_SESSION, json.dumps(messages))
            logger.debug(f"✅ Cache SET: {key}")
        except Exception as e:
            logger.error(f"❌ Error setting chat session cache: {e}")

    # ==================== CACHE INVALIDATION ====================

    def invalidate_user_cache(self, user_id: int):
        """Invalidate all caches for a user"""
        if not self.connected:
            return

        try:
            patterns = [
                f"user:profile:{user_id}",
                f"user:progression:{user_id}",
                f"ia:response:*",  # Could be filtered by user in future
            ]

            for pattern in patterns:
                try:
                    keys = self.redis.keys(pattern)
                    if keys:
                        self.redis.delete(*keys)
                        logger.debug(f"✅ Invalidated cache pattern: {pattern}")
                except Exception as e:
                    logger.error(f"❌ Error invalidating pattern {pattern}: {e}")
        except Exception as e:
            logger.error(f"❌ Error invalidating user cache: {e}")

    def invalidate_ia_cache(self, input_text: str, subject: str, mode: str):
        """Invalidate specific IA response cache"""
        if not self.connected:
            return

        try:
            input_hash = self._hash_input(input_text)
            key = f"ia:response:{input_hash}:{subject}:{mode}"
            self.redis.delete(key)
            logger.debug(f"✅ Invalidated cache: {key}")
        except Exception as e:
            logger.error(f"❌ Error invalidating IA cache: {e}")

    def clear_all_cache(self):
        """Clear entire cache (use with caution)"""
        if not self.connected:
            return

        try:
            self.redis.flushdb()
            logger.warning("⚠️ Cleared entire Redis cache")
        except Exception as e:
            logger.error(f"❌ Error clearing cache: {e}")

    # ==================== RATE LIMITING ====================

    def check_rate_limit(self, user_id: int, limit: int = 100, period: int = 3600) -> bool:
        """
        Check if user is within rate limit

        Args:
            user_id: User ID
            limit: Max requests per period
            period: Time period in seconds (default: 1 hour)

        Returns:
            True if within limit, False if exceeded
        """
        if not self.connected:
            return True  # Allow if Redis unavailable

        try:
            key = f"rate_limit:{user_id}:{datetime.utcnow().hour}"
            count = self.redis.incr(key)

            if count == 1:
                self.redis.expire(key, period)

            return count <= limit
        except Exception as e:
            logger.error(f"❌ Error checking rate limit: {e}")
            return True

    # ==================== USAGE STATS ====================

    def log_usage(self, user_id: int, mode: str):
        """Log usage for analytics"""
        if not self.connected:
            return

        try:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            key = f"usage:{user_id}:{mode}:{today}"
            self.redis.incr(key)
            self.redis.expire(key, 30 * 24 * 60 * 60)  # 30 days
        except Exception as e:
            logger.error(f"❌ Error logging usage: {e}")


def test_redis_connection(redis_client):
    """Test Redis connection and return status"""
    try:
        redis_client.ping()
        info = redis_client.info()
        return {
            "status": "connected",
            "redis_version": info.get("redis_version"),
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
        }
