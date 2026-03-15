import asyncio
import logging
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import AsyncSessionLocal
from src.models.schema import Document, Department
from src.services.rag_service import rag_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_rag(db: AsyncSession):
    # 1. Ensure the IT Department exists (from our previous seed)
    result = await db.execute(
        select(Department).where(Department.name == "IT Department")
    )
    it_dept = result.scalars().first()

    if not it_dept:
        logger.error("IT Department not found! Please run 'python -m src.seed' first.")
        return

    # 2. Check if the document already exists
    doc_result = await db.execute(
        select(Document).where(Document.title == "Стратегия IT-отдела на Q3 2026")
    )
    if doc_result.scalars().first():
        logger.info("RAG document already seeded. Skipping.")
        return

    logger.info("Injecting fake Corporate Strategy document into PostgreSQL...")

    # 3. Create a highly specific Fake Document to impress the judges
    strategy_doc = Document(
        doc_type="Strategy",
        title="Стратегия IT-отдела на Q3 2026",
        content=(
            "Главные стратегические приоритеты IT-отдела на 3 квартал 2026 года:\n"
            "1. Оптимизация облачной инфраструктуры: Снижение затрат на AWS на 15% за счет миграции на serverless архитектуру.\n"
            "2. Безопасность и Compliance: Внедрение Zero Trust Network Access (ZTNA) для всех удаленных сотрудников.\n"
            "3. Ускорение Time-to-Market: Переход на CI/CD пайплайны нового поколения, сокращение времени деплоя до 10 минут.\n"
            "4. Модернизация фронтенда: Полный отказ от устаревших фреймворков и переход на React 18+ с использованием Vite.\n"
            "5. AI-Интеграция: Внедрение LLM-инструментов во внутренние HR и ERP процессы компании."
        ),
        valid_from=date(2026, 7, 1),
        valid_to=date(2026, 9, 30),
        owner_department_id=it_dept.id,
        department_scope="IT",
        keywords=["AWS", "Security", "CI/CD", "React", "AI", "Q3", "2026"],
    )

    db.add(strategy_doc)
    await db.commit()
    await db.refresh(strategy_doc)

    logger.info(
        "Document saved to DB. Starting RAG ingestion to ChromaDB (OpenAI Embeddings)..."
    )

    # 4. Trigger the RAG pipeline to chunk and embed the document
    await rag_service.ingest_documents(db)

    logger.info("✅ RAG seeding complete! The AI is now armed with corporate secrets.")


async def main():
    async with AsyncSessionLocal() as session:
        await seed_rag(session)


if __name__ == "__main__":
    asyncio.run(main())
