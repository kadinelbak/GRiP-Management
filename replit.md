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
2. Backend compiles to `dist/` using TypeScript compiler with ES2020 module support
3. Static files served by Express in production
4. Development mode uses Vite middleware for hot reloading

### TypeScript Configuration (Updated July 28, 2025)
- **Main tsconfig.json**: Configured for client development with ES modules and JSX
- **tsconfig.server.json**: Separate configuration for server build with ES2020 support
- **Import.meta support**: Properly configured to handle ES module features like import.meta.dirname
- **Build script**: Custom build-server.cjs handles TypeScript compilation with correct module resolution

### Recent Changes (Updated July 28, 2025)
- ✓ Fixed TypeScript compilation errors for deployment builds
- ✓ Added proper ES2020 module support for import.meta usage  
- ✓ Created separate TypeScript configurations for client and server
- ✓ Resolved module resolution errors with @shared/schema imports
- ✓ Added skipLibCheck to bypass third-party library type conflicts
- ✓ Fixed ES module import paths with explicit .js extensions for production builds
- ✓ Updated tsconfig.server.json to exclude vite.config.ts from compilation
- ✓ Added proper file extensions to all local imports in server files
- ✓ Verified successful build process generating dist/server/vite.js correctly

### Deployment Fix (July 28, 2025)
- ✓ Resolved "Cannot find module vite.config" deployment error
- ✓ Created post-build transformation to fix import paths in compiled server code
- ✓ Enhanced build-production.js script with vite config handling
- ✓ Added scripts/copy-vite-config.js for regular builds
- ✓ Implemented proper ES module resolution in production environment
- ✓ Verified production server starts and responds correctly
- ✓ All suggested deployment fixes successfully applied

### Module Resolution Fix (July 28, 2025)
- ✓ Replaced @shared/schema path alias imports with relative imports in all server files
- ✓ Updated server/routes.ts, server/storage.ts, server/db.ts, and server/seed-dummy-data.ts
- ✓ Changed from `import from "@shared/schema"` to `import from "../shared/schema.js"`
- ✓ Verified compiled dist/server files use correct relative imports
- ✓ Tested production build successfully imports shared schema modules
- ✓ Fixed deployment-time module resolution without breaking development workflow

The system is designed for simplicity and ease of use, with a focus on student onboarding and administrative efficiency. The architecture supports future extensions like authentication, email notifications, and advanced team matching algorithms.