# Identity Provider (IdP) - User Stories

## Project Overview
This project consists of three main components:
1. **Spring Boot Identity Provider (IdP) Backend**
2. **HTML Widget for S3 hosting**
3. **Demo Application with IdP integration**

---

## **Project 1: Spring Boot Identity Provider (IdP) Backend**

### Epic: Authentication Service
**As a** system administrator  
**I want** a centralized identity provider  
**So that** multiple applications can authenticate users through a single service

#### User Story 1.1: Email/Password Registration
**As a** new user  
**I want** to register with my email and password  
**So that** I can create an account and access applications

**Acceptance Criteria:**
- User can register with email and password
- Email verification is mandatory before account activation
- Password must meet security requirements (min 8 chars, special chars, etc.)
- Duplicate email registration is prevented
- Verification email is sent upon registration

#### User Story 1.2: Email/Password Login
**As a** registered user  
**I want** to login with my email and password  
**So that** I can access applications that use this IdP

**Acceptance Criteria:**
- User can login with verified email and correct password
- Unverified accounts cannot login
- Failed login attempts are tracked and limited
- Successful login returns JWT access and refresh tokens

#### User Story 1.3: LinkedIn OAuth Integration
**As a** user  
**I want** to login using my LinkedIn account  
**So that** I don't need to create another password

**Acceptance Criteria:**
- User can initiate LinkedIn & Google OAuth flow
- LinkedIn/Google profile data is used to create/update user account
- OAuth flow handles both new users and existing users
- LinkedIn/Google login returns the same JWT tokens as email/password

#### User Story 1.4: JWT Token Management
**As a** client application  
**I want** to receive JWT tokens for authenticated users  
**So that** I can verify user identity and manage sessions

**Acceptance Criteria:**
- Access tokens are short-lived (15-30 minutes)
- Refresh tokens are long-lived (7-30 days)
- Tokens are signed with RSA private key
- Tokens contain user ID, roles, and expiration claims
- Token refresh endpoint allows getting new access tokens

#### User Story 1.5: Public Key Distribution (JWKS)
**As a** client application developer  
**I want** to access the IdP's public key  
**So that** I can verify JWT token signatures locally

**Acceptance Criteria:**
- JWKS endpoint exposes public keys in standard format
- Endpoint is publicly accessible (no authentication required)
- Keys include key ID (kid) for rotation support
- Endpoint supports CORS for browser-based applications

#### User Story 1.6: Client Application Registration
**As a** system administrator  
**I want** to register client applications  
**So that** only approved apps can use the IdP

**Acceptance Criteria:**
- Client applications must register with client ID and secret
- Redirect URIs are validated during OAuth flows
- Client credentials are required for token requests
- Admin interface for managing registered clients

---

## **Project 2: HTML Widget (S3-Hosted)**

### Epic: Embeddable Authentication Widget
**As a** application developer  
**I want** a lightweight authentication widget  
**So that** I can add login functionality with minimal code

#### User Story 2.1: Easy Integration
**As a** developer  
**I want** to embed the auth widget with a single script tag  
**So that** integration requires zero configuration

**Acceptance Criteria:**
- Widget loads with one `<script>` tag
- No additional CSS or dependencies required
- Widget auto-configures based on domain or client ID
- Responsive design works on mobile and desktop

#### User Story 2.2: Login Interface
**As a** user  
**I want** a clean login form in the widget  
**So that** I can authenticate without leaving the current page

**Acceptance Criteria:**
- Email/password login form
- "Login with LinkedIn" button
- Form validation with error messages
- Loading states during authentication
- Success/error feedback to user

#### User Story 2.3: Registration Interface
**As a** new user  
**I want** to register through the widget  
**So that** I can create an account seamlessly

**Acceptance Criteria:**
- Registration form with email, password, confirm password
- Real-time validation feedback
- Terms of service acceptance checkbox
- Email verification notice after registration
- Smooth transition between login and registration modes

#### User Story 2.4: Token Management
**As a** parent application  
**I want** the widget to handle token storage and events  
**So that** I can react to authentication state changes

