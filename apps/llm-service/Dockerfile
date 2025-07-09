# apps/llm-service/Dockerfile

FROM python:3.11-slim
WORKDIR /app

# +++ ADD THIS LINE TO INSTALL CURL +++
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install poetry system-wide inside the container
RUN pip install poetry

# Copy only the dependency definition files
COPY ./apps/llm-service/pyproject.toml ./

# Install dependencies
RUN poetry install --directory . --with dev --no-root

# Copy the entire 'src' directory into the container
COPY ./apps/llm-service/src ./src

# The command to run the application from the new entrypoint
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5001"]