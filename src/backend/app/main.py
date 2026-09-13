import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging_filter import LicenseMaskFilter
from app.services.storage_service import storage_service

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.topology import router as topology_router
from app.api.v1.media import router as media_router
from app.api.v1.advertising_blocks import router as ad_blocks_router
from app.api.v1.publications import router as publications_router
from app.api.v1.audit import router as audit_router
from app.api.v1.events import router as events_router
from app.api.v1.settings import router as settings_router
from app.api.v1.users import router as users_router

import asyncio
from app.services.heartbeat import start_heartbeat_loop

# Attach license mask filter to root logger
root_logger = logging.getLogger()
root_logger.addFilter(LicenseMaskFilter())


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logging.info("Starting GS Control Center backend...")
    try:
        await storage_service.ensure_bucket_exists()
    except Exception as e:
        logging.warning(f"Could not connect to MinIO on startup: {e}")

    # Launch background cashier fleet heartbeat monitor (checks every 30s)
    heartbeat_task = asyncio.create_task(start_heartbeat_loop(interval_seconds=30))
    try:
        yield
    finally:
        # Shutdown actions
        logging.info("Shutting down GS Control Center backend...")
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root healthcheck
@app.get("/healthz", tags=["System"])
async def healthz():
    return {"status": "ok", "version": settings.VERSION}

# Include API v1 routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
# Canonical Topology API (/api/v1/topology/*)
app.include_router(topology_router, prefix=f"{settings.API_V1_STR}/topology")
# Compatibility alias (/api/v1/*)
app.include_router(topology_router, prefix=settings.API_V1_STR)
app.include_router(media_router, prefix=settings.API_V1_STR)
app.include_router(ad_blocks_router, prefix=settings.API_V1_STR)
app.include_router(publications_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
