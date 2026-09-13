import os
from arq.connections import RedisSettings

REDIS_HOST = os.getenv("REDIS_HOST", "redis_queue")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

redis_settings = RedisSettings(
    host=REDIS_HOST,
    port=REDIS_PORT,
    conn_timeout=10,
)
