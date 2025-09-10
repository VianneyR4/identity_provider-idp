# Identity Provider (IdP) Testing & Integration Guide

## Overview
This guide provides comprehensive user stories and step-by-step instructions for testing the IdP system and integrating it into client applications.

---

## 🔐 **Authentication Flow User Stories**

### **User Story T1: Email Registration & Verification**
**As a** new user  
**I want** to register with email and password  
**So that** I can create an account and access the system

**Testing Steps:**
1. **POST** `/api/auth/register`
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
2. **Expected Response:** `200 OK` with success message
3. **Check Email:** Verification email sent to user
4. **GET** `/api/auth/verify-email?token={verification_token}`
5. **Expected Result:** Account activated, ready for login

**Acceptance Criteria:**
- ✅ User receives verification email
- ✅ Account is inactive until email verified
- ✅ Verification link activates account
- ✅ Duplicate email registration fails

---

### **User Story T2: Email Login & Token Generation**
**As a** verified user  
**I want** to login with email and password  
**So that** I receive JWT tokens for accessing protected resources

**Testing Steps:**
1. **POST** `/api/auth/login`
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```
2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGciOiJSUzI1NiIs...",
       "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
       "user": {
         "id": "123",
         "email": "test@example.com",
         "firstName": "John",
         "lastName": "Doe",
         "roles": ["USER"]
       }
     }
   }
   ```

**Acceptance Criteria:**
- ✅ Valid credentials return JWT tokens
- ✅ Access token expires in 15 minutes
- ✅ Refresh token expires in 7 days
- ✅ Invalid credentials return 401 error
- ✅ Unverified accounts cannot login

---

### **User Story T3: OAuth Login (LinkedIn)**
**As a** user  
**I want** to login using LinkedIn OAuth  
**So that** I don't need to create a separate password

