import asyncio
import time
from uuid import uuid4
import pytest
from app.adapters.mock_adapter import MockCashRegisterAdapter


@pytest.mark.asyncio
async def test_fleet_load_simulation_250_nodes():
    """
    Simulates high-concurrency publication to 250 cashier monoblocks
    distributed across 25 restaurant branches (10 cashiers per branch).
    Enforces concurrency ceiling (15 workers max) and branch ceiling (max 2 per branch).
    """
    total_cashiers = 250
    branches_count = 25
    cashiers_per_branch = 10

    # Build virtual fleet
    fleet = []
    for b_idx in range(branches_count):
        branch_id = f"branch_{b_idx + 1}"
        for c_idx in range(cashiers_per_branch):
            cashier_id = uuid4()
            ip = f"10.{b_idx + 1}.100.{c_idx + 10}"
            # Inject 5% failure/offline nodes
            is_failing = (c_idx == 0 and b_idx % 5 == 0)
            adapter = MockCashRegisterAdapter(
                cashier_id=cashier_id,
                host=ip,
                latency_ms=20,
                simulate_offline=is_failing
            )
            fleet.append({
                "cashier_id": cashier_id,
                "branch_id": branch_id,
                "ip": ip,
                "adapter": adapter
            })

    # Track concurrent active connections
    current_global_active = 0
    max_global_recorded = 0
    current_branch_active = {f"branch_{i+1}": 0 for i in range(branches_count)}
    max_branch_recorded = 0
    lock = asyncio.Lock()

    # Semaphore for global pool ceiling (15)
    global_semaphore = asyncio.Semaphore(15)
    # Semaphores per branch (max 2)
    branch_semaphores = {f"branch_{i+1}": asyncio.Semaphore(2) for i in range(branches_count)}

    success_count = 0
    failed_count = 0

    async def execute_node(node):
        nonlocal current_global_active, max_global_recorded, max_branch_recorded, success_count, failed_count
        adapter = node["adapter"]
        branch_id = node["branch_id"]

        async with global_semaphore:
            async with branch_semaphores[branch_id]:
                async with lock:
                    current_global_active += 1
                    if current_global_active > max_global_recorded:
                        max_global_recorded = current_global_active

                    current_branch_active[branch_id] += 1
                    if current_branch_active[branch_id] > max_branch_recorded:
                        max_branch_recorded = current_branch_active[branch_id]

                try:
                    # Simulated 8-step safety sequence
                    connected = await adapter.connect()
                    if not connected:
                        failed_count += 1
                        return

                    insp = await adapter.inspect()
                    if not insp.success:
                        failed_count += 1
                        return

                    await adapter.backup_database()
                    await adapter.upload_media([("banner.jpg", b"fake_content")])
                    await adapter.update_scene("2509359c-2d71-4344-9be4-7d90dd453083", '{"type":"image"}')
                    ver = await adapter.verify("2509359c-2d71-4344-9be4-7d90dd453083", '{"type":"image"}')
                    if ver.matches:
                        await adapter.refresh()
                        success_count += 1
                    else:
                        failed_count += 1
                finally:
                    await adapter.close()
                    async with lock:
                        current_global_active -= 1
                        current_branch_active[branch_id] -= 1

    start_time = time.perf_counter()
    tasks = [execute_node(n) for n in fleet]
    await asyncio.gather(*tasks)
    elapsed = time.perf_counter() - start_time

    # Verify limits
    assert max_global_recorded <= 15, f"Global limit exceeded: {max_global_recorded}"
    assert max_branch_recorded <= 2, f"Branch limit exceeded: {max_branch_recorded}"
    assert success_count + failed_count == total_cashiers
    assert success_count > 230, f"Expected majority to succeed, got {success_count}"

    print(f"\n250-Node Simulation Completed in {elapsed:.2f}s | Success: {success_count}, Failed: {failed_count} | Peak Global Workers: {max_global_recorded} | Peak Per-Branch: {max_branch_recorded}")
