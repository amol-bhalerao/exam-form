# Unit Testing Strategy & Implementation Guide

## Backend Unit Tests Setup

### Framework
- **Test Runner:** Vitest/Jest
- **Location:** `backend/src/**/*.test.js` or `backend/src/**/*.spec.js`
- **Status:** Ready to use (configured in package.json)

### Run Tests
```bash
cd backend
npm test              # Run all tests
npm test -- --watch # Watch mode
npm test -- --coverage # With coverage report
```

### Backend Test Structure

**Sample Test File: `src/routes/auth.test.js`**
```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from './auth.js';
import { prisma } from '../prisma.js';

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 422 for missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'test123' });
      
      expect(response.status).toBe(422);
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wronghash'
        });
      
      expect(response.status).toBe(401);
    });

    it('should return tokens for valid credentials', async () => {
      // Mock Prisma find
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 1,
        username: 'test',
        passwordHash: 'hashed',
        role: { name: 'ADMIN' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('POST /auth/google', () => {
    it('should validate Google token format', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({ credential: 'invalid_token_format' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### Key Test Modules to Create

1. **Authentication Tests** (`tests/auth.test.js`)
   - Login validation
   - Google OAuth flow
   - Token refresh
   - Permission checks

2. **Exam Management Tests** (`tests/exams.test.js`)
   - Create exam
   - List exams
   - Update exam
   - Calculate statistics

3. **Application Tests** (`tests/applications.test.js`)
   - Create application
   - Submit application
   - Validation rules
   - Document upload

4. **Master Data Tests** (`tests/masters.test.js`)
   - Stream CRUD
   - Subject CRUD
   - Validation

5. **Payment Tests** (`tests/payments.test.js`)
   - Payment initialization
   - Payment verification
   - Receipt generation

---

## Frontend Unit Tests Setup

### Framework
- **Test Runner:** Karma
- **Testing Library:** Jasmine
- **Location:** `frontend/src/**/*.spec.ts`
- **Status:** Ready to use (configured in angular.json)

### Run Tests
```bash
cd frontend
npm test              # Run once
npm test -- --watch  # Watch mode
npm test -- --code-coverage # With coverage
```

### Frontend Test Structure

**Sample Test File: `src/app/core/auth.service.spec.ts`**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('login()', () => {
    it('should send email and password to backend', () => {
      const mockResponse = {
        accessToken: 'jwt_token',
        refreshToken: 'refresh_token',
        user: { id: 1, email: 'test@test.com' }
      };

      service.login('test@test.com', 'password123').subscribe((result) => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        email: 'test@test.com',
        password: 'password123'
      });
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      service.login('test@test.com', 'wrongpassword').subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`/api/auth/login`);
      req.flush({ error: 'UNAUTHORIZED' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout()', () => {
    it('should clear stored tokens', () => {
      localStorage.setItem('accessToken', 'some_token');
      service.logout();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });
});
```

### Component Test Example

**Sample: `src/app/pages/login/user-type-login.spec.ts`**
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserTypeLoginComponent } from './user-type-login.component';

describe('UserTypeLoginComponent', () => {
  let component: UserTypeLoginComponent;
  let fixture: ComponentFixture<UserTypeLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTypeLoginComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UserTypeLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display three login options', () => {
    const cards = fixture.nativeElement.querySelectorAll('.user-card');
    expect(cards.length).toBe(3);
  });

  it('should route to student-login on student click', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    const studentButton = fixture.nativeElement.querySelector('[data-test=student-login]');
    studentButton.click();
    expect(router.navigate).toHaveBeenCalledWith(['/student-login']);
  });
});
```

---

## Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| Authentication | 95% | HIGH |
| Authorization | 90% | HIGH |
| API Routes | 85% | HIGH |
| Utilities | 80% | MEDIUM |
| Components | 70% | MEDIUM |
| Services | 85% | MEDIUM |

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Unit Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Backend Tests
      - name: Backend Tests
        run: |
          cd backend
          npm install
          npm test -- --coverage
      
      # Frontend Tests
      - name: Frontend Tests
        run: |
          cd frontend
          npm install
          npm test -- --watch=false --code-coverage
      
      # Upload Coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## Test Execution Commands

### Quick Test Run
```bash
# Backend
cd backend && npm test

# Frontend  
cd frontend && npm test -- --watch=false
```

### With Coverage
```bash
# Backend with coverage
cd backend && npm test -- --coverage

# Frontend with coverage
cd frontend && npm test -- --code-coverage
```

### Watch Mode (Development)
```bash
# Backend watch
cd backend && npm test -- --watch

# Frontend watch
cd frontend && npm test
```

---

##  Critical Test Cases

### Authentication Tests (MUST HAVE)
- ✓ Login with valid credentials
- ✓ Login with invalid credentials  
- ✓ Google OAuth flow
- ✓ Token refresh
- ✓ Logout clears tokens
- ✓ Admin access restricted to SUPER_ADMIN

### Application Tests (MUST HAVE)
- ✓ Student can create application
- ✓ Application stored in draft
- ✓ Application submitted successfully
- ✓ Duplicate applications prevented
- ✓ Application status workflow

### Payment Tests (MUST HAVE - with Cashfree keys)
- ✓ Payment link created
- ✓ Payment verified
- ✓ Receipt generated
- ✓ Payment status tracked

---

## Test Data & Fixtures

### Seed Test Data

```javascript
// test-fixtures.js
export const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@test.com',
    password: 'TestPass123!',
    role: 'SUPER_ADMIN'
  },
  student: {
    username: 'student1',
    email: 'student@test.com',
    password: 'TestPass123!',
    role: 'STUDENT'
  },
  institute: {
    username: 'institute1',
    email: 'college&test.com',
    password: 'TestPass123!',
    role: 'INSTITUTE'
  }
};

export const testExams = {
  active: {
    name: 'HSC 2026',
    academicYear: '2025-26',
    stream: 'Science',
    applicationOpen: new Date(),
    applicationClose: new Date(Date.now() + 30 * 86400000)
  }
};
```

---

## Common Testing Patterns

### Mocking Prisma
```javascript
import { vi } from 'vitest';
import { prisma } from '../prisma.js';

vi.mock('../prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }
  }
}));
```

### Testing HTTP Interceptors
```typescript
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
});
```

---

## Debugging Tests

```bash
# Run specific test file
npm test -- auth.test

# Run tests matching pattern
npm test -- --grep "login"

# Verbose output
npm test -- --reporter=verbose

# Debug in Node Inspector
node --inspect-brk ./node_modules/.bin/vitest
```

---

**Status:** Test framework configured and ready for implementation  
**Next:** Create test files and implement test cases  
**Measurement:** Track coverage metrics for quality assurance
