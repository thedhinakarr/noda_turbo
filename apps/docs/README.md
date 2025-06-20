
#  Noda Copilot Documentation Site

This is the documentation site for the entire Noda Turbo project. It serves as a central repository for all project-related information, guides, and technical details, aiming to provide comprehensive resources for developers and users.

## Overview

Built with Next.js App Router, this site is designed to present markdown-based content in an easily navigable and aesthetically pleasing format. It utilizes the shared UI and styling configurations from the monorepo to ensure consistency.

## Content Structure

The actual documentation content is written in Markdown files, primarily located within the `markdown_files/` directory (or directly within the `app/` structure, depending on how content routing is configured).

## Technologies Used

* [Next.js 15 (App Router)](https://nextjs.org/)
* [React 19](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* Markdown parsing libraries (e.g., `remark`, `rehype`, `next-mdx-remote` - *to be installed and configured when developing this app*)
* [Tailwind CSS](https://tailwindcss.com/) (managed via `@repo/tailwind-config`)
* Shared packages from `@repo/` (ESLint, TypeScript configs, UI components)

## Getting Started

Make sure you have followed the [Monorepo Root README](../../README.md) for overall setup, including installing `pnpm` and Docker Compose.

### 1. Install Dependencies (from Monorepo Root)

Ensure all monorepo dependencies are installed:

```bash
# From noda_turbo/ root
pnpm install
```

### 2\. Run the Development Server

```bash
# From noda_turbo/ root
pnpm --filter=docs dev
# or, from apps/docs/
# pnpm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) (or the port specified by Next.js) in your browser to view the documentation site.

## Project Structure

```
docs/
├── public/                 # Static assets (images, fonts)
├── app/                    # Next.js App Router directory for pages and routing
│   ├── favicon.ico
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout for the docs site
│   └── page.tsx            # Main page (e.g., homepage for docs)
├── markdown_files/         # Directory containing your actual markdown documentation content
│   └── index.md
├── __tests__/              # Unit tests for any custom components or logic within the docs app
├── next.config.ts          # Next.js configuration for the docs site
├── package.json            # Project dependencies
├── postcss.config.js
├── tsconfig.json
└── README.md               # This file
```

