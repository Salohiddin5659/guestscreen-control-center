# -*- coding: utf-8 -*-
"""Idempotency evaluator and inventory reconciliation diff engine (T047)."""
from dataclasses import dataclass, field
import json
import logging
from typing import Dict, List, Optional, Set

from src.adapters.command_parsers import InventoryItem
from src.models.cashbox import Cashbox
from src.models.configuration import AdConfiguration
from src.models.media import MediaAsset

logger = logging.getLogger("guestscreen.idempotency")


@dataclass
class InventoryDiff:
    """Classified diff between central desired media and cashier monoblock actual inventory."""
    ok: List[MediaAsset] = field(default_factory=list)
    missing: List[MediaAsset] = field(default_factory=list)
    outdated: List[MediaAsset] = field(default_factory=list)
    unexpected: List[InventoryItem] = field(default_factory=list)

    @property
    def requires_upload(self) -> bool:
        """True if any media file needs to be transferred to cashier staging."""
        return len(self.missing) > 0 or len(self.outdated) > 0


class IdempotencyService:
    """Evaluates zero-impact NO_OP idempotency and media inventory reconciliation."""

    @staticmethod
    def calculate_media_diff(
        desired_assets: List[MediaAsset],
        actual_inventory: List[InventoryItem],
    ) -> InventoryDiff:
        """Reconcile desired media assets against actual monoblock filesystem inventory.

        Categories:
        - OK: Filename exists on cashbox and SHA-256 matches central hash.
        - MISSING: Desired asset filename does not exist on cashbox.
        - OUTDATED: Filename exists, but SHA-256 hash does not match central hash.
        - UNEXPECTED: File exists on cashbox, but is not part of desired configuration (retained safely).
        """
        diff = InventoryDiff()
        actual_by_filename: Dict[str, InventoryItem] = {
            item.filename: item for item in actual_inventory
        }
        desired_filenames: Set[str] = set()

        for asset in desired_assets:
            desired_filenames.add(asset.filename)
            actual_item = actual_by_filename.get(asset.filename)

            if actual_item is None:
                diff.missing.append(asset)
            elif actual_item.sha256.lower() == asset.sha256.lower():
                diff.ok.append(asset)
            else:
                diff.outdated.append(asset)

        # UNEXPECTED: Retain untouched without deletion
        for item in actual_inventory:
            if item.filename not in desired_filenames:
                diff.unexpected.append(item)

        return diff

    @staticmethod
    def is_idempotent_noop(
        cashbox: Cashbox,
        target_config: AdConfiguration,
        diff: InventoryDiff,
        actual_full_scene_raw: Optional[str] = None,
        desired_full_scene_raw: Optional[str] = None,
        actual_split_scene_raw: Optional[str] = None,
        desired_split_scene_raw: Optional[str] = None,
    ) -> bool:
        """Determine if deployment achieves an instant zero-impact NO_OP.

        Idempotency holds if:
        1. cashbox.actual_version == target_config.version
        2. Media diff requires zero uploads (no MISSING or OUTDATED files)
        3. Physical scenes in gs.db already match the target scene JSON payloads
        """
        if cashbox.actual_version != target_config.version:
            return False

        if diff.requires_upload:
            return False

        # Compare FULL scene if configured
        if desired_full_scene_raw is not None and actual_full_scene_raw is not None:
            try:
                desired_data = json.loads(desired_full_scene_raw)
                actual_data = json.loads(actual_full_scene_raw)
                if desired_data != actual_data:
                    return False
            except json.JSONDecodeError:
                return False

        # Compare SPLIT scene if configured
        if desired_split_scene_raw is not None and actual_split_scene_raw is not None:
            try:
                desired_data = json.loads(desired_split_scene_raw)
                actual_data = json.loads(actual_split_scene_raw)
                if desired_data != actual_data:
                    return False
            except json.JSONDecodeError:
                return False

        return True
