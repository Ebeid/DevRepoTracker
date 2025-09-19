# Git-Plus

A comprehensive developer platform for managing and tracking GitHub repositories with advanced automated scanning and webhook integration capabilities.

## Features
- Repository management and tracking
- GitHub webhook integration for real-time updates
- Automated repository scanning
- Analytics dashboard
- Authentication system

## Prerequisites
- Docker and Docker Compose
- Git

## Quick Start with Docker

1. Clone the repository
```bash
git clone <your-repo-url>
cd <repo-name>
```

2. Start the application with Docker Compose
```bash
docker-compose up --build
```

The application will be available at `http://localhost:5000`

## Local Development Setup (without Docker)

1. Prerequisites:
- Node.js v20+ (recommended)
- PostgreSQL 15+
- Git

2. Install dependencies
```bash
npm install
```

3. Set up your PostgreSQL database
   - Create a new PostgreSQL database
   - Note down the connection details (host, port, database name, username, password)

4. Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<database>
PGUSER=<username>
PGHOST=<host>
PGPASSWORD=<password>
PGDATABASE=<database>
PGPORT=<port>

# Session
SESSION_SECRET=<your-session-secret>
```

5. Push the database schema
```bash
npm run db:push
```

6. Start the development server
```bash
npm run dev
```

## Available Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push schema changes to the database

## Docker Commands
- `docker-compose up --build` - Build and start all services
- `docker-compose down` - Stop all services
- `docker-compose down -v` - Stop all services and remove volumes
- `docker-compose exec app npm run db:push` - Run database migrations
- `docker-compose logs -f` - View logs from all services

## Setting up GitHub Webhooks
1. In your repository's settings on GitHub, go to Webhooks > Add webhook
2. For the Payload URL, use: `http://your-domain/api/webhook/<repository-id>`
3. Content type: `application/json`
4. Secret: Use the webhook secret provided when enabling webhooks in the repository analytics panel
5. Select events:
   - Push events
   - Pull requests

## Architecture

Git-Plus follows a modern full-stack architecture with clear separation of concerns. The platform integrates multiple services to provide comprehensive repository management and real-time event processing capabilities.

### System Architecture Diagram

```mermaid
flowchart TD
  subgraph Client[Frontend (React + Vite)]
    UI[React App]
  end

  subgraph Server[Backend (Express.js + TypeScript)]
    API[REST API Routes]
    Auth[Passport.js (Local Strategy + Sessions)]
    Storage[Storage Interface]
    Webhook[GitHub Webhook Endpoint]
    Email[Email Service (SES/SendGrid)]
    Retry[Message Retry Handler]
  end

  subgraph DB[PostgreSQL (Drizzle ORM)]
    Users[(users)]
    Repos[(repositories)]
    Events[(webhook_events)]
    Reset[(password_reset_tokens)]
  end

  subgraph GitHub[GitHub]
    GHAPI[GitHub API]
    GHWebhooks[GitHub Webhooks]
  end

  subgraph AWS[AWS]
    SQS[(SQS Queue)]
    SES[AWS SES]
    SendGrid[SendGrid]
  end

  subgraph JavaSvc[Java Microservice]
    Consumer[SQS Consumer (Java)]
    Processor[MessageProcessor]
  end

  UI -->|HTTP (React Query)| API
  API -->|Session auth| Auth
  API -->|CRUD via Storage| Storage -->|SQL| DB

  UI -->|POST /api/repositories| API
  API -->|Send RepositoryEvent| SQS

  GHWebhooks -->|POST /api/webhook/:id| Webhook
  Webhook -->|Verify HMAC| Webhook
  Webhook -->|Persist event| Events
  Webhook -->|Send templated message| SQS

  Consumer -->|Poll messages| SQS
  Consumer --> Processor

  API -->|Password reset/notifications| Email
  Email --> SES
  Email -->|fallback| SendGrid

  API -->|Outbound calls| GHAPI

  Retry -. requeue on failure .-> SQS
```

### Key Components

- **Frontend (React + Vite)**: Modern React application with TypeScript, TanStack Query for state management, and shadcn/ui components
- **Backend (Express.js)**: RESTful API server with Passport.js authentication and session management
- **Database (PostgreSQL)**: Relational database with Drizzle ORM for type-safe operations
- **GitHub Integration**: Direct webhook integration for real-time repository events
- **AWS SQS**: Message queue for reliable asynchronous event processing
- **Java Microservice**: Dedicated SQS consumer for processing repository events
- **Email Services**: AWS SES and SendGrid for notifications and password resets

### Data Flow

1. **User Authentication**: Session-based authentication with encrypted passwords
2. **Repository Management**: CRUD operations with automatic SQS notifications
3. **Webhook Processing**: GitHub webhooks are verified (HMAC) and stored, then forwarded to SQS
4. **Asynchronous Processing**: Java microservice consumes SQS messages for background processing
5. **Email Notifications**: Automated emails for password resets and system notifications

## Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
├── server/                # Backend Express application
│   ├── auth.ts           # Authentication setup
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Database schema and types
```

## Tech Stack
- React (frontend)
- Express (backend)
- TypeScript
- PostgreSQL with Drizzle ORM
- TanStack Query for data fetching
- shadcn/ui components
- Tailwind CSS for styling

## Configuring Webhook Events
For each repository you want to monitor:

1. Navigate to the repository's analytics panel in the application
2. Click on the "Webhook" tab
3. Click "Enable Webhook" to generate a webhook secret
4. Copy the webhook URL and secret
5. Add these to your GitHub repository's webhook settings
6. The application will now receive real-time updates for:
   - Push events (commits)
   - Pull request events (open, close, etc.)

## Troubleshooting
- If you encounter database connection issues, ensure your PostgreSQL server is running and the connection details in `.env` are correct
- For webhook-related issues, check the GitHub repository's webhook settings and ensure the secret matches
- Make sure your application is accessible from GitHub's webhook service if you're testing locally (you may need to use a service like ngrok)
- When using Docker, make sure ports 5000 and 5432 are not already in use

## Docker Troubleshooting
- If the app container fails to start, check the logs with `docker-compose logs app`
- If the database connection fails, ensure the database container is running with `docker-compose ps`
- To reset the database, remove the volumes with `docker-compose down -v` and start again

## Environment Variables Reference
- `DATABASE_URL`: PostgreSQL connection string
- `PGUSER`: PostgreSQL username
- `PGHOST`: PostgreSQL host
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `PGPORT`: PostgreSQL port
- `SESSION_SECRET`: Secret for session management (make it long and random)
- `NODE_ENV`: Application environment ('development' or 'production')