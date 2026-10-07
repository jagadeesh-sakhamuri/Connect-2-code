# Connect 2 Code (C2C)

Modern Placement Preparation & Coding Assessment Platform built with React 19, Vite, Redux Toolkit, and Tailwind CSS.

## Architecture

- **Public & Student Hub**: Landing Page, Curated DSA Sheet, Practice Problem Catalog, Company Guides, Exam Patterns, Roadmap Visualizers, Aptitude / Verbal / Logical Prep, and Interview Questions.
- **Admin Hub**: Question Management (CRUD, Test Cases, Reference Group Linking), Company Management, and Real-Time Dashboard Metrics.
- **Backend API**: Connected to Java Spring Boot REST service via unified `apiClient` with automatic JWT Bearer token cookie management and session refresh.

## Scripts

- `npm run dev`: Launch local Vite development server
- `npm run build`: Production client bundle build
- `npm run lint`: Fast code linting via Oxlint
- `npm run preview`: Preview production build locally

