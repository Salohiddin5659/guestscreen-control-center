# -*- coding: utf-8 -*-
"""Unit tests for OrderBoundaryValidator (T062)."""
from unittest.mock import AsyncMock

import pytest

from src.adapters.command_parsers import CommandResult
from src.core.exceptions import SafetyBoundaryViolationError
from src.services.order_boundary_validator import NON_AD_TABLES, OrderBoundaryValidator


@pytest.mark.asyncio
async def test_compute_table_fingerprint_valid():
    """Verify table row count and SHA-256 fingerprint computation."""
    mock_cmd = AsyncMock()
    mock_cmd._run_command.return_value = CommandResult(
        command="SELECT * FROM screens;",
        exit_status=0,
        stdout="1|MainScreen|1024|768\n2|CustomerScreen|1024|768\n",
        stderr="",
    )

    validator = OrderBoundaryValidator(command_adapter=mock_cmd)
    mock_conn = AsyncMock()

    count, sha = await validator.compute_table_fingerprint(mock_conn, "screens")
    assert count == 2
    assert len(sha) == 64


@pytest.mark.asyncio
async def test_compute_table_fingerprint_unauthorized_table_raises():
    """Verify inspecting unauthorized table raises SafetyBoundaryViolationError."""
    validator = OrderBoundaryValidator()
    mock_conn = AsyncMock()

    with pytest.raises(SafetyBoundaryViolationError) as exc:
        await validator.compute_table_fingerprint(mock_conn, "unauthorized_table")
    assert "Unauthorized table inspection" in str(exc.value)


@pytest.mark.asyncio
async def test_capture_baseline_collects_all_non_ad_tables():
    """Verify capture_baseline inspects all non-ad tables."""
    mock_cmd = AsyncMock()
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="row1\nrow2\n",
        stderr="",
    )
    validator = OrderBoundaryValidator(command_adapter=mock_cmd)
    mock_conn = AsyncMock()

    baseline = await validator.capture_baseline(mock_conn)
    assert set(baseline.keys()) == set(NON_AD_TABLES)
    for table in NON_AD_TABLES:
        assert baseline[table][0] == 2
        assert len(baseline[table][1]) == 64


@pytest.mark.asyncio
async def test_verify_boundary_unmodified_success():
    """Verify boundary verification succeeds when tables are unchanged."""
    mock_cmd = AsyncMock()
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="data_line_1\ndata_line_2\n",
        stderr="",
    )
    validator = OrderBoundaryValidator(command_adapter=mock_cmd)
    mock_conn = AsyncMock()

    baseline = await validator.capture_baseline(mock_conn)
    # Verifying against identical output succeeds without exception
    await validator.verify_boundary_unmodified(mock_conn, baseline)


@pytest.mark.asyncio
async def test_verify_boundary_row_count_change_raises():
    """Verify that any row count change in non-ad table raises SafetyBoundaryViolationError."""
    mock_cmd = AsyncMock()
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="data1\ndata2\n",
        stderr="",
    )
    validator = OrderBoundaryValidator(command_adapter=mock_cmd)
    mock_conn = AsyncMock()

    baseline = await validator.capture_baseline(mock_conn)

    # Subsequent query returns 3 rows instead of 2
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="data1\ndata2\nextra_row\n",
        stderr="",
    )

    with pytest.raises(SafetyBoundaryViolationError) as exc:
        await validator.verify_boundary_unmodified(mock_conn, baseline)
    assert "row count changed" in str(exc.value)


@pytest.mark.asyncio
async def test_verify_boundary_checksum_change_raises():
    """Verify that content change with same row count raises SafetyBoundaryViolationError."""
    mock_cmd = AsyncMock()
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="data1\ndata2\n",
        stderr="",
    )
    validator = OrderBoundaryValidator(command_adapter=mock_cmd)
    mock_conn = AsyncMock()

    baseline = await validator.capture_baseline(mock_conn)

    # Same row count (2), but modified content
    mock_cmd._run_command.return_value = CommandResult(
        command="test",
        exit_status=0,
        stdout="data1\nMODIFIED_VALUE\n",
        stderr="",
    )

    with pytest.raises(SafetyBoundaryViolationError) as exc:
        await validator.verify_boundary_unmodified(mock_conn, baseline)
    assert "checksum changed" in str(exc.value)
