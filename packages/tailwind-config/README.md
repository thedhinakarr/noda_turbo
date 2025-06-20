# 🎨 @repo/tailwind-config

This package centralizes Tailwind CSS configurations for the Noda Turbo monorepo. It ensures a consistent design system and unified styling conventions across all applications and shared UI components.

## Overview

By using this package, you avoid duplicating Tailwind CSS setup and theme configurations across different projects. It allows for a single source of truth for your design tokens, colors, spacing, typography, and other utility classes.

## Usage

To use this shared Tailwind CSS configuration in an application within the `noda_turbo` monorepo:

1.  **Install the package:**
    In your `apps/<your-app-name>/package.json` (e.g., `apps/dashboard-frontend/package.json`), add this as a `devDependency`:

    ```json
    {
      "devDependencies": {
        "@repo/tailwind-config": "workspace:*"
      }
    }
    ```

2.  **Extend the configuration in `tailwind.config.ts`:**
    In your project's `tailwind.config.ts` file (e.g., `apps/dashboard-frontend/tailwind.config.ts`), extend the shared configuration:

    ```javascript
    // apps/dashboard-frontend/tailwind.config.ts
    import type { Config } from 'tailwindcss';
    import sharedConfig from '@repo/tailwind-config';

    const config: Config = {
      // You can spread the shared configuration here
      ...sharedConfig,
      content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        // Add paths for other components/packages that use Tailwind from this app
        '../../packages/ui/**/*.{js,ts,jsx,tsx}', // Example: if using shared UI components
      ],
      // Add any app-specific Tailwind configurations or overrides here
      theme: {
        extend: {
          // Custom themes, colors, fonts specific to this app
        },
      },
      plugins: [],
    };

    export default config;
    ```
    (Note: The `shared-styles.css` file within `packages/tailwind-config` can be imported globally in your `globals.css` if it contains base styles that apply across apps.)

## Project Structure
 ```
tailwind-config/
├── postcss.config.js       # PostCSS configuration used by Tailwind
├── shared-styles.css       # Optional: Base CSS or common utilities to be imported globally
├── index.ts                # Exports the Tailwind config object
├── package.json            # Project dependencies
└── README.md               # This file
 ```

