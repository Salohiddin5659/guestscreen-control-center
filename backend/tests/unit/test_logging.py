# -*- coding: utf-8 -*-
"""Unit tests for structured logging and automated secret redaction."""
import logging
from src.core.logging import SecretMaskingFilter, setup_logging, get_logger


def test_secret_masking_in_string_message():
    """Verify passwords, keys, and master secrets are redacted in log string messages."""
    filter_ = SecretMaskingFilter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="Connecting with password=SuperSecret123 and token=xyz987abc",
        args=(),
        exc_info=None,
    )
    filter_.filter(record)
    assert "SuperSecret123" not in record.msg
    assert "xyz987abc" not in record.msg
    assert "password=***REDACTED***" in record.msg
    assert "token=***REDACTED***" in record.msg


def test_secret_masking_in_dict_args():
    """Verify secrets inside dict arguments are redacted."""
    filter_ = SecretMaskingFilter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=20,
        msg="User payload: %(username)s",
        args={"username": "admin", "password": "PlainTextPassword", "private_key": "MIIE..."},
        exc_info=None,
    )
    filter_.filter(record)
    args_dict = record.args if isinstance(record.args, dict) else record.args[0]
    assert args_dict["username"] == "admin"
    assert args_dict["password"] == "***REDACTED***"
    assert args_dict["private_key"] == "***REDACTED***"
