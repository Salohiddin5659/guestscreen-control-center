# -*- coding: utf-8 -*-
"""Cashbox status lifecycle, synchronization drift, and fleet statistics engine."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Sequence
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.models.cashbox import Cashbox, CashboxStatus


class CashboxStatusService:
    """Manages cashbox lifecycle transitions, version drift, and fleet statistics."""

    VALID_STATUSES = {s.value for s in CashboxStatus}

    async def update_status(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        new_status: CashboxStatus | str,
    ) -> Cashbox:
        """Transition a cashbox to a new lifecycle state."""
        status_val = new_status.value if isinstance(new_status, CashboxStatus) else str(new_status).upper()
        if status_val not in self.VALID_STATUSES:
            raise ValidationDomainError(
                f"Invalid cashbox status: '{new_status}'. Allowed: {sorted(self.VALID_STATUSES)}"
            )

        cashbox = await db.get(Cashbox, cashbox_id)
        if not cashbox:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")

        cashbox.status = status_val
        await db.flush()
        return cashbox

    async def update_desired_version(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        version: int,
    ) -> Cashbox:
        """Set the target desired ad configuration version for a cashbox."""
        if version < 0:
            raise ValidationDomainError(f"Version must be non-negative, got {version}")

        cashbox = await db.get(Cashbox, cashbox_id)
        if not cashbox:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")

        cashbox.desired_version = version
        await db.flush()
        return cashbox

    async def record_deployment_success(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        actual_version: int,
        deployed_at: Optional[datetime] = None,
    ) -> Cashbox:
        """Update actual deployed version and record deployment timestamp upon verified hot reload."""
        if actual_version < 0:
            raise ValidationDomainError(f"Actual version must be non-negative, got {actual_version}")

        cashbox = await db.get(Cashbox, cashbox_id)
        if not cashbox:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")

        cashbox.actual_version = actual_version
        cashbox.last_deployment_at = deployed_at or datetime.now(timezone.utc)
        await db.flush()
        return cashbox

    async def record_inventory_scan(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        scanned_at: Optional[datetime] = None,
    ) -> Cashbox:
        """Record timestamp of a completed remote filesystem inventory scan."""
        cashbox = await db.get(Cashbox, cashbox_id)
        if not cashbox:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")

        cashbox.last_inventory_at = scanned_at or datetime.now(timezone.utc)
        await db.flush()
        return cashbox

    async def get_out_of_sync_cashboxes(
        self,
        db: AsyncSession,
    ) -> Sequence[Cashbox]:
        """List cashboxes where actual_version differs from desired_version or status is not ACTIVE."""
        query = select(Cashbox).where(
            (Cashbox.desired_version != Cashbox.actual_version)
            | (Cashbox.status != CashboxStatus.ACTIVE.value)
        ).order_by(Cashbox.name.asc())
        result = await db.scalars(query)
        return result.all()

    async def get_fleet_statistics(self, db: AsyncSession) -> Dict[str, Any]:
        """Aggregate high-level health and synchronization metrics across the entire fleet."""
        cashboxes = (await db.scalars(select(Cashbox))).all()

        total = len(cashboxes)
        status_counts = {
            CashboxStatus.ACTIVE.value: 0,
            CashboxStatus.MAINTENANCE.value: 0,
            CashboxStatus.OFFLINE.value: 0,
            CashboxStatus.UNREACHABLE.value: 0,
        }

        synchronized_count = 0
        drifted_count = 0

        for cb in cashboxes:
            if cb.status in status_counts:
                status_counts[cb.status] += 1
            else:
                status_counts[cb.status] = 1

            if cb.desired_version == cb.actual_version and cb.status == CashboxStatus.ACTIVE.value:
                synchronized_count += 1
            else:
                drifted_count += 1

        sync_rate = (synchronized_count / total * 100.0) if total > 0 else 100.0

        return {
            "total_cashboxes": total,
            "status_counts": status_counts,
            "synchronized_count": synchronized_count,
            "drifted_count": drifted_count,
            "sync_rate_percent": round(sync_rate, 2),
        }
