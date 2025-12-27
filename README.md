# Visitor Management System API

A Node.js API for managing visitors in apartments/societies and corporate offices with role-based authentication.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 📱 OTP-based login for residents and security guards
- 🔑 Password-based login for admins
- 👥 Role-based access control (Super Admin, Society Admin, Security, Resident)
- 🗄️ PostgreSQL database
- ✅ Input validation with express-validator

## Tech Stack

- Node.js + Express.js
- PostgreSQL
- Prisma ORM 7.2.0 (with PostgreSQL adapter)
- JWT (jsonwebtoken)
- bcrypt (for password hashing)
- express-validator (for input validation)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update `.env` with your database credentials and JWT secret:

```env
PORT=1111
NODE_ENV=development

# Prisma uses DATABASE_URL
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/visitor_management?schema=public

JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

UPLOAD_PATH=uploads
```

### 3. Initialize Database

Run the database initialization script to create tables and seed roles:

```bash
npm run db:init
```

This will:
- Generate Prisma Client
- Run database migrations to create all tables
- Seed `roles` table with: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT

**Alternative commands:**
- `npm run db:migrate` - Run migrations only
- `npm run db:generate` - Generate Prisma Client
- `npm run db:seed` - Seed database only
- `npm run db:studio` - Open Prisma Studio (database GUI)

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:1111` (or your configured PORT)

### 5. Access API Documentation

Once the server is running, access Swagger UI at:
```
http://localhost:1111/api-docs
```

The Swagger documentation provides:
- Interactive API testing
- Request/response schemas
- Authentication examples
- Error response documentation

### 6. React Native Integration Documentation

For React Native developers, comprehensive API documentation is available:

- **[React Native Quick Start Guide](./docs/REACT_NATIVE_QUICK_START.md)** - Quick setup and minimal code examples
- **[Complete Authentication API Documentation](./docs/API_DOCUMENTATION_V1_AUTHENTICATION.md)** - Comprehensive guide including:
  - All authentication endpoints with detailed examples
  - Complete React Native service implementation
  - Token management and refresh flow
  - Error handling best practices
  - Security recommendations
  - Authentication flow diagrams

## API Endpoints

### Authentication

#### 1. Login (Password-based - for Admins)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",  // or "mobile": "1234567890"
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "mobile": "1234567890",
      "role": "SUPER_ADMIN",
      "society_id": null,
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Request OTP
```http
POST /auth/otp
Content-Type: application/json

{
  "mobile": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "1234567890",
    "otp": "123456",  // Only in development mode
    "expiresIn": "10 minutes"
  }
}
```

#### 3. Verify OTP and Login
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "mobile": "1234567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": 2,
      "name": "John Doe",
      "mobile": "1234567890",
      "role": "RESIDENT",
      "society_id": 1,
      "status": "active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 4. Refresh Access Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## User Roles

1. **SUPER_ADMIN** - Full system access
2. **SOCIETY_ADMIN** - Manage their society
3. **SECURITY** - Security guard access
4. **RESIDENT** - Resident access

## Database Schema

### Users Table
- `id` (PK)
- `society_id` (FK, nullable)
- `name`
- `mobile` (unique)
- `email` (unique, nullable)
- `password_hash` (nullable - only for admins)
- `role_id` (FK)
- `status` (active/blocked)
- `created_at`
- `updated_at`

### Roles Table
- `id` (PK)
- `name` (SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT)
- `created_at`

## Authentication Middleware

Use the authentication middleware to protect routes:

```javascript
import { authenticate, authorize } from './middleware/auth.js';

// Protect route - requires authentication
router.get('/protected', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Protect route - requires specific role
router.get('/admin-only', authenticate, authorize('SUPER_ADMIN', 'SOCIETY_ADMIN'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

## Project Structure

```
visitor-api/
├── config/
│   └── swagger.js         # Swagger/OpenAPI configuration
├── lib/
│   └── prisma.js          # Prisma Client instance
├── controllers/
│   └── authController.js  # Authentication logic
├── prisma/
│   ├── schema.prisma      # Prisma schema (database models)
│   ├── seed.js            # Database seed script
│   └── migrations/        # Prisma migrations (auto-generated)
├── middleware/
│   └── auth.js            # Authentication & authorization middleware
├── routes/
│   └── authRoutes.js      # Auth routes with Swagger docs
├── utils/
│   ├── jwt.js             # JWT utilities
│   └── otp.js             # OTP utilities
├── app.js                 # Express app setup with Swagger UI
├── server.js              # Server entry point
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
└── package.json
```

## Development Notes

- OTP is returned in response during development mode only
- In production, integrate with SMS service (Twilio, AWS SNS, etc.)
- Refresh tokens expire after 7 days
- Access tokens expire after 1 day (configurable)
- All passwords are hashed using bcrypt

## Next Steps

- [ ] Integrate SMS service for OTP delivery
- [ ] Add visitor management endpoints
- [ ] Add society/office management
- [ ] Add subscription management
- [ ] Add file upload functionality
- [ ] Add logging and monitoring
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)

