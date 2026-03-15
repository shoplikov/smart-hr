FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1

RUN pip install --no-cache-dir uv

COPY pyproject.toml ./

RUN uv pip install -r pyproject.toml

COPY src/ ./src/
COPY prompts.yaml ./
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY prompts.yaml ./

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]