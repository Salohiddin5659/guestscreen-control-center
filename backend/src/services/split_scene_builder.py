# -*- coding: utf-8 -*-
"""50/50 Static promo scene builder and surgical SQLite injector for UCS GuestScreen (T060)."""
import logging
from typing import Optional

import asyncssh

from src.adapters.command_adapter import SCENE_GUID_SPLIT, CashboxCommandAdapter
from src.adapters.scene_serializer import build_static_scene
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import ValidationDomainError
from src.core.safety_guard import RetailSafetyGuard
from src.models.media import AdMode, MediaAsset

logger = logging.getLogger("guestscreen.split_scene_builder")


class SplitStaticSceneBuilder:
    """Constructs and injects compliant GuestScreen 3.1.1.0 50/50 static promo scene definitions."""

    def __init__(
        self,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
        command_adapter: Optional[CashboxCommandAdapter] = None,
    ) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter(self.command_adapter)

    def build_split_static_scene_json(self, media_asset: MediaAsset) -> str:
        """Construct GuestScreen compliant JSON string for 50/50 static promo block.

        Enforces exact 512x768 resolution and SPLIT compatibility.

        Args:
            media_asset: Target 50/50 static media asset.

        Returns:
            JSON string formatted for insertion into scenes.Raw for GUID 68906ed2-49a3-4dc3-bb8a-6fa7943f39c3.

        Raises:
            ValidationDomainError: If dimensions are not 512x768 or ad_mode is incompatible.
        """
        if media_asset.width != 512 or media_asset.height != 768:
            raise ValidationDomainError(
                f"50/50 static promo banner must have resolution exactly 512x768. "
                f"Got {media_asset.width}x{media_asset.height} for '{media_asset.filename}'."
            )

        if media_asset.ad_mode not in (AdMode.SPLIT.value, AdMode.BOTH.value):
            raise ValidationDomainError(
                f"Media asset '{media_asset.filename}' with mode '{media_asset.ad_mode}' "
                f"cannot be used for 50/50 SPLIT layout."
            )

        return build_static_scene(AdMode.SPLIT, media_asset.filename)

    async def inject_split_static_scene(
        self,
        conn: asyncssh.SSHClientConnection,
        media_asset: MediaAsset,
    ) -> str:
        """Build and surgically inject static promo scene into gs.db on the cashbox."""
        RetailSafetyGuard.validate_scene_guid(SCENE_GUID_SPLIT)
        scene_json = self.build_split_static_scene_json(media_asset)
        logger.info(
            "Injecting 50/50 static promo scene ('%s') into gs.db GUID %s",
            media_asset.filename,
            SCENE_GUID_SPLIT,
        )
        await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, scene_json)
        return scene_json
