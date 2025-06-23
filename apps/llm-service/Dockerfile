# =================================================================
# FILE: apps/llm-service/Dockerfile
# (Updated with a more robust installation process)
# =================================================================
FROM python:3.9-slim

# Set environment variables for clean Python execution in Docker
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /usr/src/app

# --- FIX: Ensure pip's binary directory is in the system's PATH ---
# This guarantees that executables installed by pip are found.
ENV PATH="/root/.local/bin:${PATH}"

# Install dependencies into the user's site-packages directory
COPY apps/llm-service/requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy the application code into the container
COPY apps/llm-service/ .

# Expose the port the app runs on
EXPOSE 5001

# Run the application as a Python module, which is the most reliable method
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]