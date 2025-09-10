# Identity Provider (IdP) - Spring Boot Backend

A comprehensive Spring Boot-based Identity Provider that supports email/password authentication, LinkedIn OAuth2, and JWT token management with public key distribution.

## Features

### Core Authentication
- **Email/Password Registration** with mandatory email verification
- **LinkedIn OAuth2 Integration** for social login
- **JWT Token Management** with RSA-256 signing
- **Refresh Token Support** for seamless session management
- **Public Key Distribution** via JWKS endpoint

### Security Features
- **Rate Limiting** on login attempts
- **Account Lockout** after failed attempts
- **Audit Logging** for security events
- **Client Registration** for OAuth2 applications
- **Role-Based Access Control** (Admin, User, Department Head, Teacher)

### API Endpoints

#### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset
- `GET /api/auth/verify-email` - Email verification

#### OAuth2 Endpoints
- `GET /api/oauth2/linkedin/authorize` - Get LinkedIn auth URL
- `POST /api/oauth2/linkedin/callback` - LinkedIn OAuth callback

#### Public Endpoints
- `GET /.well-known/jwks.json` - Public keys for JWT verification
- `GET /health` - Health check endpoint

## Quick Start

### Prerequisites
- Java 17+
- PostgreSQL 15+
- Maven 3.6+

### Local Development

1. **Clone and setup database:**
   ```bash
   # Start PostgreSQL and create database
   createdb spring_db
   ```

2. **Configure application:**
   ```bash
   # Update src/main/resources/application.properties
   # Set your database credentials, email settings, and OAuth2 keys
   ```

3. **Run the application:**
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Test the endpoints:**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # Get public keys
   curl http://localhost:8080/.well-known/jwks.json
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **The service will be available at:**
   - IdP Service: http://localhost:8080
   - PostgreSQL: localhost:5432

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | Database URL | `jdbc:postgresql://localhost:5432/spring_db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `vianney_r` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `root` |
| `SPRING_MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `SPRING_MAIL_USERNAME` | Email username | - |
| `SPRING_MAIL_PASSWORD` | Email password | - |
| `APP_BASE_URL` | Base URL for emails | `http://localhost:8080` |

### OAuth2 Configuration

Update the following in `application.properties`:

```properties
# LinkedIn OAuth2
spring.security.oauth2.client.registration.linkedin.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.linkedin.client-secret=YOUR_CLIENT_SECRET
spring.security.oauth2.client.registration.linkedin.redirect-uri=http://localhost:8080/api/oauth2/linkedin/callback
```

## Database Schema

The application automatically creates the following tables:
- `users` - User accounts and profile information
- `user_roles` - Role assignments (Admin, User, Department Head, Teacher)
- `oauth_clients` - Registered client applications
- `refresh_tokens` - Active refresh tokens
- `login_attempts` - Failed login tracking
- `audit_logs` - Security event logging

## Sample Data

Default users created on startup:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`
- **Department Head**: `dept.head@school.edu` / `dept123`
- **Teacher**: `teacher@school.edu` / `teacher123`

Default OAuth2 client:
- **Client ID**: `demo-app-client`
- **Client Secret**: `secret` (BCrypt hashed)

## JWT Token Structure

### Access Token Claims
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "email_verified": true,
  "client_id": "demo-app-client",
  "roles": ["USER", "ADMIN"],
  "token_type": "access",
  "iss": "idp-service",
  "iat": 1694123456,
  "exp": 1694124356
}
```

### Refresh Token Claims
```json
{
  "sub": "user_id",
  "client_id": "demo-app-client",
  "token_type": "refresh",
  "iss": "idp-service",
  "iat": 1694123456,
  "exp": 1694728256
}
```

## Integration Guide

### For Client Applications

1. **Register your application:**
   - Add client credentials to `oauth_clients` table
   - Configure redirect URIs and scopes

2. **Implement authentication flow:**
   ```javascript
   // Redirect to IdP for authentication
   window.location.href = 'http://localhost:8080/api/oauth2/linkedin/authorize?clientId=your-client-id';
   
   // Handle callback and extract tokens
   // Verify tokens using public key from /.well-known/jwks.json
   ```

3. **Verify JWT tokens:**
   ```bash
   # Get public keys
   curl http://localhost:8080/.well-known/jwks.json
   
   # Use the public key to verify JWT signatures in your application
   ```

## Security Considerations

### Production Deployment
- Use HTTPS for all endpoints
- Set secure environment variables
- Configure proper CORS policies
- Use strong database passwords
- Enable rate limiting
- Monitor audit logs

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- All tokens are signed with RSA-256
- Public keys are rotatable via key ID

## Monitoring and Logging

### Health Checks
- `GET /health` - Application health status
- Database connectivity check
- Service availability monitoring

### Audit Events
All security events are logged:
- User registration and login
- Password changes and resets
- Token refresh and logout
- OAuth2 authentication
- Failed login attempts

## Development

### Project Structure
```
src/main/java/com/example/idp/
├── config/          # Spring configuration
├── controller/      # REST controllers
├── dto/            # Data transfer objects
├── entity/         # JPA entities
├── repository/     # Data repositories
├── service/        # Business logic
└── util/           # Utility classes
```

### Building
```bash
# Compile
./mvnw clean compile

# Run tests
./mvnw test

# Package
./mvnw clean package
```

## License

This project is part of an Identity Provider implementation for educational purposes.

## Support

For issues and questions, refer to the USER_STORIES.md file for detailed requirements and acceptance criteria.
