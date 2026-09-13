# -*- coding: utf-8 -*-
"""PostgreSQL 16 Declarative Models Package. All entities registered on Base.metadata."""
from src.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from src.models.cashbox import Cashbox, CashboxGroup, CashboxStatus, Location
from src.models.credential import SSHAuthType, SSHCredential
from src.models.media import AdMode, MediaAsset
from src.models.playlist import Playlist, PlaylistItem
from src.models.configuration import AdConfiguration, ConfigurationAssignment
from src.models.inventory import CashboxInventory
from src.models.deployment import Deployment, DeploymentStep, DeploymentStatus, RollbackSnapshot, StepStatus
from src.models.audit import AuditLog, SystemSetting
from src.models.user import User

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Location",
    "CashboxGroup",
    "Cashbox",
    "CashboxStatus",
    "SSHCredential",
    "SSHAuthType",
    "MediaAsset",
    "AdMode",
    "Playlist",
    "PlaylistItem",
    "AdConfiguration",
    "ConfigurationAssignment",
    "CashboxInventory",
    "Deployment",
    "DeploymentStep",
    "DeploymentStatus",
    "RollbackSnapshot",
    "StepStatus",
    "AuditLog",
    "SystemSetting",
    "User",
]