**Acceptance Criteria:**
- Widget stores tokens securely (httpOnly cookies or secure storage)
- Emits events: login, logout, token-refresh, error
- Provides methods to check authentication status
- Handles token refresh automatically
- Clears tokens on logout

---

## **Project 3: Demo Application (School Budget Management)**

### Epic: Educational Budget Management System
**As a** school administrator  
**I want** a budget management system with role-based access  
**So that** different users can manage budgets according to their permissions

#### User Story 3.1: IdP Integration
**As a** user  
**I want** to login using the IdP widget  
**So that** I can access the budget management system

**Acceptance Criteria:**
- Login redirects to IdP widget
- Successful authentication grants access to dashboard
- User roles are determined from JWT token claims
- Token validation happens on every protected request
- Automatic token refresh keeps user logged in

#### User Story 3.2: Admin Dashboard
**As a** school administrator  
**I want** to view all department budgets  
**So that** I can oversee the entire school's financial status

**Acceptance Criteria:**
- View all departments and their budget allocations
- See total school budget and remaining funds
- Approve or reject budget transfer requests
- Generate financial reports and analytics
- Access user management (assign roles)

#### User Story 3.3: Department Head Management
**As a** department head  
**I want** to manage my department's budget  
**So that** I can allocate resources effectively

**Acceptance Criteria:**
- View only my department's budget details
- Submit budget transfer requests to other departments
- Track spending by category (salaries, equipment, supplies)
- View cost-per-student metrics for my department
- Generate department-specific reports

#### User Story 3.4: Teacher Resource Requests
**As a** teacher  
**I want** to request classroom resources  
**So that** I can get approval for necessary supplies

**Acceptance Criteria:**
- Submit resource requests with cost estimates
- View status of pending requests
- See approved budget for my classroom
- Track spending against allocated budget
- Receive notifications on request approvals/rejections

#### User Story 3.5: Financial Calculations & Optimization
**As a** system user  
**I want** automated budget calculations  
**So that** resource allocation is optimized

**Acceptance Criteria:**
- Calculate cost-per-credit-hour automatically
- Optimize class sizes based on instructor availability
- Track facility utilization rates
- Generate budget variance reports
- Project future costs based on enrollment trends

#### User Story 3.6: Role-Based Access Control
**As a** system  
**I want** to enforce role-based permissions  
**So that** users only access data they're authorized to see

**Acceptance Criteria:**
- Admin: Full system access
- Department Head: Department-specific access
- Teacher: Classroom-level access only
- JWT token validation on every request
- UI elements hidden based on user role
- API endpoints protected by role requirements

---

## **Technical Requirements**

### Security
- All passwords hashed with bcrypt
- JWT tokens signed with RSA-256
- HTTPS required for all endpoints
- CORS properly configured
- Rate limiting on authentication endpoints
- SQL injection prevention
- XSS protection

### Performance
- Token validation under 100ms
- Widget loads under 2 seconds
- Database queries optimized with indexes
- Caching for public keys and user sessions
- Horizontal scaling support

### Deployment
- Docker containerization for IdP
- S3 hosting for HTML widget
- Environment-based configuration
- Health check endpoints
- Logging and monitoring
- Database migrations

---

## **Acceptance Testing Scenarios**

### End-to-End Flow
1. User visits demo application
2. Clicks login → redirected to IdP widget
3. Registers with email/password → receives verification email
4. Verifies email → can now login
5. Logs in → receives JWT tokens
6. Accesses demo app → tokens validated via JWKS
7. Performs role-based actions → permissions enforced
8. Token expires → automatically refreshed
9. Logs out → tokens invalidated

### OAuth Flow
1. User clicks "Login with LinkedIn"
2. Redirected to LinkedIn authorization
3. Grants permission → redirected back to IdP
4. IdP creates/updates user account
5. Returns JWT tokens to widget
6. User accesses demo application with LinkedIn identity

### Multi-Application Integration
1. Register second client application
2. Same user logs into both applications
3. Single sign-on works across both apps
4. Logout from one app doesn't affect the other
5. Token refresh works for both applications
