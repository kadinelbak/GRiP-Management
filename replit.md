# GRiP Team Management System

## Overview

This is a full-stack web application for managing team assignments and project requests for GRiP (Generational Relief in Prosthetics). The system allows students to apply for technical teams, sign up for additional teams, submit project requests, and provides an admin dashboard for managing all operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern monorepo structure with a clear separation between frontend and backend code:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Replit-optimized with development tools integration

## Key Components

### Frontend Architecture
- **React Router**: Uses `wouter` for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with connection pooling
- **API Design**: RESTful API with structured error handling
- **Data Validation**: Zod schemas shared between frontend and backend

### Database Schema
The system manages five main entities:
- **Teams**: Technical and additional teams with capacity management
- **Applications**: Student applications with skills and availability tracking
- **Additional Team Signups**: Separate signup process for non-technical teams
- **Project Requests**: External project submissions
- **Admin Settings**: System configuration

### Authentication & Authorization
Currently, the system operates without authentication, focusing on form submissions and data management. The admin dashboard is accessible without restrictions.

## Data Flow

1. **Student Applications**: Students fill out forms that validate client-side and submit to REST endpoints
2. **Team Assignment**: Automatic assignment algorithm matches students to teams based on preferences and availability
3. **Admin Management**: Dashboard provides CRUD operations for all entities with real-time data updates
4. **Data Export**: CSV export functionality for administrative reporting

## External Dependencies

- **Database**: Neon PostgreSQL (configured via DATABASE_URL)
- **UI Components**: Radix UI primitives for accessibility
- **Icons**: Lucide React for consistent iconography
- **Development Tools**: Replit-specific plugins for error handling and debugging

## Deployment Strategy

The application is optimized for Replit deployment:
- **Development**: Uses Vite dev server with HMR and Express backend
- **Production**: Builds static assets and runs Express server
- **Database Migrations**: Drizzle Kit for schema management
- **Environment**: Expects DATABASE_URL for PostgreSQL connection

### Build Process
1. Frontend builds to `dist/public` using Vite
2. Backend bundles to `dist/index.js` using esbuild
3. Static files served by Express in production
4. Development mode uses Vite middleware for hot reloading

The system is designed for simplicity and ease of use, with a focus on student onboarding and administrative efficiency. The architecture supports future extensions like authentication, email notifications, and advanced team matching algorithms.