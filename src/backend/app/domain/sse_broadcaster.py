import asyncio
import json
import logging
from typing import AsyncGenerator
from redis.asyncio import Redis
from workers.arq_config import redis_settings

logger = logging.getLogger("gs_control_center.sse")


async def subscribe_batch_events(batch_id: str) -> AsyncGenerator[str, None]:
    """Streams SSE events from Redis pub/sub channel for given publication batch."""
    redis = Redis(host=redis_settings.host, port=redis_settings.port)
    pubsub = redis.pubsub()
    channel = f"batch_events:{batch_id}"
    await pubsub.subscribe(channel)

    try:
        # Initial keep-alive ping
        yield f"data: {json.dumps({'event': 'connected', 'batch_id': batch_id})}\n\n"

        while True:
            # Poll for messages with timeout to emit ping keep-alives
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=15.0)
            if message:
                data_str = message["data"].decode("utf-8")
                yield f"data: {data_str}\n\n"
            else:
                # Keep-alive heartbeat comment
                yield ": keep-alive\n\n"
            await asyncio.sleep(0.1)
    except asyncio.CancelledError:
        logger.debug(f"SSE client disconnected for batch {batch_id}")
    finally:
        await pubsub.unsubscribe(channel)
        await redis.close()
