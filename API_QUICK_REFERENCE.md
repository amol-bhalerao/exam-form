# Quick API Reference - All Endpoints

## Authentication

All endpoints marked with 🔒 require authentication header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Institutes API

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/institutes` | List approved institutes |
| GET | `/api/institutes/list` | List approved institutes (alternative) |
| POST | `/api/institutes/register` | Register institute admin for existing institute |

### Authenticated Endpoints 🔒

| Method | Endpoint | Auth Role | Description |
|--------|----------|-----------|-------------|
| GET | `/api/institutes/search` | Any | **Search institutes** by name/code/district |
| GET | `/api/institutes/me/teachers` | INSTITUTE | **Get teachers** for current institute |
| POST | `/api/institutes/me/teachers` | INSTITUTE | **Add teacher** to current institute |
| GET | `/api/institutes/me/teachers/history` | INSTITUTE | **Check teacher history** by government ID |

### Super Admin Only 🔐

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/institutes` | Create new institute |
| GET | `/api/institutes/users` | List pending institute users |
| GET | `/api/institutes/users/all` | List all institute users |
| GET | `/api/institutes/users/:id` | Get specific user details |
| POST | `/api/institutes/users/create` | **Create institute user directly** |
| POST | `/api/institutes/users/invite` | Invite institute admin |
| PATCH | `/api/institutes/users/:id` | Update institute user |
| PATCH | `/api/institutes/users/:id/status` | Change user status |
| PATCH | `/api/institutes/users/:id/approve` | Approve pending institute user |

---

## Teacher API

### Board Admin Only 🔐

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/institutes/board/teachers` | List all teachers across institutes |
| PATCH | `/api/institutes/board/teachers/:id` | Update teacher details |

---

## Database Sync API (Super Admin Only 🔐)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/migrations/schema/info` | View database schema and table info |
| GET | `/api/migrations/sync/status` | Check table counts for verification |
| GET | `/api/migrations/export/:table` | Export table data as JSON |
| POST | `/api/migrations/verify` | Test database connectivity |
| GET | `/api/migrations/history` | View applied migrations |
| GET | `/api/migrations/sync/institutes` | View all institutes with counts |
| POST | `/api/migrations/compare` | Compare/search specific records |

---

## Authentication API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| POST | `/api/auth/google` | Login with Google SSO |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (revoke token) |
| POST | `/api/auth/verify` | Verify token validity |

---

## Users API 🔒

| Method | Endpoint | Auth Role | Description |
|--------|----------|-----------|-------------|
| GET | `/api/users/roles` | Any | List available roles |
| GET | `/api/users/count` | SUPER_ADMIN | Get user counts by role |

---

## Students API 🔒

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/students/me` | Update own profile |
| GET | `/api/students/:studentId/applications` | Get student applications |
| PATCH | `/api/students/me/previous-exams` | Update previous exam history |
| PATCH | `/api/students/me/bank-details` | Update bank details |

---

## Admin Dashboard 🔐

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/status` | System health status |

---

## Common Query Parameters

### Search Endpoints
```
?query=search_term    # Text to search for
?q.search=term        # Alternative syntax
```

### Pagination (where supported)
```
?take=20         # Number of records
?skip=0          # Offset
```

### Filtering
```
?status=ACTIVE    # Filter by status
?active=true      # Filter by activity
```

---

## Response Formats

### Success Response
```json
{
  "ok": true,
  "data": { }
}
```

### Validation Error (422)
```json
{
  "error": "VALIDATION_ERROR",
  "issues": [
    {
      "path": ["fieldName"],
      "code": "invalid_type",
      "message": "Invalid input: expected string"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "error": "UNAUTHORIZED",
  "message": "Token expired or invalid"
}
```

### Authorization Error (403)
```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to access this resource"
}
```

### Server Error (500)
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Error description"
}
```

---

## Example Requests

### Search Institutes
```bash
curl "http://localhost:3000/api/institutes/search?query=Delhi" \
  -H "Authorization: Bearer TOKEN"
```

### Get Teachers for Institute
```bash
curl http://localhost:3000/api/institutes/me/teachers \
  -H "Authorization: Bearer INSTITUTE_TOKEN"
```

### Add Teacher to Institute
```bash
curl -X POST http://localhost:3000/api/institutes/me/teachers \
  -H "Authorization: Bearer INSTITUTE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Teacher Name",
    "governmentId": "12345678",
    "designation": "Teacher",
    "email": "teacher@email.com",
    "mobile": "9876543210"
  }'
```

### Check Teacher History
```bash
curl "http://localhost:3000/api/institutes/me/teachers/history?governmentId=12345678" \
  -H "Authorization: Bearer INSTITUTE_TOKEN"
```

### Create Institute User (Super Admin)
```bash
curl -X POST http://localhost:3000/api/institutes/users/create \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instituteId": 5,
    "username": "admin_user",
    "password": "SecurePassword123",
    "email": "admin@institute.com"
  }'
```

### Check Database Sync Status
```bash
curl http://localhost:3000/api/migrations/sync/status \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### Export Institutes Data
```bash
curl http://localhost:3000/api/migrations/export/institutes \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  > institutes_backup.json
```

---

## Role-Based Access

| Role | Can Access |
|------|-----------|
| **SUPER_ADMIN** | Everything + migration/admin endpoints |
| **BOARD** | Institute management, teacher management |
| **INSTITUTE** | Teachers data, student applications |
| **STUDENT** | Own profile and applications |

---

## Database Tables (For Reference)

- `users` - User accounts
- `roles` - User roles
- `institutes` - Educational institutes
- `students` - Student records
- `teachers` - Teacher records
- `streams` - Academic streams (HSC, SSC)
- `subjects` - Subject definitions
- `exams` - Exam schedules
- `applications` - Student applications
- `news` - News/announcements

---

## Important Headers

```
Authorization: Bearer JWT_TOKEN      # Required for authenticated endpoints
Content-Type: application/json       # For POST/PATCH requests
Accept: application/json             # Expected response format
```

---

## Status Codes Summary

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | ✅ Data returned |
| 201 | Created - Resource created | ✅ Teacher added |
| 400 | Bad Request - Invalid input | ❌ Missing required field |
| 401 | Unauthorized - No/invalid token | ❌ Token expired |
| 403 | Forbidden - No permission | ❌ Not super admin |
| 404 | Not Found - Resource doesn't exist | ❌ Institute not found |
| 409 | Conflict - Duplicate/conflict | ❌ Username already exists |
| 422 | Unprocessable Entity - Validation error | ❌ Invalid data format |
| 500 | Server Error - Internal error | ❌ Database connection failed |

---

## Getting Started

1. **Login** to get token:
   ```bash
   POST /api/auth/login
   ```

2. **Use token** in all requests:
   ```bash
   Authorization: Bearer TOKEN_HERE
   ```

3. **Test endpoints** based on your role

4. **Check status**:
   ```bash
   GET /api/migrations/sync/status
   ```

For detailed documentation, see `API_FIXES_SUMMARY.md` and `DATABASE_SYNC_GUIDE.md`
