# Git-Plus Repository Manager

## Overview

Git-Plus is a comprehensive developer platform for managing and tracking GitHub repositories with advanced automated scanning and webhook integration capabilities. The application combines repository management, real-time webhook processing, analytics dashboards, and team collaboration features in a modern full-stack web application.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application
The application follows a monolithic architecture with clear separation between client and server code:
- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js with TypeScript for API services
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design

### Database Architecture
The system uses PostgreSQL as the primary database with Drizzle ORM providing:
- Type-safe database schema definitions in `shared/schema.ts`
- Automated migrations through `drizzle-kit`
- Connection pooling via Neon's serverless PostgreSQL client
- Session storage using PostgreSQL for user authentication

### Authentication & Authorization
Implements traditional session-based authentication:
- Passport.js with local strategy for username/password authentication
- Password hashing using Node.js crypto module with scrypt
- Session management with express-session and PostgreSQL session store
- Protected routes with middleware-based authorization

### Real-Time Event Processing
The system includes a sophisticated event processing architecture:
- **GitHub Webhooks**: Direct integration for receiving repository events
- **AWS SQS Integration**: Message queue system for reliable event processing
- **Java Microservice**: Separate SQS consumer service for processing repository events
- **Retry Logic**: Built-in message retry handling with exponential backoff

### API Architecture
RESTful API design with:
- Express.js router-based endpoint organization
- JSON request/response handling
- Error middleware for consistent error responses
- Repository CRUD operations
- Webhook management endpoints
- Real-time event streaming capabilities

### Frontend Architecture
Modern React application structure:
- **Component-Based Design**: Modular UI components using shadcn/ui
- **State Management**: React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Authentication Context**: Custom React context for auth state

### Development & Deployment
Containerized development environment:
- Docker and Docker Compose for local development
- Vite for fast development builds and HMR
- TypeScript for type safety across the entire stack
- ESBuild for production bundling

## External Dependencies

### Cloud Services
- **AWS SQS**: Message queuing service for asynchronous event processing
- **AWS SES**: Email service for password reset and notification emails
- **SendGrid**: Alternative email service (legacy support)
- **Neon Database**: Serverless PostgreSQL hosting

### GitHub Integration
- **GitHub Webhooks**: Real-time repository event notifications
- **GitHub API**: Repository metadata and statistics retrieval

### Core Technologies
- **PostgreSQL**: Primary database for storing users, repositories, and events
- **Redis/Memory Store**: Session storage and caching (configurable)
- **Docker**: Containerization for development and deployment

### Monitoring & Analytics
- **Custom Analytics Dashboard**: Built-in repository metrics and team productivity tracking
- **Real-time Event Logging**: Comprehensive logging for webhook events and system operations