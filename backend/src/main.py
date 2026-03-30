import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langfuse import get_client

from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.routers import analytics, employees, goals
from src.services.rag_service import rag_service

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

MAX_INGESTION_RETRIES = 5
RETRY_DELAY_SECONDS = 3


@asynccontextmanager
async def lifespan(app: FastAPI):
    if rag_service.collection.count() == 0:
        logger.info("ChromaDB collection is empty — starting document ingestion...")
        for attempt in range(1, MAX_INGESTION_RETRIES + 1):
            try:
                async with AsyncSessionLocal() as session:
                    await rag_service.ingest_documents(session)
                break
            except Exception as e:
                if attempt < MAX_INGESTION_RETRIES:
                    logger.warning(
                        "RAG ingestion attempt %d/%d failed: %s — retrying in %ds...",
                        attempt, MAX_INGESTION_RETRIES, e, RETRY_DELAY_SECONDS,
                    )
                    await asyncio.sleep(RETRY_DELAY_SECONDS)
                else:
                    logger.error(
                        "RAG ingestion failed after %d attempts: %s",
                        MAX_INGESTION_RETRIES, e,
                    )
    else:
        logger.info(
            "ChromaDB already has %d chunks, skipping ingestion.",
            rag_service.collection.count(),
        )
    yield
    get_client().flush()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="API для модуля управления целями и оценки SMART",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(goals.router)
    app.include_router(analytics.router)
    app.include_router(employees.router)

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": settings.PROJECT_NAME}

    return app


app = create_app()
