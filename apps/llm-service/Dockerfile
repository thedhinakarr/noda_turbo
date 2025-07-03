FROM python:3.11-slim
WORKDIR /app

# --- ADD THIS LINE TO INSTALL CURL ---
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install poetry system-wide inside the container
RUN pip install poetry

# Copy ONLY the files that define the Python dependencies
COPY apps/llm-service/pyproject.toml apps/llm-service/poetry.lock* ./

# Run poetry install to download dependencies
RUN poetry config virtualenvs.create false && poetry install --only main --no-root

# Now, copy the rest of your application code
COPY apps/llm-service/main.py .

# The command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]