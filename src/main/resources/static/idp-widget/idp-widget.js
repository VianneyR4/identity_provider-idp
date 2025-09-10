/**
 * IdP Widget - Lightweight Authentication Widget
 * Integrates with Spring Boot Identity Provider
 */

class IdPWidget {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || 'http://localhost:8082/api',
            clientId: config.clientId || 'demo-app',
            clientSecret: config.clientSecret || 'demo-secret',
            redirectUri: config.redirectUri || window.location.origin + '/auth/callback',
            onSuccess: config.onSuccess || this.defaultSuccessHandler,
            onError: config.onError || this.defaultErrorHandler,
            onStateChange: config.onStateChange || this.defaultStateChangeHandler,
            autoInit: config.autoInit !== false,
            theme: config.theme || 'light',
            ...config
        };

        this.state = {
            currentView: 'login',
            loading: false,
            user: null,
            tokens: null
        };

        this.elements = {};
        
        if (this.config.autoInit) {
            this.init();
        }
    }

    init() {
        console.log('IdP Widget initializing...');
        this.bindElements();
        this.bindEvents();
        this.loadStoredTokens();
        this.hideLoading();
        this.showView('login');
        console.log('IdP Widget initialized successfully');
    }

    bindElements() {
        const widget = document.getElementById('idp-widget');
        if (!widget) {
            console.error('IdP Widget: Container element #idp-widget not found');
            return;
        }

        // Bind form elements
        this.elements = {
            // Login elements
            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            loginBtn: document.getElementById('login-btn'),
            loginForm: document.getElementById('login-form'),
            
            // Register elements
            registerFirstName: document.getElementById('register-firstName'),
            registerLastName: document.getElementById('register-lastName'),
            registerEmail: document.getElementById('register-email'),
            registerPassword: document.getElementById('register-password'),
            registerConfirmPassword: document.getElementById('register-confirmPassword'),
            registerBtn: document.getElementById('register-btn'),
            registerForm: document.getElementById('register-form'),
            
            // Navigation elements
            showRegisterLink: document.getElementById('show-register'),
            showLoginLink: document.getElementById('show-login'),
            
            // View containers
            loginView: document.getElementById('login-view'),
            registerView: document.getElementById('register-view'),
            
            // Loading elements
            loadingOverlay: document.getElementById('loading-overlay'),
            
            // OAuth elements
            linkedinBtn: document.getElementById('linkedin-btn')
        };
    }

    bindEvents() {
        // Login form submission
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form submission
        if (this.elements.registerForm) {
            this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // View navigation
        if (this.elements.showRegisterLink) {
            this.elements.showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('register');
            });
        }
        
        if (this.elements.showLoginLink) {
            this.elements.showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('login');
            });
        }
        
        // OAuth buttons
        if (this.elements.linkedinBtn) {
            this.elements.linkedinBtn.addEventListener('click', (e) => this.handleLinkedInLogin(e));
        }
    }

    render() {
        const container = document.getElementById(this.config.containerId);
        if (!container) {
            console.error('IdP Widget: Container not found:', this.config.containerId);
            return;
        }

        container.innerHTML = `
            <div id="idp-widget" class="idp-widget">
                <div class="idp-widget-container">
                    <!-- Login View -->
                    <div id="login-view" class="idp-view">
                        <div class="idp-header">
                            <h2>Sign In</h2>
                            <p>Welcome back! Please sign in to your account.</p>
                        </div>
                        
                        <form id="login-form" class="idp-form">
                            <div class="idp-field">
                                <label for="login-email">Email</label>
                                <input type="email" id="login-email" required>
                                <div id="login-email-error" class="idp-error"></div>
                            </div>
                            
                            <div class="idp-field">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" required>
                                <div id="login-password-error" class="idp-error"></div>
                            </div>
                            
                            <div id="login-error" class="idp-error idp-error-general"></div>
                            
                            <button type="submit" id="login-btn" class="idp-btn idp-btn-primary">
                                Sign In
                            </button>
                        </form>
                        
                        <div class="idp-divider">
                            <span>or</span>
                        </div>
                        
                        <button id="linkedin-btn" class="idp-btn idp-btn-oauth idp-btn-linkedin">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            Continue with LinkedIn
                        </button>
                        
                        <div class="idp-footer">
                            <p>Don't have an account? <a href="#" id="show-register">Sign up</a></p>
                        </div>
                    </div>
                    
                    <!-- Register View -->
                    <div id="register-view" class="idp-view" style="display: none;">
                        <div class="idp-header">
                            <h2>Create Account</h2>
                            <p>Join us today! Create your account to get started.</p>
                        </div>
                        
                        <form id="register-form" class="idp-form">
                            <div class="idp-field">
                                <label for="register-firstName">First Name</label>
                                <input type="text" id="register-firstName" required>
                                <div id="register-firstName-error" class="idp-error"></div>
                            </div>
                            
                            <div class="idp-field">
                                <label for="register-lastName">Last Name</label>
                                <input type="text" id="register-lastName" required>
                                <div id="register-lastName-error" class="idp-error"></div>
                            </div>
                            
                            <div class="idp-field">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" required>
                                <div id="register-email-error" class="idp-error"></div>
                            </div>
                            
                            <div class="idp-field">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" required>
                                <div id="register-password-error" class="idp-error"></div>
                            </div>
                            
                            <div class="idp-field">
                                <label for="register-confirmPassword">Confirm Password</label>
                                <input type="password" id="register-confirmPassword" required>
                                <div id="register-confirmPassword-error" class="idp-error"></div>
                            </div>
                            
                            <div id="register-error" class="idp-error idp-error-general"></div>
                            <div id="register-success" class="idp-success"></div>
                            
                            <button type="submit" id="register-btn" class="idp-btn idp-btn-primary">
                                Create Account
                            </button>
                        </form>
                        
                        <div class="idp-footer">
                            <p>Already have an account? <a href="#" id="show-login">Sign in</a></p>
                        </div>
                    </div>
                    
                    <!-- Loading Overlay -->
                    <div id="loading-overlay" class="idp-loading-overlay" style="display: none;">
                        <div class="idp-spinner"></div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addStyles();
        
        // Re-bind elements and events after rendering
        this.bindElements();
        this.bindEvents();
    }

    addStyles() {
        if (document.getElementById('idp-widget-styles')) return;

        const style = document.createElement('style');
        style.id = 'idp-widget-styles';
        style.textContent = `
            .idp-widget {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 400px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .idp-widget-container {
                position: relative;
                padding: 2rem;
            }
            
            .idp-view {
                animation: fadeIn 0.3s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .idp-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .idp-header h2 {
                margin: 0 0 0.5rem 0;
                color: #1f2937;
                font-size: 1.5rem;
                font-weight: 600;
            }
            
            .idp-header p {
                margin: 0;
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .idp-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .idp-field {
                display: flex;
                flex-direction: column;
            }
            
            .idp-field label {
                margin-bottom: 0.5rem;
                color: #374151;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .idp-field input {
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 0.875rem;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            
            .idp-field input:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .idp-btn {
                padding: 0.75rem 1rem;
                border: none;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            
            .idp-btn-primary {
                background: #3b82f6;
                color: white;
            }
            
            .idp-btn-primary:hover {
                background: #2563eb;
            }
            
            .idp-btn-primary:disabled {
                background: #9ca3af;
                cursor: not-allowed;
            }
            
            .idp-btn-oauth {
                background: white;
                border: 1px solid #d1d5db;
                color: #374151;
                margin-top: 1rem;
            }
            
            .idp-btn-linkedin {
                background: #0077b5;
                color: white;
                border: none;
            }
            
            .idp-btn-linkedin:hover {
                background: #005885;
            }
            
            .idp-divider {
                display: flex;
                align-items: center;
                margin: 1.5rem 0;
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .idp-divider::before,
            .idp-divider::after {
                content: '';
                flex: 1;
                height: 1px;
                background: #e5e7eb;
            }
            
            .idp-divider span {
                padding: 0 1rem;
            }
            
            .idp-footer {
                text-align: center;
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e5e7eb;
            }
            
            .idp-footer p {
                margin: 0;
                color: #6b7280;
                font-size: 0.875rem;
            }
            
            .idp-footer a {
                color: #3b82f6;
                text-decoration: none;
                font-weight: 500;
            }
            
            .idp-footer a:hover {
                text-decoration: underline;
            }
            
            .idp-error {
                color: #dc2626;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: none;
            }
            
            .idp-error-general {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: 0.75rem;
                margin: 1rem 0;
            }
            
            .idp-success {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 6px;
                padding: 0.75rem;
                margin: 1rem 0;
                color: #166534;
                font-size: 0.875rem;
                display: none;
            }
            
            .idp-loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
            }
            
            .idp-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #e5e7eb;
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = {
            email: this.elements.loginEmail?.value?.trim() || '',
            password: this.elements.loginPassword?.value || ''
        };

        if (!this.validateLoginForm(formData)) return;

        this.setLoading(true, 'login');
        this.clearErrors();

        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    clientId: this.config.clientId
                })
            });

            if (response.success) {
                this.handleAuthSuccess(response.data);
            } else {
                this.showError('login-error', response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login-error', error.message || 'Network error. Please try again.');
        } finally {
            this.setLoading(false, 'login');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const formData = {
            firstName: this.elements.registerFirstName?.value?.trim() || '',
            lastName: this.elements.registerLastName?.value?.trim() || '',
            email: this.elements.registerEmail?.value?.trim() || '',
            password: this.elements.registerPassword?.value || '',
            confirmPassword: this.elements.registerConfirmPassword?.value || ''
        };

        if (!this.validateRegisterForm(formData)) return;

        this.setLoading(true, 'register');
        this.clearErrors();

        try {
            const response = await this.apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    clientId: this.config.clientId
                })
            });

            if (response.success) {
                this.showSuccess('Account Created Successfully!', 'Welcome! Your account has been created. Please check your email to verify your account, then you can sign in.');
            } else {
                this.handleRegistrationError(response);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.handleRegistrationError(error.data || error);
        } finally {
            this.setLoading(false, 'register');
        }
    }

    handleRegistrationError(errorResponse) {
        this.clearErrors();

        if (errorResponse.errors) {
            // Handle field-specific validation errors
            Object.keys(errorResponse.errors).forEach(field => {
                const errorMessage = errorResponse.errors[field];
                const fieldMappings = {
                    'password': 'password',
                    'email': 'email',
                    'firstname': 'firstName',
                    'lastname': 'lastName'
                };
                const actualField = fieldMappings[field.toLowerCase()] || field;
                const actualErrorElementId = `register-${actualField}-error`;
                this.showFieldError(actualErrorElementId, errorMessage);
            });

            if (Object.keys(errorResponse.errors).length > 0) {
                this.showError('register-error', 'Please fix the errors below and try again.');
            }
        } else if (errorResponse.error) {
            this.showError('register-error', errorResponse.error);
        } else if (errorResponse.message) {
            this.showError('register-error', errorResponse.message);
        } else {
            this.showError('register-error', 'Registration failed. Please try again.');
        }

        // Handle special error codes
        if (errorResponse.code === 'EMAIL_ALREADY_EXISTS') {
            this.showFieldError('register-email-error', 'This email is already registered. Please use a different email or try signing in.');
        }

        if (errorResponse.code === 'WEAK_PASSWORD') {
            this.showFieldError('register-password-error', 'Password is too weak. Please use a stronger password.');
        }
    }

    validateLoginForm(formData) {
        let isValid = true;

        if (!formData.email) {
            this.showFieldError('login-email-error', 'Email is required');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            this.showFieldError('login-email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (!formData.password) {
            this.showFieldError('login-password-error', 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(formData) {
        let isValid = true;

        if (!formData.firstName) {
            this.showFieldError('register-firstName-error', 'First name is required');
            isValid = false;
        }

        if (!formData.lastName) {
            this.showFieldError('register-lastName-error', 'Last name is required');
            isValid = false;
        }

        if (!formData.email) {
            this.showFieldError('register-email-error', 'Email is required');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            this.showFieldError('register-email-error', 'Please enter a valid email address');
            isValid = false;
        }

        if (!formData.password) {
            this.showFieldError('register-password-error', 'Password is required');
            isValid = false;
        } else if (formData.password.length < 6) {
            this.showFieldError('register-password-error', 'Password must be at least 6 characters long');
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            this.showFieldError('register-confirmPassword-error', 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    handleAuthSuccess(data) {
        this.state.user = data.user;
        this.state.tokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
        };
        this.storeTokens(this.state.tokens);
        this.config.onSuccess(this.state.user, this.state.tokens);
    }

    showView(viewName) {
        this.state.currentView = viewName;
        
        // Hide all views
        const views = ['login-view', 'register-view'];
        views.forEach(view => {
            const element = document.getElementById(view);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // Show target view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        this.clearErrors();
    }

    showFieldError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '0.875rem';
            errorElement.style.marginTop = '0.25rem';
            
            const fieldId = elementId.replace('-error', '');
            const fieldElement = document.getElementById(fieldId);
            if (fieldElement) {
                fieldElement.style.borderColor = '#dc3545';
                fieldElement.addEventListener('input', function clearError() {
                    fieldElement.style.borderColor = '';
                    errorElement.style.display = 'none';
                    fieldElement.removeEventListener('input', clearError);
                }, { once: true });
            }
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showSuccess(title, message) {
        const successElement = document.getElementById('register-success');
        if (successElement) {
            successElement.innerHTML = `<strong>${title}</strong><br>${message}`;
            successElement.style.display = 'block';
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.idp-error');
        errorElements.forEach(element => {
            element.style.display = 'none';
            element.textContent = '';
        });

        const fieldElements = document.querySelectorAll('.idp-field input');
        fieldElements.forEach(element => {
            element.style.borderColor = '';
        });

        const successElement = document.getElementById('register-success');
        if (successElement) {
            successElement.style.display = 'none';
        }
    }

    setLoading(loading, context = null) {
        this.state.loading = loading;
        
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = loading ? 'flex' : 'none';
        }
        
        // Update button states
        if (context === 'login' && this.elements.loginBtn) {
            this.elements.loginBtn.disabled = loading;
            this.elements.loginBtn.textContent = loading ? 'Signing In...' : 'Sign In';
        } else if (context === 'register' && this.elements.registerBtn) {
            this.elements.registerBtn.disabled = loading;
            this.elements.registerBtn.textContent = loading ? 'Creating Account...' : 'Create Account';
        }
    }

    hideLoading() {
        this.setLoading(false);
    }

    async apiCall(endpoint, options = {}) {
        const url = this.config.apiBaseUrl + endpoint;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        return await response.json();
    }

    storeTokens(tokens) {
        if (tokens) {
            localStorage.setItem('idp_access_token', tokens.accessToken);
            localStorage.setItem('idp_refresh_token', tokens.refreshToken);
        }
    }

    loadStoredTokens() {
        const accessToken = localStorage.getItem('idp_access_token');
        const refreshToken = localStorage.getItem('idp_refresh_token');
        
        if (accessToken && refreshToken) {
            this.state.tokens = { accessToken, refreshToken };
        }
    }

    clearStoredTokens() {
        localStorage.removeItem('idp_access_token');
        localStorage.removeItem('idp_refresh_token');
        this.state.tokens = null;
        this.state.user = null;
    }

    // Public API methods
    getUser() {
        return this.state.user;
    }

    getTokens() {
        return this.state.tokens;
    }

    isAuthenticated() {
        return !!(this.state.user && this.state.tokens);
    }

    logout() {
        this.clearStoredTokens();
        this.showView('login');
    }

    // Default handlers
    defaultSuccessHandler(user, tokens) {
        console.log('Authentication successful:', { user, tokens });
    }

    defaultErrorHandler(error) {
        console.error('Authentication error:', error);
    }

    defaultStateChangeHandler(state) {
        console.log('State changed:', state);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IdPWidget;
} else if (typeof window !== 'undefined') {
    window.IdPWidget = IdPWidget;
}
