import asyncio
import json
import logging
import os
from typing import List

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.models.schema import Document

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-3-small"

        chroma_host = os.getenv("CHROMA_HOST", "localhost")
        chroma_port = int(os.getenv("CHROMA_PORT", 8000))

        self.chroma_client = chromadb.HttpClient(
            host=chroma_host,
            port=chroma_port,
            settings=chromadb.config.Settings(anonymized_telemetry=False),
        )

        self.collection = self.chroma_client.get_or_create_collection(
            name="hr_documents", metadata={"hnsw:space": "cosine"}
        )

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000, chunk_overlap=200, separators=["\n\n", "\n", ".", " ", ""]
        )

    async def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        response = await self.openai_client.embeddings.create(
            input=texts, model=self.embedding_model
        )
        return [data.embedding for data in sorted(response.data, key=lambda x: x.index)]

    async def ingest_documents(self, db_session: AsyncSession) -> None:
        logger.info("Starting RAG document ingestion via OpenAI...")

        result = await db_session.execute(select(Document))
        documents = result.scalars().all()

        if not documents:
            logger.warning("No documents found in the database to ingest.")
            return

        ids, texts, metadatas = [], [], []

        for doc in documents:
            chunks = self.text_splitter.split_text(doc.content)
            for i, chunk in enumerate(chunks):
                texts.append(chunk)
                ids.append(f"doc_{doc.doc_id}_chunk_{i}")
                metadatas.append(
                    {
                        "doc_id": str(doc.doc_id),
                        "title": doc.title,
                        "doc_type": doc.doc_type.value if doc.doc_type else "other",
                    }
                )

        batch_size = 1000
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i : i + batch_size]
            batch_embeddings = await self._generate_embeddings(batch_texts)
            all_embeddings.extend(batch_embeddings)

        await asyncio.to_thread(
            self.collection.upsert,
            ids=ids,
            documents=texts,
            embeddings=all_embeddings,
            metadatas=metadatas,
        )
        logger.info(f"Successfully ingested {len(ids)} document chunks.")

    async def search_relevant_context(
        self, query: str, top_k: int = 3, department_scope: str = None
    ) -> str:
        query_embedding = await self._generate_embeddings([query])

        results = await asyncio.to_thread(
            self.collection.query,
            query_embeddings=query_embedding,
            n_results=top_k,
        )

        if not results["documents"] or not results["documents"][0]:
            return ""

        return "\n---\n".join(results["documents"][0])


rag_service = RAGService()
