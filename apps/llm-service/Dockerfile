FROM python:3.11-slim
WORKDIR /app

# Install Poetry for dependency management
RUN pip install poetry

# Copy dependency files from the llm-service app directory.
COPY apps/llm-service/pyproject.toml apps/llm-service/poetry.lock* ./

# Install dependencies, but not the project itself.
RUN poetry config virtualenvs.create false && poetry install --only main --no-root

# Copy the application code from the llm-service app directory.
COPY apps/llm-service/main.py .

# FINAL FIX: Use the shell form of CMD to allow environment variable expansion.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-5001}