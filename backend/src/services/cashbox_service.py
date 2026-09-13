# -*- coding: utf-8 -*-
"""Cashbox fleet registry service managing monoblocks, locations, and groups."""
import ipaddress
import uuid
from typing import List, Optional, Sequence

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.core.exceptions import EntityConflictError, EntityNotFoundError, ValidationDomainError
from src.models.cashbox import Cashbox, CashboxGroup, CashboxStatus, Location
from src.models.credential import SSHCredential


class CashboxService:
    """Service for managing the cashier monoblock fleet, groups, and locations."""

    @staticmethod
    def _validate_ip(ip_str: str) -> str:
        """Validate and normalize an IP address."""
        try:
            ip_obj = ipaddress.ip_address(ip_str.strip())
            return str(ip_obj)
        except ValueError as exc:
            raise ValidationDomainError(f"Invalid IP address format: '{ip_str}'") from exc

    # =========================================================================
    # Location Operations
    # =========================================================================
    async def create_location(
        self,
        db: AsyncSession,
        code: str,
        name: str,
        description: Optional[str] = None,
    ) -> Location:
        """Create a new restaurant or geographical location."""
        code = code.strip().upper()
        name = name.strip()

        # Check code uniqueness
        existing = await db.scalar(select(Location).where(Location.code == code))
        if existing:
            raise EntityConflictError(f"Location with code '{code}' already exists.")

        location = Location(
            id=uuid.uuid4(),
            code=code,
            name=name,
            description=description.strip() if description else None,
        )
        db.add(location)
        await db.flush()
        return location

    async def get_location(self, db: AsyncSession, location_id: uuid.UUID) -> Location:
        """Retrieve location by ID or raise EntityNotFoundError."""
        location = await db.get(Location, location_id)
        if not location:
            raise EntityNotFoundError(f"Location with ID '{location_id}' not found.")
        return location

    async def list_locations(self, db: AsyncSession) -> Sequence[Location]:
        """List all registered locations."""
        result = await db.scalars(select(Location).order_by(Location.name.asc()))
        return result.all()

    async def update_location(
        self,
        db: AsyncSession,
        location_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Location:
        """Update location attributes."""
        location = await self.get_location(db, location_id)
        if name is not None:
            location.name = name.strip()
        if description is not None:
            location.description = description.strip() if description else None
        await db.flush()
        return location

    async def delete_location(self, db: AsyncSession, location_id: uuid.UUID) -> bool:
        """Delete a location by ID."""
        location = await self.get_location(db, location_id)
        await db.delete(location)
        await db.flush()
        return True

    # =========================================================================
    # Cashbox Group Operations
    # =========================================================================
    async def create_group(
        self,
        db: AsyncSession,
        code: str,
        name: str,
        description: Optional[str] = None,
    ) -> CashboxGroup:
        """Create a logical cashbox group (e.g. Drive-Thru, Bar, Express)."""
        code = code.strip().upper()
        name = name.strip()

        existing = await db.scalar(select(CashboxGroup).where(CashboxGroup.code == code))
        if existing:
            raise EntityConflictError(f"CashboxGroup with code '{code}' already exists.")

        group = CashboxGroup(
            id=uuid.uuid4(),
            code=code,
            name=name,
            description=description.strip() if description else None,
        )
        db.add(group)
        await db.flush()
        return group

    async def get_group(self, db: AsyncSession, group_id: uuid.UUID) -> CashboxGroup:
        """Retrieve group by ID or raise EntityNotFoundError."""
        group = await db.get(CashboxGroup, group_id)
        if not group:
            raise EntityNotFoundError(f"CashboxGroup with ID '{group_id}' not found.")
        return group

    async def list_groups(self, db: AsyncSession) -> Sequence[CashboxGroup]:
        """List all cashbox groups."""
        result = await db.scalars(select(CashboxGroup).order_by(CashboxGroup.name.asc()))
        return result.all()

    async def update_group(
        self,
        db: AsyncSession,
        group_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> CashboxGroup:
        """Update cashbox group attributes."""
        group = await self.get_group(db, group_id)
        if name is not None:
            group.name = name.strip()
        if description is not None:
            group.description = description.strip() if description else None
        await db.flush()
        return group

    async def delete_group(self, db: AsyncSession, group_id: uuid.UUID) -> bool:
        """Delete a group by ID."""
        group = await self.get_group(db, group_id)
        await db.delete(group)
        await db.flush()
        return True

    # =========================================================================
    # Cashbox Operations
    # =========================================================================
    async def create_cashbox(
        self,
        db: AsyncSession,
        name: str,
        ip_address: str,
        ssh_port: int = 22,
        location_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        credential_id: Optional[uuid.UUID] = None,
        screen_resolution: str = "1024x768",
        gs_version: str = "3.1.1.0",
        status: CashboxStatus = CashboxStatus.ACTIVE,
    ) -> Cashbox:
        """Register a new cashbox monoblock into the fleet."""
        name = name.strip()
        validated_ip = self._validate_ip(ip_address)

        if ssh_port < 1 or ssh_port > 65535:
            raise ValidationDomainError(f"Invalid SSH port: {ssh_port}")

        # Check IP uniqueness
        existing_ip = await db.scalar(
            select(Cashbox).where(Cashbox.ip_address == validated_ip)
        )
        if existing_ip:
            raise EntityConflictError(
                f"Cashbox with IP address '{validated_ip}' already registered (ID: {existing_ip.id})."
            )

        # Validate foreign keys if provided
        if location_id:
            loc = await db.get(Location, location_id)
            if not loc:
                raise EntityNotFoundError(f"Location ID '{location_id}' not found.")

        if group_id:
            grp = await db.get(CashboxGroup, group_id)
            if not grp:
                raise EntityNotFoundError(f"CashboxGroup ID '{group_id}' not found.")

        if credential_id:
            cred = await db.get(SSHCredential, credential_id)
            if not cred:
                raise EntityNotFoundError(f"SSHCredential ID '{credential_id}' not found.")

        cashbox = Cashbox(
            id=uuid.uuid4(),
            name=name,
            ip_address=validated_ip,
            ssh_port=ssh_port,
            location_id=location_id,
            group_id=group_id,
            credential_id=credential_id,
            screen_resolution=screen_resolution,
            gs_version=gs_version,
            status=status.value if isinstance(status, CashboxStatus) else str(status),
            desired_version=0,
            actual_version=0,
        )
        db.add(cashbox)
        await db.flush()
        return cashbox

    async def get_cashbox(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        load_relations: bool = False,
    ) -> Cashbox:
        """Retrieve a cashbox by ID."""
        query = select(Cashbox).where(Cashbox.id == cashbox_id)
        if load_relations:
            query = query.options(
                selectinload(Cashbox.location),
                selectinload(Cashbox.group),
                selectinload(Cashbox.credential),
            )
        result = await db.scalar(query)
        if not result:
            raise EntityNotFoundError(f"Cashbox with ID '{cashbox_id}' not found.")
        return result

    async def get_cashbox_by_ip(
        self,
        db: AsyncSession,
        ip_address: str,
        load_relations: bool = False,
    ) -> Cashbox:
        """Retrieve a cashbox by IP address."""
        validated_ip = self._validate_ip(ip_address)
        query = select(Cashbox).where(Cashbox.ip_address == validated_ip)
        if load_relations:
            query = query.options(
                selectinload(Cashbox.location),
                selectinload(Cashbox.group),
                selectinload(Cashbox.credential),
            )
        result = await db.scalar(query)
        if not result:
            raise EntityNotFoundError(f"Cashbox with IP '{validated_ip}' not found.")
        return result

    async def list_cashboxes(
        self,
        db: AsyncSession,
        location_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        status: Optional[CashboxStatus | str] = None,
        search: Optional[str] = None,
        load_relations: bool = False,
    ) -> Sequence[Cashbox]:
        """List cashboxes matching optional filters."""
        query = select(Cashbox)

        if load_relations:
            query = query.options(
                selectinload(Cashbox.location),
                selectinload(Cashbox.group),
                selectinload(Cashbox.credential),
            )

        if location_id:
            query = query.where(Cashbox.location_id == location_id)
        if group_id:
            query = query.where(Cashbox.group_id == group_id)
        if status:
            status_val = status.value if isinstance(status, CashboxStatus) else str(status)
            query = query.where(Cashbox.status == status_val)
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Cashbox.name.ilike(search_pattern),
                    Cashbox.ip_address.ilike(search_pattern),
                )
            )

        query = query.order_by(Cashbox.name.asc())
        result = await db.scalars(query)
        return result.all()

    async def update_cashbox(
        self,
        db: AsyncSession,
        cashbox_id: uuid.UUID,
        name: Optional[str] = None,
        ip_address: Optional[str] = None,
        ssh_port: Optional[int] = None,
        location_id: Optional[uuid.UUID] = None,
        group_id: Optional[uuid.UUID] = None,
        credential_id: Optional[uuid.UUID] = None,
        screen_resolution: Optional[str] = None,
        gs_version: Optional[str] = None,
        status: Optional[CashboxStatus | str] = None,
    ) -> Cashbox:
        """Update cashbox attributes."""
        cashbox = await self.get_cashbox(db, cashbox_id)

        if ip_address is not None:
            validated_ip = self._validate_ip(ip_address)
            if validated_ip != cashbox.ip_address:
                # Ensure new IP is not already taken by another cashbox
                existing_ip = await db.scalar(
                    select(Cashbox).where(
                        Cashbox.ip_address == validated_ip,
                        Cashbox.id != cashbox_id,
                    )
                )
                if existing_ip:
                    raise EntityConflictError(
                        f"IP address '{validated_ip}' is already in use by cashbox '{existing_ip.id}'."
                    )
                cashbox.ip_address = validated_ip

        if name is not None:
            cashbox.name = name.strip()
        if ssh_port is not None:
            if ssh_port < 1 or ssh_port > 65535:
                raise ValidationDomainError(f"Invalid SSH port: {ssh_port}")
            cashbox.ssh_port = ssh_port
        if location_id is not None:
            if location_id != cashbox.location_id:
                loc = await db.get(Location, location_id)
                if not loc:
                    raise EntityNotFoundError(f"Location ID '{location_id}' not found.")
                cashbox.location_id = location_id
        if group_id is not None:
            if group_id != cashbox.group_id:
                grp = await db.get(CashboxGroup, group_id)
                if not grp:
                    raise EntityNotFoundError(f"CashboxGroup ID '{group_id}' not found.")
                cashbox.group_id = group_id
        if credential_id is not None:
            if credential_id != cashbox.credential_id:
                cred = await db.get(SSHCredential, credential_id)
                if not cred:
                    raise EntityNotFoundError(f"SSHCredential ID '{credential_id}' not found.")
                cashbox.credential_id = credential_id
        if screen_resolution is not None:
            cashbox.screen_resolution = screen_resolution.strip()
        if gs_version is not None:
            cashbox.gs_version = gs_version.strip()
        if status is not None:
            cashbox.status = status.value if isinstance(status, CashboxStatus) else str(status)

        await db.flush()
        return cashbox

    async def delete_cashbox(self, db: AsyncSession, cashbox_id: uuid.UUID) -> bool:
        """Delete a cashbox from the fleet registry."""
        cashbox = await self.get_cashbox(db, cashbox_id)
        await db.delete(cashbox)
        await db.flush()
        return True
