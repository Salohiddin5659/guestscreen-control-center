from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.domain.sse_broadcaster import subscribe_batch_events

router = APIRouter(prefix="/events", tags=["Real-time Events"])


@router.get("/publications/{batch_id}")
async def stream_publication_events(batch_id: str):
    """Server-Sent Events endpoint streaming real-time cashier publication updates."""
    return StreamingResponse(
        subscribe_batch_events(batch_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
