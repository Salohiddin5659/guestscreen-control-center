# -*- coding: utf-8 -*-
"""Ad Configuration versioning, playlist binding, and fleet assignment service (T045)."""
from typing import List, Optional, Sequence
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import EntityNotFoundError, ValidationDomainError
from src.models.cashbox import Cashbox, CashboxGroup, Location
from src.models.configuration import AdConfiguration, ConfigurationAssignment
from src.models.media import AdMode
from src.models.playlist import Playlist, PlaylistItem


class AdConfigurationService:
    """Manages ad configuration versioning and fleet assignments."""

    async def create_configuration(
        self,
        db: AsyncSession,
        name: str,
        full_playlist_id: Optional[uuid.UUID] = None,
        split_playlist_id: Optional[uuid.UUID] = None,
        description: Optional[str] = None,
    ) -> AdConfiguration:
        """Create a new versioned AdConfiguration binding FULL SCREEN and/or 50/50 playlists."""
        name = name.strip()
        if not full_playlist_id and not split_playlist_id:
            raise ValidationDomainError(
                "AdConfiguration requires at least a full_playlist_id or a split_playlist_id."
            )

        # Validate full playlist
        if full_playlist_id:
            full_pl = await db.get(Playlist, full_playlist_id)
            if not full_pl:
                raise EntityNotFoundError(f"Full Playlist ID '{full_playlist_id}' not found.")
            if full_pl.ad_mode != AdMode.FULL.value:
                raise ValidationDomainError(
                    f"Playlist '{full_pl.name}' has ad_mode '{full_pl.ad_mode}'; expected 'FULL'."
                )

        # Validate split playlist
        if split_playlist_id:
            split_pl = await db.get(Playlist, split_playlist_id)
            if not split_pl:
                raise EntityNotFoundError(f"Split Playlist ID '{split_playlist_id}' not found.")
            if split_pl.ad_mode != AdMode.SPLIT.value:
                raise ValidationDomainError(
                    f"Playlist '{split_pl.name}' has ad_mode '{split_pl.ad_mode}'; expected 'SPLIT'."
                )

        # Determine next version
        max_ver = await db.scalar(select(func.max(AdConfiguration.version)))
        next_ver = (max_ver or 0) + 1

        config = AdConfiguration(
            id=uuid.uuid4(),
            name=name,
            version=next_ver,
            description=description.strip() if description else None,
            full_playlist_id=full_playlist_id,
            split_playlist_id=split_playlist_id,
        )
        db.add(config)
        await db.flush()
        return config

    async def get_configuration(
        self,
        db: AsyncSession,
        config_id: uuid.UUID,
        load_relations: bool = True,
    ) -> AdConfiguration:
        """Retrieve an AdConfiguration by ID with optional eager loading of playlists and media."""
        query = select(AdConfiguration).where(AdConfiguration.id == config_id)
        if load_relations:
            query = query.options(
                selectinload(AdConfiguration.full_playlist)
                .selectinload(Playlist.items)
                .selectinload(PlaylistItem.media),
                selectinload(AdConfiguration.split_playlist)
                .selectinload(Playlist.items)
                .selectinload(PlaylistItem.media),
            )
        result = await db.scalar(query)
        if not result:
            raise EntityNotFoundError(f"AdConfiguration with ID '{config_id}' not found.")
        return result

    async def list_configurations(
        self,
        db: AsyncSession,
        load_relations: bool = False,
    ) -> Sequence[AdConfiguration]:
        """List all registered ad configurations ordered by version descending."""
        query = select(AdConfiguration)
        if load_relations:
            query = query.options(
                selectinload(AdConfiguration.full_playlist),
                selectinload(AdConfiguration.split_playlist),
            )
        query = query.order_by(AdConfiguration.version.desc())
        result = await db.scalars(query)
        return result.all()

    async def assign_to_cashbox(
        self,
        db: AsyncSession,
        configuration_id: uuid.UUID,
        cashbox_id: uuid.UUID,
    ) -> ConfigurationAssignment:
        """Assign an AdConfiguration to a specific cashbox, updating desired_version."""
        config = await self.get_configuration(db, configuration_id, load_relations=False)
        cashbox = await db.get(Cashbox, cashbox_id)
        if not cashbox:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")

        # Remove existing direct assignment for this cashbox
        existing = await db.scalars(
            select(ConfigurationAssignment).where(ConfigurationAssignment.cashbox_id == cashbox_id)
        )
        for assignment in existing.all():
            await db.delete(assignment)

        assignment = ConfigurationAssignment(
            id=uuid.uuid4(),
            configuration_id=config.id,
            cashbox_id=cashbox.id,
        )
        db.add(assignment)

        # Update cashbox desired_version
        cashbox.desired_version = config.version
        await db.flush()
        return assignment

    async def assign_to_group(
        self,
        db: AsyncSession,
        configuration_id: uuid.UUID,
        group_id: uuid.UUID,
    ) -> ConfigurationAssignment:
        """Assign an AdConfiguration to a cashbox group, updating desired_version on all member cashboxes."""
        config = await self.get_configuration(db, configuration_id, load_relations=False)
        group = await db.get(CashboxGroup, group_id)
        if not group:
            raise EntityNotFoundError(f"CashboxGroup with ID '{group_id}' not found.")

        # Remove existing assignment for group
        existing = await db.scalars(
            select(ConfigurationAssignment).where(ConfigurationAssignment.group_id == group_id)
        )
        for assignment in existing.all():
            await db.delete(assignment)

        assignment = ConfigurationAssignment(
            id=uuid.uuid4(),
            configuration_id=config.id,
            group_id=group.id,
        )
        db.add(assignment)

        # Update desired_version for all cashboxes in group
        cashboxes = await db.scalars(select(Cashbox).where(Cashbox.group_id == group_id))
        for cb in cashboxes.all():
            cb.desired_version = config.version

        await db.flush()
        return assignment
