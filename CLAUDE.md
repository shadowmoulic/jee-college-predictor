# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

# Project Overview

This project is an AI-powered College Predictor and Counseling Platform built with:

* Next.js (Frontend + API Routes)
* Node.js (Backend Services)
* Python (Data Processing & ML Services)
* Tailwind CSS (UI)
* TypeScript
* PostgreSQL / MongoDB
* AI APIs (OpenAI, Gemini, NVIDIA NIM)

The platform helps students predict admission chances, analyze historical counseling data, compare colleges, and receive AI-assisted recommendations based on real datasets.

---

# Development Commands

## Frontend

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

## Python Services

```bash
pip install -r requirements.txt

python app.py

# Development
uvicorn main:app --reload
```

## Database

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

---

# Tech Stack

## Frontend

* Next.js 15
* React 19
* TypeScript
* Tailwind CSS
* Shadcn UI
* Lucide Icons
* Framer Motion
* React Query / TanStack Query

## Backend

* Node.js
* Next.js Route Handlers
* Express.js (optional microservices)
* REST APIs

## AI Layer

* OpenAI
* Gemini
* NVIDIA NIM

Provider selection handled through environment variables.

## Data Layer

* PostgreSQL / MongoDB
* Prisma ORM
* Redis Caching

## Python Services

Used for:

* Data preprocessing
* Cutoff analysis
* Trend analysis
* Prediction models
* AI ranking algorithms
* Data scraping

---

# Environment Variables

```env
# Application
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# AI Providers
OPENAI_API_KEY=
GEMINI_API_KEY=
NVIDIA_NIM_API_KEY=

# AI Configuration
AI_PROVIDER=openai

# WhatsApp Community
NEXT_PUBLIC_WHATSAPP_GROUP=

# Analytics
GOOGLE_ANALYTICS_ID=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

# Project Structure

```text
src/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── colleges/
│   ├── predictor/
│   └── ai/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── predictor/
│   ├── colleges/
│   └── shared/
│
├── lib/
│   ├── ai/
│   ├── db/
│   ├── cache/
│   ├── utils/
│   └── services/
│
├── hooks/
├── types/
├── constants/
└── styles/

python/
├── models/
├── services/
├── scrapers/
├── analytics/
└── datasets/

public/
```

---

# Coding Standards

## TypeScript

* Strict mode enabled.
* Avoid `any`.
* Use explicit interfaces.
* Prefer server components where possible.

## React

* Use functional components.
* Use hooks.
* Avoid unnecessary re-renders.
* Memoize expensive computations.

## Next.js

* Prefer Server Components.
* Use Route Handlers for APIs.
* Use Suspense where applicable.
* Implement proper loading states.

---

# Tailwind Guidelines

## Preferred

```tsx
className="
flex
items-center
justify-center
rounded-xl
border
bg-white
p-4
shadow-sm
"
```

## Avoid

* Excessively long utility chains.
* Inline styles unless required.
* Duplicate classes.

Use reusable components whenever possible.

---

# AI Prediction Rules

## Critical

AI must NEVER:

* Invent colleges
* Invent branches
* Invent cutoffs
* Invent placements
* Invent ranks

AI must ONLY use:

* Historical datasets
* Current database records
* Placement datasets
* Trend-analysis results

If data is unavailable:

```json
{
  "status": "insufficient_data"
}
```

Do not hallucinate.

---

# Performance Guidelines

## Required

* Dynamic imports
* Route caching
* Database indexing
* Query optimization
* Lazy loading
* Image optimization

## Avoid

* N+1 database queries
* Large client-side bundles
* Unnecessary API calls

---

# Accessibility

Every new feature must support:

* Keyboard navigation
* ARIA labels
* Screen readers
* WCAG AA compliance

---

# Security

Never expose:

* API Keys
* Database credentials
* Internal service URLs

Validate:

* All user input
* API payloads
* Query parameters

Use:

* Zod validation
* Rate limiting
* CSRF protection
* Secure headers

---

# UI/UX Standards

Design inspiration:

* Vercel
* Linear
* Notion
* Perplexity

Requirements:

* Mobile-first
* Responsive
* Fast loading
* Modern animations
* Consistent spacing
* Dark mode support

---

# Testing Checklist

Before every commit:

```bash
npm run lint
npm run build
```

Verify:

* No TypeScript errors
* No hydration issues
* Responsive layouts
* API functionality
* AI prediction accuracy
* Accessibility compliance

---

# Deployment

Frontend:

* Vercel

Backend:

* Railway
* Render
* AWS

Python Services:

* Railway
* Render
* Docker

Database:

* Neon
* Supabase
* MongoDB Atlas

---

# Golden Rule

Always prioritize:

1. Accuracy
2. Performance
3. Accessibility
4. Security
5. User Experience

AI-generated recommendations must always be explainable, data-backed, and reproducible.
