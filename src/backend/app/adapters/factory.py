from typing import Optional
from uuid import UUID
from app.adapters.base import CashRegisterAdapter
from app.adapters.mock_adapter import MockCashRegisterAdapter
from app.adapters.ssh_adapter import ProductionCashRegisterAdapter
from app.core.config import settings


class CashRegisterAdapterFactory:
    @staticmethod
    def get_adapter(
        cashier_id: UUID,
        host: str,
        username: str,
        port: int = 22,
        password: Optional[str] = None,
        private_key: Optional[str] = None,
        use_mock: Optional[bool] = None
    ) -> CashRegisterAdapter:
        if not username or not username.strip():
            raise ValueError(f"username is strictly required for CashRegisterAdapter (cashier {cashier_id})")
        # Determine whether to use mock
        is_mock = use_mock if use_mock is not None else settings.USE_MOCK_ADAPTER

        if is_mock:
            return MockCashRegisterAdapter(
                cashier_id=cashier_id,
                host=host,
                port=port,
                username=username,
                password=password,
                private_key=private_key
            )
        else:
            return ProductionCashRegisterAdapter(
                cashier_id=cashier_id,
                host=host,
                port=port,
                username=username,
                password=password,
                private_key=private_key
            )
