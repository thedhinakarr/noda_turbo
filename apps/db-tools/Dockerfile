# File: apps/db-tools/Dockerfile

FROM python:3.10-slim

WORKDIR /app

# Install uv, the fast Python package installer
RUN pip install uv

# Copy and install dependencies
COPY ./apps/db-tools/requirements.txt .
# CORRECTED: Added the --system flag to install packages into the global environment
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the application source code
COPY ./apps/db-tools/main.py .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
