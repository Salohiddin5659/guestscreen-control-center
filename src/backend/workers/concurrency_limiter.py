import asyncio
import uuid
import time
from typing import Optional
from redis.asyncio import Redis


class DistributedBranchLimiter:
    """
    Manages two-level concurrency limits using Redis:
    1. Global pool ceiling (default 15 concurrent jobs, range 5-30)
    2. Per-branch rate limit (maximum 2 concurrent SSH connections per branch)
    """
    def __init__(self, redis: Redis, global_max: int = 15, per_branch_max: int = 2):
        self.redis = redis
        self.global_max = global_max
        self.per_branch_max = per_branch_max
        self.token = str(uuid.uuid4())

    async def acquire(self, branch_id: str, timeout_seconds: int = 60) -> bool:
        start = time.time()
        global_key = "sem:global_workers"
        branch_key = f"sem:branch:{branch_id}"

        while time.time() - start < timeout_seconds:
            # Check global semaphore
            current_global = await self.redis.scard(global_key)
            if current_global < self.global_max:
                # Check per-branch semaphore
                current_branch = await self.redis.scard(branch_key)
                if current_branch < self.per_branch_max:
                    # Attempt to register in both sets
                    pipe = self.redis.pipeline()
                    pipe.sadd(global_key, self.token)
                    pipe.sadd(branch_key, self.token)
                    pipe.expire(global_key, 120)
                    pipe.expire(branch_key, 120)
                    await pipe.execute()
                    return True

            # Jittered backoff
            await asyncio.sleep(0.5)

        return False

    async def release(self, branch_id: str) -> None:
        global_key = "sem:global_workers"
        branch_key = f"sem:branch:{branch_id}"
        pipe = self.redis.pipeline()
        pipe.srem(global_key, self.token)
        pipe.srem(branch_key, self.token)
        await pipe.execute()
