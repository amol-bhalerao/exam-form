# Postman Collection Guide - HSC Exam Portal API

This guide explains how to use the Postman collection to test the HSC Exam Portal API in both local and production environments.

## Files Included

1. **hsc-exam-api.postman_collection.json** - Main API collection with all endpoints
2. **hsc-exam-local.postman_environment.json** - Local development environment
3. **hsc-exam-production.postman_environment.json** - Production environment

## Setup Instructions

### Step 1: Import Files into Postman

1. Open Postman
2. Click **Import** button in the top-left
3. Upload **hsc-exam-api.postman_collection.json**
4. Click **Import**
5. Repeat the process to import both environment files:
   - Upload **hsc-exam-local.postman_environment.json**
   - Upload **hsc-exam-production.postman_environment.json**

### Step 2: Select Environment

1. In Postman, look for the environment dropdown (top-right area)
2. Select either:
   - **HSC Exam - Local Development** (for `http://localhost:3000`)
   - **HSC Exam - Production** (for production API URL)

### Step 3: Update Environment Variables (if needed)

Click the **Environment** button in the top-right to open the environment editor and update:
- `base_url` - API base URL (auto-configured but can override)
- `frontend_url` - Frontend URL for reference
- Other variables will be auto-populated during workflow

## API Workflow

### 1. Authentication Flow

**Option A: Login with Username/Password**
```
1. Navigate to "Authentication" folder
2. Click "Login" request
3. Update the body with your credentials:
   - username: your_username
   - password: your_password
4. Click "Send"
5. The access_token and refresh_token are auto-saved to environment
```

**Option B: Register New Student**
```
1. Go to "Authentication > Register Student"
2. Fill in details
3. Click "Send"
4. Then login in step A
```

### 2. Test Public Routes (No Auth Required)

These endpoints work without login:

```
GET /api/public/news       → Get public news and announcements
GET /api/public/exams      → Get upcoming exams
GET /api/public/stats      → Get portal statistics
```

**Example:**
1. Go to "Public Routes" folder
2. Select any endpoint
3. Click "Send" (no Authorization header needed)

### 3. Test Protected Routes (Auth Required)

For endpoints with 🔒 Authorization header:

1. First, **Login** to get access_token (auto-saved)
2. Open any protected endpoint
3. Click **Send** - token is auto-included

**Examples:**
- Get your profile: `GET /api/me`
- List exams: `GET /api/exams`
- Create application: `POST /api/applications`

### 4. Student Application Workflow

```
1. Login as student
2. GET /api/exams → Find exam ID
3. GET /api/masters/subjects?streamId=1 → Get subjects
4. POST /api/applications → Create app with examId, candidateType
5. PUT /api/applications/1 → Fill in details and subjects
6. POST /api/applications/1/submit → Submit application
7. GET /api/applications/my → View your applications
```

### 5. Institute Admin Workflow

```
1. POST /api/institutes/register → Register as institute admin
2. Login with institute credentials
3. GET /api/applications → View all institute applications
4. PUT /api/applications/1 → Verify application
```

### 6. Super Admin Workflow

```
1. Login as super admin user
2. POST /api/institutes/users/create → Create institute admin
3. POST /api/exams → Create exam
4. GET /api/users → List all users
```

## Automatic Token Management

The collection uses **Post-request Tests** to auto-save tokens:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set('access_token', jsonData.accessToken);
  pm.environment.set('refresh_token', jsonData.refreshToken);
}
```

**Endpoints that auto-save tokens:**
- `POST /api/auth/login`
- `POST /api/auth/refresh`

After calling these, the token is available for subsequent requests.

## Token Refresh

When access token expires:

1. Go to `Authentication > Refresh Token`
2. Click **Send**
3. New access_token is auto-saved
4. Continue using other endpoints

## Testing Tips

### 1. Check Health First
```
GET /api/health
```
Verify API is running and get deployment info:
- `ok`: true if healthy
- `service`: backend service name
- `version`: build ID
- `timestamp`: current time
- `uptimeSeconds`: server uptime

### 2. View Responses
- Click **Body** tab after sending request
- Click **JSON** for formatted view
- Use **Pre-request Script** to debug

### 3. Use Variables
Reference environment variables with `{{variable_name}}`:
```
GET /api/users/{{user_id}}
POST /api/applications/{{application_id}}/submit
```

### 4. Form Data for File Uploads
(When applicable) Use **form-data** instead of raw JSON:
```
1. Click request body section
2. Select "form-data"
3. Add key-value pairs
4. Add file if needed
```

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `INVALID_CREDENTIALS` | Check username/password in login |
| `INVALID_REFRESH` | Refresh token expired, login again |
| `NOT_FOUND` | Resource doesn't exist, check ID |
| `UNAUTHORIZED` | Missing or expired access token |
| `FORBIDDEN` | User role doesn't have permission |
| `STUDENT_PROFILE_MISSING` | Student profile not created, check /me endpoint |

## Switching Environments

To test the same flow in different environments:

1. Click environment dropdown (top-right)
2. Select different environment
3. All variables auto-update
4. Run requests again

Example: Test production after testing locally
```
Local: localhost:3000 → Login → Create app → Check
Production: api.hsc-exam-form.hisofftechnology.com → Login → Create app → Check
```

## Performance Testing

Use Postman's **Collection Runner** for load testing:

1. Click **Runner** button (top-left)
2. Select collection "HSC Exam Portal API"
3. Select environment
4. Set iterations: 10
5. Click **Run**
6. Review results (response time, success rate)

## Export/Share Collection

To share with team:

1. Right-click collection name
2. Select **Export**
3. Save as `.json`
4. Share file with team members
5. They can import it into their Postman

## Security Notes

⚠️ **Important:**
- Never commit tokens to git
- Environment tokens are session-specific
- Refresh tokens expire (default: 7 days)
- For production, use secure environment management
- Use HTTPS only for production URLs
- Don't share exported collections with sensitive credentials

## Useful Resources

- [Postman Documentation](https://learning.postman.com/)
- API Swagger/OpenAPI docs: `GET /api/docs`
- Backend README: `./backend/README.md`
- Frontend README: `./frontend/README.md`

## Support

For API issues:
1. Check health endpoint first
2. Review request/response bodies
3. Check environment variables (match with `base_url`)
4. Verify authentication token (check expiry)
5. Review backend logs for detailed errors

---

**Last Updated:** March 24, 2026
**API Version:** 1.0.0
