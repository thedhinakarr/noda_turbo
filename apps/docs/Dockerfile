# =================================================================
# FILE: apps/docs/Dockerfile
# The final, correct version with a diagnostic step.
# =================================================================
FROM rust:1.80-slim

# Install the correct, locked version of mdBook for stability
RUN cargo install mdbook --version 0.4.48 --locked

# Set the working directory inside the container
WORKDIR /book

# Copy all the documentation source files from the local machine's
# ./apps/docs directory into the container's /book directory.
COPY ./apps/docs/ .

# --- DIAGNOSTIC STEP ---
# List all files recursively to prove the copy was successful.
# This will show us the exact file tree inside the container during the build.
RUN ls -R

# Expose the port that mdBook will run on
EXPOSE 3000

# Run the mdbook server.
CMD ["mdbook", "serve", "--hostname", "0.0.0.0", "--port", "3000"]
