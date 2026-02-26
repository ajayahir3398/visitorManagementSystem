# API Versioning Guide

This document explains the API versioning structure and best practices for the Visitor Management System API.

## Directory Structure

```
project-root/
├── routes/
│   ├── index.js              # Main router - mounts all versions
│   └── v1/                   # API Version 1
│       ├── index.js         # V1 route aggregator
│       └── authRoutes.js    # V1 auth routes
├── controllers/
│   └── v1/                   # API Version 1 controllers
│       ├── authController.js
│       └── healthController.js
└── config/
    └── swagger/
        ├── paths/
        │   ├── index.js      # Path aggregator
        │   └── v1/           # V1 path definitions
        │       ├── index.js
        │       ├── auth.js
        │       └── health.js
        └── schemas/          # Shared schemas (can be versioned if needed)
```

## API Endpoints

### Current Version (v1)

- `GET /api/v1/health` - Health check
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/otp` - Request OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/refresh-token` - Refresh token

## Adding a New Version

### Step 1: Create Version Directories

```bash
mkdir -p routes/v2
mkdir -p controllers/v2
mkdir -p config/swagger/paths/v2
```

### Step 2: Create Version Routes

Create `routes/v2/index.js`:

```javascript
import express from 'express';
import authRoutes from './authRoutes.js';

const router = express.Router();
router.use('/auth', authRoutes);
export default router;
```

### Step 3: Create Version Controllers

Copy and modify controllers from previous version:

```bash
cp -r controllers/v1 controllers/v2
# Modify as needed
```

### Step 4: Update Main Routes

In `routes/index.js`:

```javascript
import v1Routes from './v1/index.js';
import v2Routes from './v2/index.js'; // Add new version

router.use('/v1', v1Routes);
router.use('/v2', v2Routes); // Mount new version
```

### Step 5: Create Swagger Documentation

Create `config/swagger/paths/v2/index.js`:

```javascript
import authPaths from './auth.js';

export default {
  ...authPaths,
};
```

Update `config/swagger/paths/index.js`:

```javascript
import v1Paths from './v1/index.js';
import v2Paths from './v2/index.js'; // Add new version

export default {
  ...v1Paths,
  ...v2Paths, // Include new version
};
```

### Step 6: Update Swagger Config (if needed)

If v2 has different schemas, create `config/swagger/schemas/v2/` and update the main index.

## Versioning Best Practices

### 1. **Backward Compatibility**

- Keep previous versions active for at least 6-12 months
- Document deprecation notices in Swagger
- Provide migration guides

### 2. **Breaking Changes**

- Major version bump (v1 → v2) for breaking changes:
  - Removing endpoints
  - Changing request/response structure
  - Changing authentication methods
  - Changing error formats

### 3. **Non-Breaking Changes**

- Minor updates within same version:
  - Adding new optional fields
  - Adding new endpoints
  - Adding new query parameters

### 4. **Version Lifecycle**

```
v1 (Current) → v2 (Development) → v1 (Deprecated) → v1 (Retired)
```

### 5. **Deprecation Strategy**

```javascript
// In routes/v1/authRoutes.js
router.post(
  '/login',
  (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', 'Mon, 01 Jan 2024 00:00:00 GMT');
    res.set('Link', '</api/v2/auth/login>; rel="successor-version"');
    next();
  },
  validateLogin,
  login
);
```

## Version Detection

The API automatically detects version from URL:

- `/api/v1/*` → Version 1
- `/api/v2/*` → Version 2
- No version → Default to latest or return error

## Testing Versions

```bash
# Test v1
curl http://localhost:1111/api/v1/health

# Test v2 (when created)
curl http://localhost:1111/api/v2/health
```

## Migration Example

When migrating from v1 to v2:

1. **Create v2 with new structure**
2. **Keep v1 active**
3. **Add deprecation headers to v1**
4. **Update clients to v2**
5. **Monitor v1 usage**
6. **Retire v1 after grace period**

## Swagger Documentation

Each version has its own Swagger paths:

- V1: `config/swagger/paths/v1/`
- V2: `config/swagger/paths/v2/`

Schemas can be shared or versioned:

- Shared: `config/swagger/schemas/`
- Versioned: `config/swagger/schemas/v1/`, `config/swagger/schemas/v2/`

## Benefits

✅ **Clear separation** of versions
✅ **Easy maintenance** - each version is isolated
✅ **Scalable** - easy to add new versions
✅ **Backward compatible** - old versions remain active
✅ **Well documented** - Swagger per version
✅ **Type safe** - Controllers per version
