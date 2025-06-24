# =================================================================
# FILE: apps/llm-service/Dockerfile
# This is the final, robust version that will work.
# =================================================================
FROM python:3.9-slim

# Set environment variables for clean Python execution
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /usr/src/app

# Copy and install dependencies system-wide (no --user flag)
COPY apps/llm-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY apps/llm-service/ .

# Expose the service's port
EXPOSE 5001

# Run the application as a Python module. This is the most reliable method.
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]
