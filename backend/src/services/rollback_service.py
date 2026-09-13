# -*- coding: utf-8 -*-
"""Rollback service for reverting cashbox advertising scenes upon failure (T048)."""
import json
import logging
from typing import Optional
import uuid

import asyncssh
from sqlalchemy.ext.asyncio import AsyncSession

from src.adapters.command_adapter import (
    SCENE_GUID_FULL,
    SCENE_GUID_SPLIT,
    CashboxCommandAdapter,
)
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import RollbackFailedError
from src.models.deployment import Deployment, DeploymentStatus, RollbackSnapshot

logger = logging.getLogger("guestscreen.rollback_service")


class RollbackService:
    """Restores pre-deployment scene definitions from RollbackSnapshot in gs.db."""

    def __init__(
        self,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
        command_adapter: Optional[CashboxCommandAdapter] = None,
    ) -> None:
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter()
        self.command_adapter = command_adapter or CashboxCommandAdapter()

    async def execute_rollback(
        self,
        db: AsyncSession,
        conn: asyncssh.SSHClientConnection,
        deployment: Deployment,
        snapshot: RollbackSnapshot,
    ) -> None:
        """Revert advertising scenes to snapshot states and trigger hot reload."""
        logger.warning(
            "Executing emergency rollback for deployment %s on cashbox %s",
            deployment.id,
            deployment.cashbox_id,
        )

        deployment.status = DeploymentStatus.ROLLING_BACK.value
        await db.flush()

        try:
            # 1. Revert FULL SCREEN scene if snapshotted
            if snapshot.previous_full_scene is not None:
                full_raw = json.dumps(snapshot.previous_full_scene)
                await self.sqlite_adapter.update_scene(conn, SCENE_GUID_FULL, full_raw)
                logger.info("Rolled back FULL SCREEN scene to snapshot state")

            # 2. Revert 50/50 scene if snapshotted
            if snapshot.previous_split_scene is not None:
                split_raw = json.dumps(snapshot.previous_split_scene)
                await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, split_raw)
                logger.info("Rolled back 50/50 scene to snapshot state")

            # 3. Trigger hot reload
            await self.command_adapter.touch_reload(conn)

            deployment.status = DeploymentStatus.ROLLED_BACK.value
            deployment.is_rollback = True
            await db.flush()
            logger.info("Rollback completed successfully for deployment %s", deployment.id)

        except Exception as exc:
            logger.critical(
                "CRITICAL: Rollback failed for deployment %s: %s",
                deployment.id,
                exc,
                exc_info=True,
            )
            deployment.status = DeploymentStatus.FAILED_MANUAL_INTERVENTION.value
            deployment.error_message = f"Rollback failed: {exc}"
            await db.flush()
            raise RollbackFailedError(f"Emergency rollback failed on cashbox: {exc}") from exc
