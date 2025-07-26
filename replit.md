# Personal Finance Manager

## Overview
This is a full-stack personal finance management application built with React, Express, and PostgreSQL. The application allows users to track income and expenses, categorize transactions, and view financial reports. It features Replit authentication for secure user management and uses modern web technologies for a responsive user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proper error handling
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for request/response validation

### Authentication Strategy
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Middleware**: Passport.js for authentication flow
- **Security**: HTTP-only cookies with secure settings in production

## Key Components

### Database Schema
Located in `shared/schema.ts`:
- **Users Table**: Stores user profile information (mandatory for Replit Auth)
- **Sessions Table**: Handles session persistence (mandatory for Replit Auth)
- **Categories Table**: User-defined transaction categories with icons and colors
- **Transactions Table**: Financial transactions linked to categories and users

### API Routes
Defined in `server/routes.ts`:
- **Authentication**: `/api/auth/user` for user profile retrieval
- **Categories**: CRUD operations at `/api/categories`
- **Transactions**: CRUD operations at `/api/transactions`
- **Analytics**: Monthly balance and category expense reports

### Frontend Views
- **Landing Page**: Unauthenticated welcome screen with login
- **Dashboard**: Overview of recent transactions and balance summary
- **Transactions**: Full transaction history with filtering
- **Categories**: Category management interface
- **Reports**: Analytics and spending insights

## Data Flow

1. **Authentication Flow**:
   - User clicks login → Redirected to Replit Auth
   - Successful auth → User session created in PostgreSQL
   - Frontend receives user data via `/api/auth/user`

2. **Transaction Management**:
   - User creates transaction → Form validation with Zod
   - API request to `/api/transactions` → Database insertion via Drizzle
   - UI updates via React Query cache invalidation

3. **Real-time Updates**:
   - All mutations invalidate related React Query caches
   - Optimistic updates for better user experience
   - Toast notifications for user feedback

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Pooled connections via `@neondatabase/serverless`
- **Migrations**: Managed through Drizzle Kit

### UI/UX Libraries
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library
- **date-fns**: Date manipulation and formatting
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development and build tooling
- **ESBuild**: Server-side bundling for production

## Deployment Strategy

### Development Mode
- Vite dev server for frontend hot reloading
- TSX for TypeScript execution in development
- Express middleware integration with Vite

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: ESBuild bundles server to `dist/index.js`
- Static file serving from Express in production

### Environment Configuration
- Database URL for PostgreSQL connection
- Session secrets for authentication security
- Replit-specific environment variables for auth integration

### Database Management
- Schema changes via `drizzle-kit push`
- Automatic migrations in shared schema file
- Session table management for authentication persistence

The application follows a modern full-stack pattern with clear separation of concerns, type safety throughout, and scalable architecture suitable for personal finance management with multiple users.