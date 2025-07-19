# apps/llm-service/Dockerfile

# Use a specific version for reproducibility
FROM python:3.11.9-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Poetry separately to ensure it's available
RUN pip install --no-cache-dir poetry

# --- Dependency Installation Layer ---
# This is the most critical part. We copy ONLY the dependency files first.
# Docker will cache this layer and only re-run it if pyproject.toml changes.
COPY apps/llm-service/pyproject.toml ./

# Install dependencies using Poetry.
# This command tells Poetry to find pyproject.toml in the current directory (`/app`) and install.
RUN poetry install --no-interaction --no-ansi --no-root

# --- Application Code Layer ---
# Now, copy all the application code, including your `src` directory
# and the `train_vanna.py` script.
COPY apps/llm-service/ .

# The command to run your application
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5001"]