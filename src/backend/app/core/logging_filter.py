import logging
import re

# Mask pattern for UCS LS5 license keys (e.g. alphanumeric blocks)
LICENSE_REGEX = re.compile(
    r'\b[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}-[A-Za-z0-9]{4,8}\b'
)


class LicenseKeyMaskingFilter(logging.Filter):
    """
    Ensures that UCS LS5 license keys or sensitive token strings are never
    printed in clear text in stdout, logs, or error traces.
    """
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = LICENSE_REGEX.sub("****-****-****-XXXX", record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {
                    k: LICENSE_REGEX.sub("****-****-****-XXXX", str(v)) if isinstance(v, str) else v
                    for k, v in record.args.items()
                }
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    LICENSE_REGEX.sub("****-****-****-XXXX", str(v)) if isinstance(v, str) else v
                    for v in record.args
                )
        return True


def mask_license_string(text: str) -> str:
    if not text:
        return text
    return LICENSE_REGEX.sub("****-****-****-XXXX", text)


LicenseMaskFilter = LicenseKeyMaskingFilter
