
# 📦 @repo/ui

This package contains shared UI components that are designed for reuse across all applications within the Noda Turbo monorepo. It ensures design consistency and accelerates frontend development by providing a single source for common UI elements.

## Overview

Components in this package are built with React and styled using Tailwind CSS (via the `@repo/tailwind-config`). They are highly reusable and serve as the building blocks for the `dashboard-frontend` and `docs` applications.

## Usage

To use components from this shared UI package in an application (e.g., `dashboard-frontend` or `docs`):

1.  **Install the package:**
    In your `apps/<your-app-name>/package.json`, add this as a `dependency`:

    ```json
    {
      "dependencies": {
        "@repo/ui": "workspace:*"
      }
    }
    ```
    (Note: It's a `dependency` because these are runtime components, not just dev tools.)

2.  **Import and use components:**
    You can import and use any exported component directly in your React/Next.js files:

    ```typescript jsx
    // Example: apps/dashboard-frontend/app/page.tsx
    import { Button } from '@repo/ui'; // Assuming 'Button' is exported from @repo/ui

    export default function MyPage() {
      return (
        <div>
          <Button onClick={() => alert('Hello!')}>Click Me</Button>
          {/* Other UI components */}
        </div>
      );
    }
    ```

### Example Components (Illustrative)

* `Button`: A styled button component.
* `Card`: A general-purpose card container.
* `Input`: A reusable form input field.
* `Spinner`: A loading indicator.
* `TurborepoLogo`: (Already exists in your setup) A simple SVG logo component.

## Project Structure

````

ui/
├── src/
│   ├── components/         \# Individual UI components (e.g., Button.tsx, Card.tsx)
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── styles.css          \# Tailwind-generated CSS for UI components
│   └── index.ts            \# Entry point for exporting components
├── dist/                   \# Compiled JavaScript/TypeScript output
├── package.json            \# Project dependencies (React, etc.)
├── tsconfig.json           \# TypeScript configuration for the UI library
└── README.md               \# This file

```