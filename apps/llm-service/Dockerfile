# apps/llm-service/Dockerfile

FROM python:3.11-slim
WORKDIR /app

# --- ADD THIS LINE TO INSTALL CURL (if not already there) ---
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install poetry system-wide inside the container
RUN pip install poetry

# Copy pyproject.toml and poetry.lock if it exists (for dependency resolution)
# We will ensure poetry.lock is for 0.5.4 locally via `poetry update` in next step
COPY apps/llm-service/pyproject.toml apps/llm-service/poetry.lock* ./

# Run poetry install to download dependencies
# --no-root is important to prevent installing the project itself in /usr/local
# --sync ensures installed versions match poetry.lock (which we'll prepare for 0.5.4)
RUN poetry install --only main --no-root --sync

# Now, copy the rest of your application code
COPY apps/llm-service/main.py .

# The command to run the application
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]