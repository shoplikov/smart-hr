import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.routers import analytics, goals
from src.services.rag_service import rag_service

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        if rag_service.collection.count() == 0:
            logger.info("ChromaDB collection is empty — starting document ingestion...")
            async with AsyncSessionLocal() as session:
                await rag_service.ingest_documents(session)
        else:
            logger.info(
                f"ChromaDB already has {rag_service.collection.count()} chunks, skipping ingestion."
            )
    except Exception as e:
        logger.error(f"RAG ingestion failed on startup: {e}")
    yield


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

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": settings.PROJECT_NAME}

    return app


app = create_app()
