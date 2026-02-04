# Termipest AI Assistant

## Overview

A pest control AI chatbot application for Termipest Limited, a professional pest control company based in Kenya. The application provides an intelligent chat interface where users can ask questions about pest identification, prevention, and treatment. The system uses Google's Gemini AI through Replit's AI Integrations service, with a local fallback mechanism for when AI services are unavailable.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for smooth message transitions
- **Build Tool**: Vite with hot module replacement

The frontend is organized as a single-page application with the main chat interface on the home page. Components are split between custom components (`ChatMessage`, `Header`, `FooterControls`) and reusable shadcn/ui primitives.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints defined in shared route schemas with Zod validation

Key endpoints:
- `POST /api/chat` - Send messages and receive AI responses
- `GET /api/status` - Check AI service availability

The backend implements a dual-response strategy:
1. Primary: Google Gemini AI via Replit's AI Integrations
2. Fallback: Local rule-based responses for common pest control queries

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)

Database tables:
- `leads` - Contact form submissions
- `conversations` - Chat session records
- `messages` - Individual chat messages with conversation references

### AI Integration Pattern
The application uses Replit's AI Integrations service which provides Gemini-compatible API access. The integration requires:
- `AI_INTEGRATIONS_GEMINI_API_KEY` - API key from Replit
- `AI_INTEGRATIONS_GEMINI_BASE_URL` - Custom base URL for the service

A comprehensive system prompt defines the AI's persona as "Termipest Assistant" with specific formatting rules for responses including Markdown tables, safety callouts, and executive summaries.

### Code Organization
```
client/src/          # React frontend
  components/        # UI components (custom + shadcn)
  hooks/             # React Query hooks for API calls
  pages/             # Page components
  lib/               # Utilities and query client

server/              # Express backend
  routes.ts          # API route handlers
  fallback.ts        # Local response logic
  storage.ts         # Database operations
  replit_integrations/ # AI service utilities

shared/              # Code shared between client/server
  schema.ts          # Database schemas
  routes.ts          # API route definitions with Zod schemas
```

## External Dependencies

### AI Services
- **Google Gemini** via Replit AI Integrations - Primary AI response generation
- Supported models: gemini-2.5-flash (fast), gemini-2.5-pro (advanced reasoning), gemini-2.5-flash-image (image generation)

### Database
- **PostgreSQL** - Primary data store, connection via DATABASE_URL environment variable
- Uses `connect-pg-simple` for session storage capability

### Key NPM Packages
- `@google/genai` - Google Generative AI client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Async state management
- `react-markdown` - Markdown rendering in chat messages
- `framer-motion` - Animation library
- `zod` - Runtime type validation for API contracts

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Replit AI Integrations key
- `AI_INTEGRATIONS_GEMINI_BASE_URL` - Replit AI Integrations endpoint