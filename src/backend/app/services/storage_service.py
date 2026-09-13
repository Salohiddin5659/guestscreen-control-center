import io
import logging
from typing import BinaryIO, Optional, Tuple
import aioboto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger("gs_control_center.storage")


class StorageService:
    def __init__(self):
        self.session = aioboto3.Session()
        self.endpoint_url = f"http://{settings.MINIO_ENDPOINT}" if not settings.MINIO_ENDPOINT.startswith("http") else settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.default_bucket = settings.MINIO_BUCKET_NAME

    def _get_client(self):
        return self.session.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name="us-east-1",
        )

    async def ensure_bucket_exists(self, bucket_name: Optional[str] = None) -> None:
        bucket = bucket_name or self.default_bucket
        async with self._get_client() as s3:
            try:
                await s3.head_bucket(Bucket=bucket)
            except ClientError as e:
                error_code = e.response.get("Error", {}).get("Code")
                if error_code in ("404", "NoSuchBucket"):
                    logger.info(f"Creating S3 bucket: {bucket}")
                    try:
                        await s3.create_bucket(Bucket=bucket)
                    except ClientError as ce:
                        if ce.response.get("Error", {}).get("Code") not in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
                            raise
                elif error_code in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
                    pass
                else:
                    logger.error(f"Error checking bucket {bucket}: {e}")
                    raise

    async def upload_file(
        self,
        file_obj: BinaryIO,
        key: str,
        content_type: str,
        bucket_name: Optional[str] = None
    ) -> str:
        bucket = bucket_name or self.default_bucket
        await self.ensure_bucket_exists(bucket)
        async with self._get_client() as s3:
            await s3.upload_fileobj(
                file_obj,
                bucket,
                key,
                ExtraArgs={"ContentType": content_type}
            )
            return key

    async def download_file_bytes(
        self,
        key: str,
        bucket_name: Optional[str] = None
    ) -> bytes:
        bucket = bucket_name or self.default_bucket
        async with self._get_client() as s3:
            response = await s3.get_object(Bucket=bucket, Key=key)
            async with response["Body"] as stream:
                return await stream.read()

    async def head_object(
        self,
        key: str,
        bucket_name: Optional[str] = None
    ) -> Optional[dict]:
        bucket = bucket_name or self.default_bucket
        async with self._get_client() as s3:
            try:
                response = await s3.head_object(Bucket=bucket, Key=key)
                return {
                    "content_length": response.get("ContentLength", 0),
                    "content_type": response.get("ContentType"),
                    "etag": response.get("ETag"),
                }
            except ClientError as e:
                if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                    return None
                raise

    async def object_exists(self, key: str, bucket_name: Optional[str] = None) -> bool:
        head = await self.head_object(key, bucket_name)
        return head is not None

    async def delete_object(
        self,
        key: str,
        bucket_name: Optional[str] = None
    ) -> bool:
        bucket = bucket_name or self.default_bucket
        try:
            async with self._get_client() as s3:
                await s3.delete_object(Bucket=bucket, Key=key)
                return True
        except Exception as e:
            logger.warning(f"Failed to delete S3 object {bucket}/{key}: {e}")
            return False


storage_service = StorageService()
