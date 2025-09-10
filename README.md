# Identity Provider (IdP) - Complete Authentication Solution

A comprehensive Identity Provider solution featuring a Spring Boot backend and JavaScript widget for seamless authentication integration. Supports email/password authentication, LinkedIn & Google OAuth2, JWT token management, and provides a ready-to-use widget for client applications.

## Features

### Core Authentication
- **Email/Password Registration** with client-side and server-side validation
- **LinkedIn & Google OAuth2 Integration** for social login
- **JWT Token Management** with RSA-256 signing
- **Refresh Token Support** for seamless session management
- **Public Key Distribution** via JWKS endpoint

### IdP Widget
- **Ready-to-use JavaScript Widget** for easy integration
- **Responsive Design** with modern UI/UX
- **Real-time Validation** with field-specific error handling
- **Success/Error Feedback** with visual indicators
- **OAuth2 Popup Flow** for social authentication
- **Customizable Styling** and configuration

### Security Features
- **Rate Limiting** on login attempts
- **Account Lockout** after failed attempts
- **Client Registration** for OAuth2 applications
- **Role-Based Access Control** (ADMIN, USER, DEPARTMENT_HEAD, TEACHER)

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
- `GET /api/oauth2/google/auth` - Get Google auth URL
- `POST /api/oauth2/google/callback` - Google OAuth callback

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
   # Copy the example configuration
   cp src/main/resources/application-exemplee.properties src/main/resources/application.properties
   
   # Update application.properties with your actual credentials:
   # - Database connection details
   # - Email SMTP settings
   # - LinkedIn OAuth2 credentials
   # - Google OAuth2 credentials
   ```

3. **Run the application:**
   ```bash
   ./mvnw spring-boot:run
   ```

4. **Test the application:**
   ```bash
   # Health check
   curl http://localhost:8080/health
   
   # Get public keys
   curl http://localhost:8080/.well-known/jwks.json
   
   # Access the IdP widget demo
   open http://localhost:8080/idp-widget/index.html
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
| `SPRING_DATASOURCE_URL` | Database URL | `jdbc:postgresql://localhost:5432/{your-database-name}` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `{your-database-username}` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `{your-database-password}` |
| `SPRING_MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `SPRING_MAIL_USERNAME` | Email username | `{your-email-username}` |
| `SPRING_MAIL_PASSWORD` | Email password | `{your-email-password}` |
| `APP_BASE_URL` | Base URL for emails | `http://localhost:8080` |

### OAuth2 Configuration

The application supports both LinkedIn and Google OAuth2. Update the following in `application.properties`:

```properties
# LinkedIn OAuth2 Configuration
oauth2.linkedin.client-id=YOUR_LINKEDIN_CLIENT_ID
oauth2.linkedin.client-secret=YOUR_LINKEDIN_CLIENT_SECRET
oauth2.linkedin.redirect-uri=http://localhost:8080/api/oauth2/linkedin/callback

# Google OAuth2 Configuration (Manual - for custom flow)
oauth2.google.client-id=YOUR_GOOGLE_CLIENT_ID
oauth2.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
oauth2.google.redirect-uri=http://localhost:8080/api/oauth2/google/callback

# Spring Security OAuth2 Client Configuration (Automatic - for Spring Security)
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=openid,profile,email
spring.security.oauth2.client.registration.google.redirect-uri=http://localhost:8080/login/oauth2/code/google
```

**Note:** The application uses a client ID mapping system that you can retrieve from an API endpoint `/api/oauth2/clients` with parameter body `{"clientName": "My Application"}`.
That's the way it's like you register your application to use our IdP service and the response body will contain the client ID. Your widget's client ID (e.g., `my-application-9f03ce9f`) is mapped to the actual OAuth2 provider credentials in the backend.

## Database Schema

The application automatically creates the following tables `make sure to have a created and run your postgresql database before running the application`:
- `users` - User accounts and profile information
- `user_roles` - Role assignments (Admin, User, Department Head, Teacher)
- `oauth_clients` - Registered client applications
- `refresh_tokens` - Active refresh tokens
- `login_attempts` - Failed login tracking

<!-- ## Sample Data

Default users created on startup:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`
- **Department Head**: `dept.head@school.edu` / `dept123`
- **Teacher**: `teacher@school.edu` / `teacher123`

Default OAuth2 client:
- **Client ID**: `demo-app-client`
- **Client Secret**: `secret` (BCrypt hashed) -->

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

## IdP Widget Integration

### Quick Integration

The IdP widget provides a complete authentication UI that can be easily integrated into any web application.

1. **Include the widget files:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <link rel="stylesheet" href="http://localhost:8080/idp-widget/styles.css">
   </head>
   <body>
       <div id="idp-widget"></div>
       <script src="http://localhost:8080/idp-widget/idp-widget.js"></script>
   </body>
   </html>
   ```

2. **Configure the widget:**
   ```javascript
   <script>
      // Configure the IdP Widget
      window.idpWidgetConfig = {
         apiBaseUrl: 'http://localhost:8080/api',
         clientId: '{your-widget-client-id}', // The client ID you get from the /api/oauth2/clients endpoint
         clientSecret: '{your-widget-client-secret}', // The client secret you get from the /api/oauth2/clients endpoint
         onSuccess: function(user, tokens) {
            console.log('Authentication successful:', { user, tokens });
            // Handle successful authentication
         },
         onError: function(error) {
            console.error('Authentication failed:', error);
            // Handle authentication errors
         }
      };

      // Initialize the widget
      const widget = new IdPWidget('idp-widget', window.idpWidgetConfig);
   </script>
   ```

### Widget Features

- **Login/Register Forms** with validation
- **OAuth2 Social Login** (LinkedIn, Google)
- **Password Reset** functionality
- **Real-time Validation** with error feedback
- **Responsive Design** for mobile and desktop
- **Success/Error Modals** with user feedback

### Widget Configuration Options

| Option | Description | Required |
|--------|-------------|----------|
| `apiBaseUrl` | Base URL of the IdP API | Yes |
| `clientId` | Your application's client ID | Yes |
| `clientSecret` | Your application's client secret | Yes |
| `onSuccess` | Callback for successful authentication | No |
| `onError` | Callback for authentication errors | No |

## Integration Guide

### For Client Applications

1. **Register your application:**
   - using the endpoint `/api/oauth2/clients` with parameter body `{"clientName": "{your-desired-app-name}"}`
   - Configure redirect URIs and scopes all arecoming from the request body

2. **Use the IdP Widget (Recommended):**
   - Include the idp-widget in your application
   - Configure with your client credentials
   - Handle success/error callbacks

3. **Or implement custom authentication flow:**
   ```javascript
   // Direct API integration
   const response = await fetch('http://localhost:8080/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ email, password, clientId }) // clientId is the client id you get from the /api/oauth2/clients endpoint
   });
   ```

4. **Verify JWT tokens:**
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
idp-spring-boot/
├── src/main/java/com/example/idp/
│   ├── config/          # Spring configuration
│   ├── controller/      # REST controllers
│   ├── dto/            # Data transfer objects
│   ├── entity/         # JPA entities
│   ├── repository/     # Data repositories
│   ├── service/        # Business logic
│   └── util/           # Utility classes
├── src/main/resources/
│   ├── static/         # Static web resources
│   └── application-exemplee.properties  # Configuration template
├── idp-widget/         # JavaScript Widget
│   ├── idp-widget.js   # Widget implementation
│   ├── styles.css      # Widget styling
│   └── index.html      # Demo page
├── school-budget-demo/ # Example integration
└── docker-compose.yml  # Docker deployment
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
