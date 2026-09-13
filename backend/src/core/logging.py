# -*- coding: utf-8 -*-
"""Structured logging engine with automated secret masking and redaction."""
import json
import logging
import re
import sys
from datetime import datetime, timezone
from typing import Any

# Patterns matching sensitive keys and credential formats
SECRET_KEY_PATTERNS = re.compile(
    r"(password|passwd|secret|private_key|authorization|bearer|master_key|gs_master_key|token|auth_token)",
    re.IGNORECASE,
)

# Regex matching key=value, "key": "value", or Bearer tokens in text strings
SECRET_VALUE_SUB = re.compile(
    r"(?i)(password|secret|private_key|token|authorization|master_key)\s*[:=]\s*['\"]?([^\s,'\"&]+)['\"]?",
)


class SecretMaskingFilter(logging.Filter):
    """Logging filter that redacts passwords, private keys, and master secrets."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self._mask_string(record.msg)

        if record.args:
            if isinstance(record.args, dict):
                record.args = self._mask_dict(record.args)
            elif isinstance(record.args, (list, tuple)):
                record.args = tuple(
                    self._mask_item(item) for item in record.args
                )

        return True

    def _mask_string(self, text: str) -> str:
        """Replace detected secret values with [REDACTED]."""
        return SECRET_VALUE_SUB.sub(r"\1=***REDACTED***", text)

    def _mask_item(self, item: Any) -> Any:
        if isinstance(item, str):
            return self._mask_string(item)
        if isinstance(item, dict):
            return self._mask_dict(item)
        return item

    def _mask_dict(self, d: dict) -> dict:
        masked = {}
        for k, v in d.items():
            if isinstance(k, str) and SECRET_KEY_PATTERNS.search(k):
                masked[k] = "***REDACTED***"
            elif isinstance(v, dict):
                masked[k] = self._mask_dict(v)
            elif isinstance(v, str):
                masked[k] = self._mask_string(v)
            else:
                masked[k] = v
        return masked


class JSONFormatter(logging.Formatter):
    """Structured JSON formatter with ISO-8601 UTC timestamps."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Attach custom extra attributes if present
        for key, value in record.__dict__.items():
            if key not in (
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                "message", "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "stack_info", "thread", "threadName"
            ):
                log_entry[key] = value

        return json.dumps(log_entry, default=str)


def setup_logging(log_level: str = "INFO", use_json: bool = False) -> None:
    """Initialize root logger with secret masking and chosen formatting."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicates
    for h in list(root_logger.handlers):
        root_logger.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(SecretMaskingFilter())

    if use_json:
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Obtain a logger instance with secret masking filter attached."""
    logger = logging.getLogger(name)
    logger.addFilter(SecretMaskingFilter())
    return logger
