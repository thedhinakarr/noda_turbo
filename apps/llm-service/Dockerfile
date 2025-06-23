# =================================================================
# FILE: apps/llm-service/Dockerfile
# (Create this new file)
# =================================================================
# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the requirements file into the container
COPY apps/llm-service/requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code into the container
COPY apps/llm-service/ .

# Expose the port the app runs on
EXPOSE 5001

# Define the command to run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]