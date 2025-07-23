# File: apps/rag-service/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Install uv, the fast Python package installer
RUN pip install uv

# Copy and install dependencies
COPY ./apps/rag-service/requirements.txt .
# CORRECTED: Added the --system flag to install packages into the global environment
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the application source code
COPY ./apps/rag-service/main.py .

# Expose the port the app will run on
EXPOSE 8004

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
