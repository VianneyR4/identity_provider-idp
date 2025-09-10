/**
 * IdP Widget - Lightweight Authentication Widget
 * Integrates with Spring Boot Identity Provider
 */

class IdPWidget {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || 'http://localhost:8082/api',
            clientId: config.clientId || 'No-Client-Id-provided',
            clientSecret: config.clientSecret || 'No-Client-Secret-provided',
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

        this.elements = {
            widget,
            loading: widget.querySelector('#idp-loading'),
            loginForm: widget.querySelector('#idp-login-form'),
            registerForm: widget.querySelector('#idp-register-form'),
            resetForm: widget.querySelector('#idp-reset-form'),
            successMessage: widget.querySelector('#idp-success-message'),
            
            // Login elements
            loginEmail: widget.querySelector('#login-email'),
            loginPassword: widget.querySelector('#login-password'),
            loginSubmit: widget.querySelector('#login-submit'),
            linkedinLogin: widget.querySelector('#linkedin-login'),
            googleLogin: widget.querySelector('#google-login'),
            
            // Register elements
            registerFirstName: widget.querySelector('#register-firstname'),
            registerLastName: widget.querySelector('#register-lastname'),
            registerEmail: widget.querySelector('#register-email'),
            registerPassword: widget.querySelector('#register-password'),
            registerConfirmPassword: widget.querySelector('#register-confirm-password'),
            registerSubmit: widget.querySelector('#register-submit'),
            linkedinRegister: widget.querySelector('#linkedin-register'),
            googleRegister: widget.querySelector('#google-register'),
            termsCheckbox: widget.querySelector('#terms-checkbox'),
            
            // Reset elements
            resetEmail: widget.querySelector('#reset-email'),
            resetSubmit: widget.querySelector('#reset-submit'),
            
            // Navigation elements
            showRegister: widget.querySelector('#show-register'),
            showLogin: widget.querySelector('#show-login'),
            forgotPasswordLink: widget.querySelector('#forgot-password-link'),
            backToLogin: widget.querySelector('#back-to-login'),
            successContinue: widget.querySelector('#success-continue'),
            
            // Success elements
            successTitle: widget.querySelector('#success-title'),
            successMessageText: widget.querySelector('#success-message')
        };
    }

    bindEvents() {
        // Form submissions
        const loginForm = this.elements.loginForm?.querySelector('#login-form');
        const registerForm = this.elements.registerForm?.querySelector('#register-form');
        const resetForm = this.elements.resetForm?.querySelector('#reset-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('Login form event bound');
        } else {
            console.warn('Login form not found');
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            console.log('Register form event bound');
        } else {
            console.warn('Register form not found');
        }
        
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
            console.log('Reset form event bound');
        } else {
            console.warn('Reset form not found');
        }

        // LinkedIn OAuth
        this.elements.linkedinLogin?.addEventListener('click', () => this.handleLinkedInAuth());
        this.elements.linkedinRegister?.addEventListener('click', () => this.handleLinkedInAuth());

        // Google OAuth
        this.elements.googleLogin?.addEventListener('click', () => this.handleGoogleAuth());
        this.elements.googleRegister?.addEventListener('click', () => this.handleGoogleAuth());

        // Navigation
        this.elements.showRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('register');
        });
        this.elements.showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('login');
        });
        this.elements.forgotPasswordLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('reset');
        });
        this.elements.backToLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('login');
        });
        this.elements.successContinue?.addEventListener('click', () => {
            // Only call onSuccess if we have both user and tokens (login/OAuth)
            // For registration, just switch back to login view
            if (this.state.user && this.state.tokens) {
                this.config.onSuccess(this.state.user, this.state.tokens);
            } else {
                // Registration success - switch to login view
                this.showView('login');
            }
        });

        // Password strength indicator
        this.elements.registerPassword?.addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });

        // Real-time validation
        this.elements.registerConfirmPassword?.addEventListener('input', (e) => {
            this.validatePasswordMatch();
        });

        // Handle OAuth callback
        this.handleOAuthCallback();
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = this.elements.loginEmail.value.trim();
        const password = this.elements.loginPassword.value;

        if (!this.validateLoginForm(email, password)) {
            return;
        }

        this.setLoading(true, 'login');
        this.clearErrors();

        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    clientId: this.config.clientId,
                    clientSecret: this.config.clientSecret
                })
            });

            if (response.success) {
                this.handleAuthSuccess(response.data);
            } else {
                this.showError('login-error', response.message || response.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error responses from backend
            if (error.data && error.data.message && error.data.error) {
                this.showError('login-error', error.data.message + ': ' + error.data.error);
            } else if (error.data && error.data.error) {
                // Map backend error messages to user-friendly messages
                const errorMessage = this.mapErrorMessage(error.data.error);
                this.showError('login-error', errorMessage);
            } else {
                this.showError('login-error', 'Network error. Please try again.');
            }
        } finally {
            this.setLoading(false, 'login');
        }
    }

    mapErrorMessage(backendError) {
        const errorMappings = {
            'Invalid client': 'Authentication service configuration error. Please contact support.',
            'User not found': 'No account found with this email address. Please check your email or sign up.',
            'Invalid credentials': 'Incorrect email or password. Please try again.',
            'Account locked': 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later.',
            'Email not verified': 'Please verify your email address before signing in. Check your inbox for the verification link.',
            'Account disabled': 'Your account has been disabled. Please contact support for assistance.',
            'Invalid password': 'Incorrect password. Please try again.',
            'Authentication failed': 'Login failed. Please check your email and password.'
        };

        return errorMappings[backendError] || backendError || 'Login failed. Please try again.';
    }

    async handleRegister(event) {
        event.preventDefault();
        console.log('Registration form submitted');
        
        const formData = {
            firstName: this.elements.registerFirstName?.value?.trim() || '',
            lastName: this.elements.registerLastName?.value?.trim() || '',
            email: this.elements.registerEmail?.value?.trim() || '',
            password: this.elements.registerPassword?.value || '',
            confirmPassword: this.elements.registerConfirmPassword?.value || ''
        };

        // Validate form
        if (!this.validateRegisterForm(formData)) {
            return;
        }

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

            console.log('Server response received:', response);
            
            if (response.success) {
                console.log('Registration successful!');
                this.showSuccess('Account Created Successfully!', 
                    'Welcome! Your account has been created. Please check your email to verify your account, then you can sign in.');
            } else {
                console.log('Registration failed:', response);
                this.handleRegistrationError(response);
            }
        } catch (error) {
            console.error('Registration network error:', error);
            this.handleRegistrationError(error.data || error);
        } finally {
            this.setLoading(false, 'register');
        }

    }

    // Add this new method to handle registration errors
    handleRegistrationError(errorResponse) {
        console.log('Handling registration error:', errorResponse);
        
        // Clear previous errors
        this.clearErrors();
        
        // Handle different error response formats
        if (errorResponse.errors) {
            // Server returned field-specific validation errors
            Object.keys(errorResponse.errors).forEach(field => {
                const errorMessage = errorResponse.errors[field];
                const errorElementId = `register-${field.toLowerCase()}-error`;
                
                // Map server field names to our form field names if needed
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
            
            // Show general error message if specific field errors exist
            if (Object.keys(errorResponse.errors).length > 0) {
                this.showError('register-error', 'Please fix the errors below and try again.');
            }
            
        } else if (errorResponse.error) {
            // Server returned a specific error message - prioritize this
            this.showError('register-error', errorResponse.error);
            
        } else if (errorResponse.message) {
            // Server returned a general error message
            this.showError('register-error', errorResponse.message);
            
        } else {
            // Fallback for unknown error format
            this.showError('register-error', 'Registration failed. Please try again.');
        }
        
        // Additional error types you might encounter
        if (errorResponse.code === 'EMAIL_ALREADY_EXISTS') {
            this.showFieldError('register-email-error', 'This email is already registered. Please use a different email or try signing in.');
        }
        
        if (errorResponse.code === 'WEAK_PASSWORD') {
            this.showFieldError('register-password-error', 'Password is too weak. Please use a stronger password.');
        }
    }

    async handlePasswordReset(event) {
        event.preventDefault();
        
        const email = this.elements.resetEmail.value.trim();

        if (!email) {
            this.showFieldError('reset-email-error', 'Email is required');
            return;
        }

        this.setLoading(true, 'reset');
        this.clearErrors();

        try {
            const response = await this.apiCall('/auth/password-reset', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (response.success) {
                this.showSuccess('Reset Link Sent!', 
                    'Please check your email for password reset instructions.');
            } else {
                this.showError('reset-error', response.message || 'Password reset failed');
            }
        } catch (error) {
            this.showError('reset-error', 'Network error. Please try again.');
            console.error('Password reset error:', error);
        } finally {
            this.setLoading(false, 'reset');
        }
    }

    async handleLinkedInAuth() {
        try {
            const state = this.generateState();
            
            // Call backend to get LinkedIn authorization URL
            const params = new URLSearchParams({
                clientId: this.config.clientId,
                state: state
            });
            
            const response = await this.apiCall(`/oauth2/linkedin/authorize?${params.toString()}`, {
                method: 'GET'
            });
            
            if (response.success) {
                // Open LinkedIn auth in popup window
                const popup = window.open(
                    response.data,
                    'linkedin-auth',
                    'width=600,height=700,scrollbars=yes,resizable=yes'
                );
                
                // Listen for callback message from popup
                const messageHandler = (event) => {
                    if (event.data && event.data.type === 'linkedin_callback') {
                        window.removeEventListener('message', messageHandler);
                        this.processOAuthCallback(event.data.code, event.data.state, 'linkedin');
                    }
                };
                
                window.addEventListener('message', messageHandler);
                
                // Check if popup was closed without authentication
                const checkClosed = setInterval(() => {
                    try {
                        if (popup.closed) {
                            clearInterval(checkClosed);
                            window.removeEventListener('message', messageHandler);
                            console.log('LinkedIn authentication popup was closed');
                        }
                    } catch (error) {
                        // Ignore COOP errors - OAuth provider's security policy blocks popup.closed access
                        // The popup will still work via postMessage when authentication completes
                    }
                }, 1000);
                
            } else {
                this.showError('general', response.message || 'Failed to initiate LinkedIn authentication');
            }
        } catch (error) {
            console.error('LinkedIn auth error:', error);
            this.showError('general', 'Failed to initiate LinkedIn authentication');
        }
    }

    async handleGoogleAuth() {
        try {
            const state = this.generateState();
            
            // Call backend to get Google authorization URL
            const response = await this.apiCall('/oauth2/google/auth', {
                method: 'GET'
            });
            
            if (response.success) {
                // Open Google auth in popup window
                const popup = window.open(
                    response.data,
                    'google-auth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                );
                
                // Listen for callback message from popup
                const messageHandler = (event) => {
                    if (event.data && event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
                        window.removeEventListener('message', messageHandler);
                        this.processOAuthCallback(event.data.code, event.data.state, 'google');
                    }
                };
                
                window.addEventListener('message', messageHandler);
                
                // Check if popup was closed without authentication
                const checkClosed = setInterval(() => {
                    try {
                        if (popup.closed) {
                            clearInterval(checkClosed);
                            window.removeEventListener('message', messageHandler);
                            console.log('Google authentication popup was closed');
                        }
                    } catch (error) {
                        // Ignore COOP errors - Google's security policy blocks popup.closed access
                        // The popup will still work via postMessage when authentication completes
                    }
                }, 1000);
                
            } else {
                this.showError('general', response.message || 'Failed to initiate Google authentication');
            }
        } catch (error) {
            console.error('Google auth error:', error);
            this.showError('general', 'Failed to initiate Google authentication');
        }
    }

    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            this.showError('login-error', 'OAuth authentication failed');
            return;
        }

        if (code && state) {
            // Determine provider based on URL or other context
            const provider = window.location.pathname.includes('linkedin') ? 'linkedin' : 'google';
            this.processOAuthCallback(code, state, provider);
        }
    }

    async processOAuthCallback(code, state, provider = 'linkedin') {
        this.setLoading(true);

        try {
            const params = new URLSearchParams({
                code: code,
                clientId: this.config.clientId,
                state: state
            });
            
            const endpoint = provider === 'google' ? '/oauth2/google/callback' : '/oauth2/linkedin/callback';
            const response = await this.apiCall(`${endpoint}?${params.toString()}`, {
                method: 'POST'
            });

            if (response.success) {
                this.handleAuthSuccess(response.data);
            } else {
                this.showError('login-error', response.message || `${provider} authentication failed`);
            }
        } catch (error) {
            this.showError('login-error', `Network error during ${provider} authentication`);
            console.error(`${provider} OAuth callback error:`, error);
        } finally {
            this.setLoading(false);
        }
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

    // Validation methods
    validateLoginForm(email, password) {
        let isValid = true;

        if (!email) {
            this.showFieldError('login-email-error', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('login-email-error', 'Please enter a valid email');
            isValid = false;
        }

        if (!password) {
            this.showFieldError('login-password-error', 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(formData) {
        let isValid = true;

        if (!formData.firstName) {
            this.showFieldError('register-firstname-error', 'First name is required');
            isValid = false;
        }

        if (!formData.lastName) {
            this.showFieldError('register-lastname-error', 'Last name is required');
            isValid = false;
        }

        if (!formData.email) {
            this.showFieldError('register-email-error', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(formData.email)) {
            this.showFieldError('register-email-error', 'Please enter a valid email');
            isValid = false;
        }

        if (!formData.password) {
            this.showFieldError('register-password-error', 'Password is required');
            isValid = false;
        } else if (!this.isValidPassword(formData.password)) {
            console.log('Password validation failed for:', formData.password);
            console.log('Password requirements: 8+ chars, uppercase, lowercase, number');
            this.showFieldError('register-password-error', 
                'Password must be at least 8 characters with uppercase, lowercase, and number');
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            this.showFieldError('register-confirm-password-error', 'Passwords do not match');
            isValid = false;
        }

        if (!this.elements.termsCheckbox?.checked) {
            console.log('Terms checkbox validation failed - not checked');
            this.showFieldError('terms-error', 'You must agree to the terms and conditions');
            isValid = false;
        }

        // Show general error message if validation failed
        if (!isValid) {
            console.log('Form validation failed - check error messages above');
            this.showError('register-error', 'Please fix the errors below and try again.');
        }

        return isValid;
    }

    validatePasswordMatch() {
        const password = this.elements.registerPassword.value;
        const confirmPassword = this.elements.registerConfirmPassword.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError('register-confirm-password-error', 'Passwords do not match');
        } else {
            this.clearFieldError('register-confirm-password-error');
        }
    }

    updatePasswordStrength(password) {
        const strengthContainer = document.getElementById('password-strength');
        if (!strengthContainer) return;

        const strength = this.calculatePasswordStrength(password);
        
        strengthContainer.innerHTML = `
            <div class="idp-strength-bar ${strength.level}"></div>
            <div class="idp-strength-bar ${strength.score >= 2 ? strength.level : ''}"></div>
            <div class="idp-strength-bar ${strength.score >= 3 ? strength.level : ''}"></div>
            <div class="idp-strength-bar ${strength.score >= 4 ? strength.level : ''}"></div>
            <div class="idp-strength-text">${strength.text}</div>
        `;
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let text = '';
        let level = '';

        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) {
            text = 'Weak password';
            level = 'weak';
        } else if (score <= 3) {
            text = 'Medium password';
            level = 'medium';
        } else {
            text = 'Strong password';
            level = 'strong';
        }

        return { score, text, level };
    }

    // Utility methods
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPassword(password) {
        return password.length >= 8 && 
               /[a-z]/.test(password) && 
               /[A-Z]/.test(password) && 
               /[0-9]/.test(password);
    }

    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // UI methods
    showView(viewName) {
        console.log('Showing view:', viewName);
        
        const views = {
            'login': this.elements.loginForm,
            'register': this.elements.registerForm, 
            'reset': this.elements.resetForm,
            'success': this.elements.successMessage
        };
        
        // Debug: log all elements
        console.log('Available views:', Object.keys(views).map(key => ({
            view: key,
            element: views[key] ? views[key].id || 'no-id' : 'null'
        })));
        
        // Hide all views
        Object.entries(views).forEach(([viewKey, element]) => {
            if (element) {
                // console.log('Hiding element:', element.id || element.className);
                element.style.display = 'none';
            }
        });
        
        // Show the requested view
        if (views[viewName]) {
            // console.log('Showing element:', views[viewName].id || views[viewName].className);
            views[viewName].style.display = 'block';
            
            // Ensure parent containers are visible
            let parent = views[viewName].parentElement;
            while (parent && parent !== document.body) {
                if (parent.style.display === 'none') {
                    // console.log('Making parent visible:', parent.id || parent.className);
                    parent.style.display = 'block';
                }
                parent = parent.parentElement;
            }
        } else {
            console.error('View not found:', viewName, 'Available views:', Object.keys(views));
        }
        
        this.elements.loading.style.display = 'none';
        this.state.currentView = viewName;
        this.clearErrors();
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    }

    setLoading(loading, context = '') {
        this.state.loading = loading;
        
        if (context) {
            const submitButton = this.elements[`${context}Submit`];
            if (submitButton) {
                const spinner = submitButton.querySelector('.idp-btn-spinner');
                const text = submitButton.querySelector('.idp-btn-text');
                
                if (loading) {
                    spinner.style.display = 'block';
                    text.style.display = 'none';
                    submitButton.disabled = true;
                } else {
                    spinner.style.display = 'none';
                    text.style.display = 'block';
                    submitButton.disabled = false;
                }
            }
        } else {
            this.elements.loading.style.display = loading ? 'flex' : 'none';
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showFieldError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.style.color = '#dc3545';
            errorElement.style.fontSize = '0.875rem';
            errorElement.style.marginTop = '0.25rem';
        }
    }

    clearFieldError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    clearErrors() {
        const errorElements = this.elements.widget.querySelectorAll('.idp-error, .idp-error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    showSuccess(title, message) {
        console.log('showSuccess called with:', { title, message });
        
        // Ensure success elements exist
        if (!this.elements.successMessage) {
            console.error('Success message container not found!');
            // Fallback to alert if container is missing
            alert(`${title}\n\n${message}`);
            return;
        }
        
        if (this.elements.successTitle) {
            this.elements.successTitle.textContent = title;
            console.log('Success title set:', title);
        } else {
            console.warn('Success title element not found');
        }
        
        if (this.elements.successMessageText) {
            this.elements.successMessageText.textContent = message;
            console.log('Success message text set:', message);
        } else {
            console.warn('Success message text element not found');
        }
        
        // Clear any existing state that might interfere
        this.state.user = null;
        this.state.tokens = null;
        
        console.log('Calling showView with success');
        this.showView('success');
    }

    // Token management
    storeTokens(tokens) {
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('idp_access_token', tokens.accessToken);
            localStorage.setItem('idp_refresh_token', tokens.refreshToken);
        }
    }

    loadStoredTokens() {
        if (typeof Storage !== 'undefined') {
            const accessToken = localStorage.getItem('idp_access_token');
            const refreshToken = localStorage.getItem('idp_refresh_token');
            
            if (accessToken && refreshToken) {
                this.state.tokens = { accessToken, refreshToken };
                return true;
            }
        }
        return false;
    }

    clearTokens() {
        this.state.tokens = null;
        if (typeof Storage !== 'undefined') {
            localStorage.removeItem('idp_access_token');
            localStorage.removeItem('idp_refresh_token');
        }
    }

    // API methods
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (this.state.tokens?.accessToken) {
            defaultOptions.headers.Authorization = `Bearer ${this.state.tokens.accessToken}`;
        }

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        
        if (!response.ok) {
            // Return the error data so we can access the specific error message
            throw { status: response.status, data };
        }
        
        return data;
    }

    // Public API
    getUser() {
        return this.state.user;
    }

    getTokens() {
        return this.state.tokens;
    }

    isAuthenticated() {
        return !!(this.state.tokens?.accessToken);
    }

    logout() {
        this.clearTokens();
        this.state.user = null;
        this.showView('login');
        this.config.onStateChange('logged_out', null);
    }

    // Default event handlers
    defaultSuccessHandler(user, tokens) {
        console.log('IdP Widget: Authentication successful', { user, tokens });
    }

    defaultErrorHandler(error) {
        console.error('IdP Widget: Error occurred', error);
    }

    defaultStateChangeHandler(state, data) {
        console.log('IdP Widget: State changed', { state, data });
    }
}

// Auto-initialize if config is provided
window.IdPWidget = IdPWidget;

// Initialize widget if configuration is found
document.addEventListener('DOMContentLoaded', () => {
    if (window.idpWidgetConfig) {
        window.idpWidget = new IdPWidget(window.idpWidgetConfig);
    }
});
