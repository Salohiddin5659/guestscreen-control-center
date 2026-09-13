# -*- coding: utf-8 -*-
"""Advertising scene builder and surgical SQLite injector for UCS GuestScreen (T055)."""
import logging
from typing import List, Optional
import uuid

import asyncssh

from src.adapters.command_adapter import (
    SCENE_GUID_FULL,
    SCENE_GUID_SPLIT,
    CashboxCommandAdapter,
)
from src.adapters.scene_serializer import (
    build_gallery_scene,
    build_static_scene,
    parse_scene,
)
from src.adapters.sqlite_adapter import SQLiteSceneAdapter
from src.core.exceptions import SafetyBoundaryViolationError, ValidationDomainError
from src.core.safety_guard import RetailSafetyGuard
from src.models.media import AdMode
from src.services.playlist_compiler import CompiledPlaylist, CompiledSlide

logger = logging.getLogger("guestscreen.scene_builder")


class AdvertisingSceneBuilder:
    """Constructs and injects compliant GuestScreen 3.1.1.0 advertising scene definitions."""

    def __init__(
        self,
        sqlite_adapter: Optional[SQLiteSceneAdapter] = None,
        command_adapter: Optional[CashboxCommandAdapter] = None,
    ) -> None:
        self.command_adapter = command_adapter or CashboxCommandAdapter()
        self.sqlite_adapter = sqlite_adapter or SQLiteSceneAdapter(self.command_adapter)

    def build_full_dynamic_scene_json(
        self,
        compiled_playlist: CompiledPlaylist,
    ) -> str:
        """Construct GuestScreen compliant JSON string for FULL SCREEN dynamic standby scene.

        Args:
            compiled_playlist: Validated and compiled dynamic playlist.

        Returns:
            JSON string formatted for insertion into scenes.Raw for GUID 2509359c...
        """
        if not compiled_playlist.slides:
            raise ValidationDomainError("Dynamic slideshow requires at least one slide.")

        filenames = [slide.filename for slide in compiled_playlist.slides]
        interval_sec = compiled_playlist.default_interval_sec

        return build_gallery_scene(
            ad_mode=AdMode.FULL,
            filenames=filenames,
            interval_sec=interval_sec,
        )

    def build_split_dynamic_scene_json(
        self,
        compiled_playlist: CompiledPlaylist,
    ) -> str:
        """Construct GuestScreen compliant JSON string for 50/50 dynamic promo block."""
        if not compiled_playlist.slides:
            raise ValidationDomainError("Dynamic promo requires at least one slide.")

        filenames = [slide.filename for slide in compiled_playlist.slides]
        interval_sec = compiled_playlist.default_interval_sec

        return build_gallery_scene(
            ad_mode=AdMode.SPLIT,
            filenames=filenames,
            interval_sec=interval_sec,
        )

    async def inject_full_dynamic_scene(
        self,
        conn: asyncssh.SSHClientConnection,
        compiled_playlist: CompiledPlaylist,
    ) -> str:
        """Build and surgically inject dynamic standby scene into gs.db on the cashbox."""
        RetailSafetyGuard.validate_scene_guid(SCENE_GUID_FULL)
        scene_json = self.build_full_dynamic_scene_json(compiled_playlist)
        logger.info(
            "Injecting FULL dynamic scene (%d slides) into gs.db GUID %s",
            len(compiled_playlist.slides),
            SCENE_GUID_FULL,
        )
        await self.sqlite_adapter.update_scene(conn, SCENE_GUID_FULL, scene_json)
        return scene_json

    async def inject_split_dynamic_scene(
        self,
        conn: asyncssh.SSHClientConnection,
        compiled_playlist: CompiledPlaylist,
    ) -> str:
        """Build and surgically inject dynamic 50/50 scene into gs.db on the cashbox."""
        RetailSafetyGuard.validate_scene_guid(SCENE_GUID_SPLIT)
        scene_json = self.build_split_dynamic_scene_json(compiled_playlist)
        logger.info(
            "Injecting SPLIT dynamic scene (%d slides) into gs.db GUID %s",
            len(compiled_playlist.slides),
            SCENE_GUID_SPLIT,
        )
        await self.sqlite_adapter.update_scene(conn, SCENE_GUID_SPLIT, scene_json)
        return scene_json