**Testing Steps:**
1. **GET** `/api/oauth2/linkedin/authorize?clientId=demo-app`
2. **Expected Response:** LinkedIn authorization URL
   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77afk1qasx9ygb&redirect_uri=http://localhost:8080/api/oauth2/linkedin/callback&scope=openid%20profile%20email&state=demo-app
   ```
3. **User Action:** Visit URL, authorize LinkedIn access
4. **LinkedIn Redirect:** `POST /api/oauth2/linkedin/callback`
   - Parameters: `code`, `state`
5. **Expected Response:** JWT tokens (same format as email login)

**Acceptance Criteria:**
- ✅ LinkedIn profile data creates/updates user account
- ✅ OAuth flow handles new and existing users
- ✅ Returns same JWT format as email login
- ✅ LinkedIn ID linked to user account

---

### **User Story T4: OAuth Login (Google)**
**As a** user  
**I want** to login using Google OAuth  
**So that** I can use my existing Google account

**Testing Steps:**
1. **GET** `/api/oauth2/google/auth`
2. **Expected Response:** Google authorization URL
3. **User Action:** Visit URL, authorize Google access
4. **Google Redirect:** Automatic callback handling
5. **Expected Response:** JWT tokens

**Acceptance Criteria:**
- ✅ Google profile data creates/updates user account
- ✅ OAuth flow handles new and existing users
- ✅ Returns same JWT format as email login
- ✅ Google ID linked to user account

---

### **User Story T5: Token Refresh**
**As a** client application  
**I want** to refresh expired access tokens  
**So that** users don't need to login again

**Testing Steps:**
1. **Wait** for access token to expire (15 minutes)
2. **POST** `/api/auth/refresh`
   ```json
   {
     "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
   }
   ```
3. **Expected Response:** New token pair
   ```json
   {
     "success": true,
     "data": {
       "accessToken": "eyJhbGciOiJSUzI1NiIs...",
       "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
     }
   }
   ```

**Acceptance Criteria:**
- ✅ Valid refresh token returns new access token
- ✅ New refresh token issued (token rotation)
- ✅ Old refresh token invalidated
- ✅ Expired refresh token returns 401 error

---

## 🔑 **Token Validation User Stories**

### **User Story T6: Public Key Distribution (JWKS)**
**As a** client application developer  
**I want** to retrieve the IdP's public key  
**So that** I can verify JWT token signatures

**Testing Steps:**
1. **GET** `/api/jwks`
2. **Expected Response:** JWKS format
   ```json
   {
     "keys": [
       {
         "kty": "RSA",
         "use": "sig",
         "kid": "idp-key-1",
         "n": "base64-encoded-modulus",
         "e": "AQAB"
       }
     ]
   }
   ```

**Acceptance Criteria:**
- ✅ Public key freely accessible (no authentication)
- ✅ JWKS standard format
- ✅ Key can verify JWT signatures
- ✅ Private key never exposed

---

### **User Story T7: Client Application Token Verification**
**As a** client application  
**I want** to verify JWT tokens locally  
**So that** I can authenticate users without calling the IdP

**Testing Steps:**
1. **Obtain** JWT token from login/OAuth flow
2. **Decode** JWT header and payload
3. **Fetch** public key from `/api/jwks`
4. **Verify** signature using public key
5. **Validate** expiration and claims

**Example JWT Payload:**
```json
{
  "sub": "123",
  "email": "test@example.com",
  "name": "John Doe",
  "roles": ["USER"],
  "client_id": "demo-app",
  "iat": 1641234567,
  "exp": 1641235467
}
```

**Acceptance Criteria:**
- ✅ Valid tokens pass signature verification
- ✅ Expired tokens fail validation
- ✅ Tampered tokens fail verification
- ✅ Claims contain user information

---

## 🏗️ **Client Integration User Stories**

### **User Story T8: Client Registration**
**As a** developer  
**I want** to register my application with the IdP  
**So that** I can obtain client credentials

**Testing Steps:**
1. **Database Insert** (manual for now):
   ```sql
   INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, name) 
   VALUES ('my-app', 'secret123', 'http://localhost:3000/callback', 'My App');
   ```
2. **Verify** client can use credentials for OAuth flows

**Acceptance Criteria:**
- ✅ Client ID uniquely identifies application
- ✅ Client secret authenticates application
- ✅ Redirect URIs validated during OAuth
- ✅ Only registered clients can obtain tokens

---

### **User Story T9: Protected Resource Access**
**As a** client application  
**I want** to protect my API endpoints  
**So that** only authenticated users can access them

**Implementation Example:**
```javascript
// Client-side token validation middleware
function validateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    // Verify using IdP public key
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route
app.get('/api/protected', validateToken, (req, res) => {
  res.json({ 
    message: 'Access granted', 
    user: req.user 
  });
});
```

**Acceptance Criteria:**
- ✅ Valid tokens grant access to protected resources
- ✅ Invalid/expired tokens return 401 error
- ✅ User information available from token claims
- ✅ No need to call IdP for each request

---

## 🔄 **Single Sign-On (SSO) Flow**

### **User Story T10: SSO Between Applications**
**As a** user  
**I want** to login once and access multiple applications  
**So that** I don't need to login to each app separately

**SSO Flow:**
1. **User** visits App A (not logged in)
2. **App A** redirects to IdP login
3. **User** logs in to IdP
4. **IdP** redirects back to App A with tokens
5. **User** visits App B (same browser session)
6. **App B** redirects to IdP
7. **IdP** detects existing session, auto-redirects to App B with tokens
8. **User** is automatically logged into App B

**Testing Steps:**
1. **Setup** two client applications
2. **Login** to first application via IdP
3. **Visit** second application
4. **Verify** automatic login (no credentials required)

**Acceptance Criteria:**
- ✅ Single login grants access to all registered apps
- ✅ Session shared across applications
- ✅ Logout from IdP logs out of all apps
- ✅ Token expiration handled gracefully

---

## 🧪 **Integration Testing Scenarios**

### **Scenario 1: New User Registration → Login → Protected Access**
1. Register new user via email
2. Verify email address
3. Login with credentials
4. Use access token to call protected API
5. Refresh token when expired
6. Verify continuous access

### **Scenario 2: OAuth Registration → SSO → Multi-App Access**
1. Register via LinkedIn OAuth
2. Access first application
3. Navigate to second application
4. Verify automatic SSO login
5. Test token sharing between apps

### **Scenario 3: Token Lifecycle Management**
1. Login and obtain tokens
2. Use access token until expiration
3. Refresh using refresh token
4. Continue using new access token
5. Test refresh token expiration
6. Verify re-authentication required

### **Scenario 4: Security Edge Cases**
1. Test with tampered JWT tokens
2. Test with expired tokens
3. Test with invalid client credentials
4. Test CORS and security headers
5. Verify error handling and responses

---

## 📋 **Developer Integration Checklist**

### **Phase 1: Setup**
- [ ] Register application with IdP (obtain client_id/secret)
- [ ] Configure redirect URIs
- [ ] Install JWT verification library
- [ ] Fetch IdP public key from `/api/jwks`

### **Phase 2: Authentication**
- [ ] Implement login redirect to IdP
- [ ] Handle OAuth callback
- [ ] Store JWT tokens securely
- [ ] Implement token refresh logic

### **Phase 3: Authorization**
- [ ] Create token validation middleware
- [ ] Protect API endpoints
- [ ] Extract user info from token claims
- [ ] Handle token expiration gracefully

### **Phase 4: Testing**
- [ ] Test all authentication flows
- [ ] Verify token validation
- [ ] Test SSO between applications
- [ ] Validate security edge cases

---

## 🔧 **Troubleshooting Guide**

### **Common Issues:**

**401 Unauthorized Errors:**
- Check token expiration
- Verify signature with correct public key
- Ensure client credentials are valid

**OAuth Flow Failures:**
- Verify redirect URI matches registration
- Check client_id/secret configuration
- Ensure proper CORS headers

**Token Refresh Issues:**
- Check refresh token expiration
- Verify refresh token hasn't been used
- Ensure proper token rotation

**JWKS Endpoint Issues:**
- Verify public key format
- Check key algorithm (RS256)
- Ensure key ID matches JWT header

---

This comprehensive guide provides everything needed to understand, test, and integrate the IdP system. Each user story includes specific testing steps and acceptance criteria to ensure proper implementation.
