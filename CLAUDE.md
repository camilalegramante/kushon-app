# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is the **Kushon** project - a title and volume management application with user authentication and admin features. The project follows a full-stack architecture:

### Structure
- **backend/**: NestJS API with TypeScript
- **frontend/**: React application with Vite, TypeScript, and React Router
- **Root**: Monorepo with shared planning documentation

### Technology Stack
- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite + React Router
- **Database**: PostgreSQL with Prisma schema
- **Planning**: Portuguese documentation in PLANEJAMENTO.md

## Development Commands

### Backend (NestJS)
Run these commands from the `backend/` directory:

```bash
# Development
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debug and watch

# Building and Production
npm run build              # Build the application
npm run start:prod         # Start in production mode

# Code Quality
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting

# Testing
npm run test               # Unit tests
npm run test:watch         # Unit tests in watch mode
npm run test:cov           # Tests with coverage
npm run test:e2e          # End-to-end tests
```

### Frontend (React + Vite)
Run these commands from the `frontend/` directory:

```bash
# Development
npm run dev                # Start dev server with HMR

# Building
npm run build              # TypeScript build + Vite build
npm run preview            # Preview production build

# Code Quality  
npm run lint               # ESLint
```

## Database Setup

The project uses Prisma with PostgreSQL:

1. Copy `.env.example` to `.env` and configure `DATABASE_URL`
2. Database connection format: `postgresql://user:password@localhost:5432/kushon`
3. Prisma client is generated to `backend/generated/prisma`

## Application Routes

The frontend uses React Router with these routes:
- `/` - LoginPage (default)
- `/register` - RegisterPage  
- `/user` - UserPanel
- `/admin` - AdminPanel

## Key Features Being Developed

Based on PLANEJAMENTO.md, the application includes:
- User registration and authentication
- Title and volume management
- Email notifications
- User and admin dashboards
- Cloud deployment (Vercel)

## Development Workflow

The project follows this development cycle:
1. Planning and requirements gathering
2. Base structure (NestJS, React, Prisma)  
3. Core functionality implementation
4. Admin area and notifications
5. Testing, validation, and deployment
6. Extensive developer debug logging