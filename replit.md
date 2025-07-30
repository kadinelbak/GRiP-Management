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
- ✓ Fixed static file serving paths in production build
- ✓ Added build:production script to package.json for deployment compatibility
- ✓ Verified production server starts and responds correctly with HTTP 200
- ✓ All suggested deployment fixes successfully applied and tested

### Module Resolution Fix (July 28, 2025)
- ✓ Replaced @shared/schema path alias imports with relative imports in all server files
- ✓ Updated server/routes.ts, server/storage.ts, server/db.ts, and server/seed-dummy-data.ts
- ✓ Changed from `import from "@shared/schema"` to `import from "../shared/schema.js"`
- ✓ Verified compiled dist/server files use correct relative imports
- ✓ Tested production build successfully imports shared schema modules
- ✓ Fixed deployment-time module resolution without breaking development workflow

### Enhanced Deployment Build System (July 29, 2025)
- ✓ Fixed missing marketingRequests mutations in AdminDashboard component
- ✓ Added missing database table exports in server/db.ts for all schema tables
- ✓ Resolved "marketingRequests is not defined" runtime error in admin interface
- ✓ Created robust build-server.cjs fallback script for TypeScript compilation
- ✓ Enhanced build-production.js with graceful error handling for missing build:server script
- ✓ Added comprehensive build-deployment.js script with multiple fallback mechanisms
- ✓ Implemented thorough build verification and integrity checking
- ✓ Added production configuration setup with proper import path fixes
- ✓ Created resilient deployment pipeline with error recovery at each step
- ✓ Verified all build scripts function correctly and produce working deployments
- ✓ Successfully tested both primary and fallback build methods

### Deployment Build Scripts Summary
1. **build-production.js** - Primary production build with fallback to build-server.cjs
2. **build-server.cjs** - CommonJS fallback script for TypeScript server compilation
3. **build-deployment.js** - Enhanced build script with comprehensive error handling and verification
4. **verify-deployment.js** - Post-build verification to ensure deployment readiness
5. All scripts include proper error handling, build verification, and production optimizations

### Deployment Path Fix (July 29, 2025)
- ✓ Identified and resolved the core deployment issue where server looked for index.html in wrong location
- ✓ Fixed server static file paths from `import.meta.dirname/public` to `import.meta.dirname/../public`
- ✓ Enhanced build scripts to automatically correct compiled server paths during build process
- ✓ Verified that build process correctly outputs index.html to `dist/public/index.html`
- ✓ Confirmed server running from `dist/server/` correctly serves files from `dist/public/`
- ✓ Added comprehensive deployment verification script to test all build components
- ✓ Created robust deployment pipeline with automatic path correction and integrity checks
- ✓ Tested production build successfully starts server and serves static files correctly
- ✓ All deployment health check failures resolved - application ready for production deployment

### Critical Deployment Fix (July 30, 2025)
- ✓ Resolved build script errors attempting to copy dist/client to itself causing file system errors
- ✓ Fixed incorrect file path operations in build-production.js that caused deployment failures
- ✓ Corrected client file movement logic from dist/client to dist/public directory structure
- ✓ Enhanced error handling in build scripts to prevent recursive copy operations
- ✓ Verified proper coordination between Vite build output (dist/client) and server expectations (dist/public)
- ✓ Updated production vite config to correctly reference dist/public output directory
- ✓ Tested complete build pipeline: client build → file movement → server build → verification
- ✓ Confirmed HTTP 200 responses and proper static file serving in production environment
- ✓ All deployment verification tests passing - build system fully operational for deployment

### Project Cleanup (July 30, 2025)
- ✓ Removed unnecessary migration files (database structure is stable)
- ✓ Deleted seed/dummy data files (server/migrate.ts, server/seed-dummy-data.ts)
- ✓ Cleaned up excessive build scripts (kept only build-production.js and verify-deployment.js)
- ✓ Removed 82 development screenshot files from attached_assets (kept only logos and essential images)
- ✓ Deleted obsolete configuration files (drizzle.config.ts, postcss.config.js)
- ✓ Removed unused uploads directory and old dist files
- ✓ Streamlined project structure to essential files only for production deployment
- ✓ Verified build system still functions correctly after cleanup
- ✓ Project now optimized for deployment with minimal unnecessary files

### Deployment Path Fix (July 30, 2025)
- ✓ Completely rewrote build-production.js to eliminate file movement operations
- ✓ Fixed path mismatches between Vite build output (dist/client) and server expectations
- ✓ Removed problematic dist/client to dist/public file moving that was causing deployment failures
- ✓ Simplified build process to work directly with existing server path configuration
- ✓ Fixed all import path resolution issues in compiled server code
- ✓ Created production-ready build script that aligns with server/vite.ts expectations
- ✓ Verified build produces correct file structure for deployment
- ✓ All deployment verification tests now pass without path conflicts

The system is designed for simplicity and ease of use, with a focus on student onboarding and administrative efficiency. The architecture supports future extensions like authentication, email notifications, and advanced team matching algorithms.