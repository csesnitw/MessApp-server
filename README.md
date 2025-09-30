# MessApp Server

Express.js + MongoDB server with Google OAuth authentication and role-based access control.

## Tech Stack

- **Node.js & Express.js** - Backend framework
- **MongoDB & Mongoose** - Database
- **Google OAuth 2.0** - Authentication (stateless, token verification)
- **google-auth-library** - Token verification

## Models

- **Student** - User profiles with roles (student/admin)
- **EnrolledStudent** - Course enrollments
- **Menu** - Menu items management

## Setup

1. Install dependencies:
```bash
npm install express mongoose dotenv cors google-auth-library
```

2. Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-management
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_URL=http://localhost:3000
```

3. Run server:
```bash
npm start
```

## Routes


### Student Routes (`/api/student`)
- GET `/login` - Login using only Student Email
- GET `/upload-photo` - Upload Photo for their Mess Card
- POST `/details` - Get the Student Details
- GET `/menu` - View menu items
- - GET `/sync-token` - Sync their special dinner token usage

## Authentication

All routes require `Authorization: Bearer <google-id-token>` header. Server verifies token with Google on each request (stateless).

