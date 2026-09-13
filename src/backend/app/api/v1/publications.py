from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import get_db, get_current_user, require_roles
from app.models.security import User
from app.models.publication import PublicationBatch, PublicationJob
from app.models.topology import Cashier
from app.services.orchestrator import PublicationOrchestrator
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/publications", tags=["Publications"])


class PublicationDispatchInput(BaseModel):
    advertising_block_id: UUID
    scope_type: str  # REGION, BRANCH, CUSTOM_CASHIERS
    scope_target_ids: List[str]


@router.get("", response_model=List[PublicationBatch])
async def list_publications(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    query = select(PublicationBatch).order_by(PublicationBatch.created_at.desc())
    return (await session.exec(query)).all()


@router.post("", response_model=dict)
async def dispatch_publication(
    req: PublicationDispatchInput,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    try:
        batch = await PublicationOrchestrator.dispatch_publication(
            session=session,
            advertising_block_id=req.advertising_block_id,
            scope_type=req.scope_type,
            scope_target_ids=req.scope_target_ids,
            initiated_by_user_id=current_user.id
        )
        await record_audit_event(
            session, "PUBLICATION_DISPATCHED", "PublicationBatch", str(batch.id), current_user.id,
            req.model_dump(mode="json")
        )
        return {
            "batch_id": str(batch.id),
            "status": batch.status,
            "total_cashiers": batch.total_cashiers,
            "message": f"Публикация успешно запущена для {batch.total_cashiers} касс."
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{batch_id}")
async def get_publication_batch_detail(
    batch_id: UUID,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    batch = await session.get(PublicationBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Пакет публикации не найден")

    jobs_query = select(PublicationJob).where(PublicationJob.batch_id == batch.id)
    jobs = (await session.exec(jobs_query)).all()

    jobs_detail = []
    for j in jobs:
        cashier = await session.get(Cashier, j.cashier_id)
        jobs_detail.append({
            "id": str(j.id),
            "cashier_id": str(j.cashier_id),
            "cashier_name": cashier.name if cashier else "Unknown",
            "cashier_ip": cashier.ip_address if cashier else "Unknown",
            "status": j.status,
            "attempt_count": j.current_attempt,
            "error_message": j.error_message,
            "started_at": j.started_at,
            "finished_at": j.finished_at
        })

    return {
        "batch": {
            "id": str(batch.id),
            "advertising_block_id": str(batch.advertising_block_id),
            "scope_type": batch.scope_type,
            "status": batch.status,
            "total_cashiers": batch.total_cashiers,
            "success_count": batch.success_count,
            "awaiting_restart_count": batch.awaiting_restart_count,
            "failed_count": batch.failed_count,
            "offline_count": batch.offline_count,
            "content_snapshot_json": batch.content_snapshot_json,
            "started_at": batch.started_at,
            "finished_at": batch.finished_at,
            "created_at": batch.created_at
        },
        "jobs": jobs_detail
    }


@router.post("/{batch_id}/retry")
@router.post("/{batch_id}/retry-failed")
async def retry_failed_publication_jobs(
    batch_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("ADMINISTRATOR", "OPERATOR"))
):
    batch = await session.get(PublicationBatch, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Пакет публикации не найден")

    retried_job_ids = await PublicationOrchestrator.retry_failed_jobs(session, batch_id)
    await record_audit_event(
        session, "PUBLICATION_RETRY", "PublicationBatch", str(batch.id), current_user.id,
        {"retried_count": len(retried_job_ids)}
    )
    return {
        "retried_count": len(retried_job_ids),
        "message": f"Повторно отправлено в обработку {len(retried_job_ids)} неудавшихся касс."
    }

