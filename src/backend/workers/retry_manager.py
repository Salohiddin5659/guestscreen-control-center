import random
from typing import Tuple


def calculate_exponential_backoff_with_jitter(
    attempt: int,
    base_seconds: float = 2.0,
    max_seconds: float = 60.0
) -> float:
    """
    Computes full jitter exponential backoff:
    t = random.uniform(0, min(max_seconds, base_seconds * (2 ** attempt)))
    """
    ceiling = min(max_seconds, base_seconds * (2 ** attempt))
    return random.uniform(0, ceiling)


def should_retry_job(current_attempt: int, max_attempts: int = 3) -> Tuple[bool, int]:
    """Returns whether to retry and next attempt number."""
    if current_attempt < max_attempts:
        return True, current_attempt + 1
    return False, current_attempt
