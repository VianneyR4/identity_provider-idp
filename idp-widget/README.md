# Identity Provider Widget

A lightweight, customizable authentication widget that integrates seamlessly with the Spring Boot Identity Provider backend. Perfect for adding secure authentication to any website with minimal setup.

## Features

- **🔐 Secure Authentication**: JWT tokens with RSA-256 signing
- **🎨 Modern UI**: Clean, responsive design with theme support
- **🔗 OAuth Integration**: Built-in LinkedIn OAuth2 support
- **📱 Mobile Ready**: Works perfectly on all devices
- **♿ Accessible**: WCAG compliant with keyboard navigation
- **🚀 Easy Integration**: Drop-in widget with minimal configuration

## Quick Start

### 1. Include the Widget

```html
<!-- Include CSS and JS -->
<link rel="stylesheet" href="https://your-cdn.com/idp-widget/styles.css">
<script src="https://your-cdn.com/idp-widget/integration.js"></script>
```

### 2. Configure the Widget

```html
<script>
window.idpIntegrationConfig = {
    apiBaseUrl: 'https://your-idp.com/api',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    onSuccess: function(user, tokens) {
        // Handle successful authentication
        console.log('User logged in:', user);
        // Store tokens, redirect, update UI, etc.
    },
    onError: function(error) {
        // Handle authentication errors
        console.error('Auth error:', error);
    }
};
</script>
```

### 3. Add Login Buttons

```html
<!-- Simple data attributes -->
<button data-idp-action="open" data-idp-view="login">Login</button>
<button data-idp-action="open" data-idp-view="register">Sign Up</button>

<!-- Or use JavaScript API -->
<button onclick="showIdPLogin()">Login</button>
<button onclick="showIdPRegister()">Sign Up</button>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiBaseUrl` | string | `'http://localhost:8082/api'` | IdP backend API URL |
| `clientId` | string | `'demo-app'` | OAuth2 client ID |
| `clientSecret` | string | `'demo-secret'` | OAuth2 client secret |
| `redirectUri` | string | `window.location.origin + '/auth/callback'` | OAuth2 redirect URI |
| `modal` | boolean | `true` | Show as modal or embed inline |
| `autoClose` | boolean | `true` | Auto close on successful auth |
| `theme` | string | `'light'` | UI theme (light/dark) |
| `onSuccess` | function | `null` | Success callback |
| `onError` | function | `null` | Error callback |
| `onClose` | function | `null` | Close callback |

## JavaScript API

### Initialize Widget

```javascript
const widget = new IdPWidgetIntegration({
    apiBaseUrl: 'https://your-idp.com/api',
    clientId: 'your-client-id',
    modal: true,
    onSuccess: (user, tokens) => {
        // Handle authentication success
    }
});

widget.init();
```

### Methods

```javascript
// Show authentication forms
widget.showLogin();
widget.showRegister();
widget.close();

// Check authentication status
const isAuth = widget.isAuthenticated();
const user = widget.getUser();
const tokens = widget.getTokens();

// Logout
widget.logout();
```

## Framework Integration

### React

```jsx
import { useEffect, useState } from 'react';

function AuthButton() {
    const [widget, setWidget] = useState(null);
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        const w = new IdPWidgetIntegration({
            apiBaseUrl: process.env.REACT_APP_IDP_URL,
            clientId: process.env.REACT_APP_CLIENT_ID,
            onSuccess: (user, tokens) => {
                setUser(user);
                // Store tokens in context/redux
            }
        });
        w.init();
        setWidget(w);
    }, []);
    
    if (user) {
        return <div>Welcome, {user.firstName}!</div>;
    }
    
    return (
        <button onClick={() => widget?.showLogin()}>
            Login
        </button>
    );
}
```

### Vue.js

```vue
<template>
    <div>
        <button v-if="!user" @click="showLogin">Login</button>
        <div v-else>Welcome, {{ user.firstName }}!</div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            widget: null,
            user: null
        };
    },
    mounted() {
        this.widget = new IdPWidgetIntegration({
            apiBaseUrl: process.env.VUE_APP_IDP_URL,
            clientId: process.env.VUE_APP_CLIENT_ID,
            onSuccess: (user, tokens) => {
                this.user = user;
                this.$emit('authenticated', { user, tokens });
            }
        });
        this.widget.init();
    },
    methods: {
        showLogin() {
            this.widget.showLogin();
        }
    }
};
</script>
```

### Angular

```typescript
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-auth',
    template: `
        <button *ngIf="!user" (click)="showLogin()">Login</button>
        <div *ngIf="user">Welcome, {{ user.firstName }}!</div>
    `
})
export class AuthComponent implements OnInit {
    widget: any;
    user: any = null;
    
    ngOnInit() {
        this.widget = new (window as any).IdPWidgetIntegration({
            apiBaseUrl: environment.idpUrl,
            clientId: environment.clientId,
            onSuccess: (user: any, tokens: any) => {
                this.user = user;
                // Handle authentication success
            }
        });
        this.widget.init();
    }
    
    showLogin() {
        this.widget.showLogin();
    }
}
```

## Styling and Theming

The widget uses CSS custom properties for easy theming:

```css
:root {
    --idp-primary: #2563eb;
    --idp-primary-hover: #1d4ed8;
    --idp-background: #ffffff;
    --idp-text: #1e293b;
    --idp-border: #e2e8f0;
    --idp-radius: 8px;
}

/* Dark theme example */
[data-theme="dark"] {
    --idp-primary: #3b82f6;
    --idp-background: #1e293b;
    --idp-text: #f1f5f9;
    --idp-border: #334155;
}
```

## Security Considerations

- **Token Storage**: Tokens are stored in localStorage by default. Consider using httpOnly cookies for production.
- **HTTPS Only**: Always use HTTPS in production to protect token transmission.
- **Client Secrets**: Never expose client secrets in frontend code. Use public OAuth2 flows or proxy through your backend.
- **CSP Headers**: Configure Content Security Policy headers to allow widget resources.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
idp-widget/
├── index.html          # Widget HTML structure
├── styles.css          # Widget styles and themes
├── idp-widget.js       # Core widget functionality
├── integration.js      # Integration helper script
├── demo.html          # Live demo and examples
└── README.md          # This file
```

## API Endpoints

The widget communicates with these IdP backend endpoints:

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/auth/password-reset` - Password reset request
- `GET /api/oauth2/linkedin/authorize` - LinkedIn OAuth2 authorization
- `POST /api/oauth2/linkedin/callback` - LinkedIn OAuth2 callback

## Error Handling

The widget provides comprehensive error handling:

```javascript
{
    onError: function(error) {
        switch(error.type) {
            case 'validation':
                // Handle form validation errors
                break;
            case 'network':
                // Handle network connectivity issues
                break;
            case 'authentication':
                // Handle invalid credentials
                break;
            case 'server':
                // Handle server errors
                break;
        }
    }
}
```

## Development

### Local Development

1. Start the IdP backend server on port 8082
2. Open `demo.html` in your browser
3. Test authentication flows

### Building for Production

1. Minify CSS and JavaScript files
2. Upload to your CDN (S3, CloudFront, etc.)
3. Update asset URLs in integration script
4. Configure CORS on your IdP backend

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the demo.html file for working examples
- Review the IdP backend API documentation
- Ensure CORS is properly configured
- Verify client credentials and redirect URIs
