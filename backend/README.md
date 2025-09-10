# Collaborative Task Manager Backend

A comprehensive backend system for a collaborative task management application built with Node.js, Express, and Supabase.

## Features

### Core Functionality
- **User Management**: JWT-based authentication with secure password handling
- **Workspace System**: Multi-tenant workspaces with role-based access control
- **Project Organization**: Projects/boards within workspaces for better organization
- **Task Management**: Full CRUD operations with subtasks, priorities, and due dates
- **Real-time Collaboration**: WebSocket integration for live updates
- **File Attachments**: Support for task-related file uploads
- **Comments & Mentions**: Threaded discussions with @username mentions
- **Activity Tracking**: Comprehensive audit log of all actions
- **Notifications**: Real-time and persistent notification system

### Technical Features
- **Security**: Row Level Security (RLS) with Supabase
- **Real-time**: Socket.IO for instant updates
- **File Upload**: Multer integration with file validation
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error management
- **Logging**: Request logging with Morgan

## Architecture

### Database Schema
- **users**: User profiles and authentication
- **workspaces**: Tenant containers for collaboration
- **workspace_members**: Role-based membership management
- **projects**: Project/board organization within workspaces
- **tasks**: Core task entities with status and priority
- **subtasks**: Hierarchical task breakdown
- **task_assignments**: Many-to-many user-task relationships
- **comments**: Discussion threads on tasks
- **attachments**: File storage metadata
- **notifications**: User notification system
- **activities**: Audit log for all actions

### API Structure
```
/api/auth          - Authentication endpoints
/api/workspaces    - Workspace management
/api/projects      - Project operations
/api/tasks         - Task CRUD and management
/api/comments      - Comment system
/api/notifications - Notification management
/api/uploads       - File upload handling
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- Supabase account and project
- Environment variables configured

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and configure:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

3. **Set up Supabase:**
   - Create a new Supabase project
   - Run the migration files in the `supabase/migrations` folder
   - Enable Row Level Security on all tables

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### API Usage

#### Authentication
```javascript
// Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com", 
  "password": "securepassword"
}
```

#### Workspaces
```javascript
// Create workspace
POST /api/workspaces
{
  "name": "My Team Workspace",
  "description": "Collaborative workspace for our team"
}

// Get user workspaces
GET /api/workspaces
```

#### Tasks
```javascript
// Create task
POST /api/tasks
{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth system",
  "priority": "high",
  "project_id": "uuid",
  "assignee_ids": ["user-uuid-1", "user-uuid-2"]
}

// Update task status
PATCH /api/tasks/:taskId/status
{
  "status": "in_progress"
}
```

### WebSocket Events

#### Client Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join rooms for real-time updates
socket.emit('join_workspace', workspaceId);
socket.emit('join_project', projectId);
socket.emit('join_task', taskId);
```

#### Real-time Events
- `task_created` - New task created
- `task_updated` - Task status/details changed
- `comment_created` - New comment added
- `attachment_uploaded` - File attached to task
- `new_notification` - User notification
- `user_typing` - Comment typing indicator

## Security

### Authentication
- JWT tokens with configurable expiration
- Bcrypt password hashing with salt rounds
- Service role separation for admin operations

### Authorization
- Role-based access control (Owner, Admin, Member, Guest)
- Row Level Security policies in Supabase
- Workspace-based data isolation
- Fine-grained permissions per operation

### Rate Limiting
- Configurable request rate limits
- Per-IP protection against abuse
- Separate limits for different endpoint types

### File Upload Security
- File type validation and filtering
- Size limits and quotas
- Secure file storage with unique names
- Access control for uploaded files

## Performance

### Database Optimization
- Strategic indexing on frequently queried columns
- Efficient join operations with proper foreign keys
- Query optimization with select projections
- Connection pooling with Supabase

### Caching Strategy
- In-memory caching for frequently accessed data
- WebSocket connection management
- Optimized real-time event broadcasting

## Monitoring & Logging

### Request Logging
- HTTP request/response logging with Morgan
- Error tracking and stack traces
- Performance metrics collection

### Activity Tracking
- Comprehensive audit trail
- User action logging
- System event monitoring

## Deployment

### Production Setup
1. Configure production environment variables
2. Set up SSL/TLS certificates
3. Configure reverse proxy (Nginx/Apache)
4. Set up monitoring and log aggregation
5. Configure backup strategies

### Environment Variables
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=your-production-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
JWT_SECRET=your-production-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5242880
```

## Contributing

1. Follow the established code structure
2. Maintain file organization (keep files under 300 lines)
3. Add proper error handling and validation
4. Include comprehensive tests
5. Update documentation for new features

## License

This project is licensed under the MIT License.