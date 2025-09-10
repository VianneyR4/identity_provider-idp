/**
 * IdP Widget Integration Script
 * Easy integration for any website
 */

(function() {
    'use strict';

    // Widget integration configuration
    const WIDGET_CONFIG = {
        // Default configuration - can be overridden
        apiBaseUrl: 'http://localhost:8080/api',
        clientId: 'my-application-4a228281',
        clientSecret: 'JT3DlA9pW3jXFGnFX6U3431X6sIRYOTJ',
        theme: 'light',
        position: 'center', // center, top-right, bottom-right, custom
        modal: true, // Show as modal or embed inline
        autoClose: true, // Auto close on successful auth
        
        // Callbacks
        onSuccess: null,
        onError: null,
        onClose: null
    };

    class IdPWidgetIntegration {
        constructor(userConfig = {}) {
            this.config = { ...WIDGET_CONFIG, ...userConfig };
            this.widget = null;
            this.overlay = null;
            this.container = null;
            this.isOpen = false;
        }

        init() {
            this.loadWidgetAssets();
            this.createContainer();
            this.bindGlobalEvents();
        }

        loadWidgetAssets() {
            // Load CSS if not already loaded
            if (!document.querySelector('link[href*="idp-widget"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = this.getAssetUrl('styles.css');
                document.head.appendChild(link);
            }

            // Load widget HTML and JS
            this.loadWidgetHTML();
        }

        async loadWidgetHTML() {
            try {
                const response = await fetch(this.getAssetUrl('index.html'));
                const html = await response.text();
                
                // Extract just the widget container content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const widgetContent = doc.querySelector('#idp-widget');
                
                if (widgetContent) {
                    this.widgetHTML = widgetContent.outerHTML;
                }
            } catch (error) {
                console.error('Failed to load IdP widget HTML:', error);
            }
        }

        createContainer() {
            if (this.config.modal) {
                this.createModalContainer();
            } else {
                this.createInlineContainer();
            }
        }

        createModalContainer() {
            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'idp-modal-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
            `;

            // Create modal container
            this.container = document.createElement('div');
            this.container.className = 'idp-modal-container';
            this.container.style.cssText = `
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                animation: idp-modal-enter 0.3s ease-out;
            `;

            // Add close button
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '×';
            closeButton.className = 'idp-modal-close';
            closeButton.style.cssText = `
                position: absolute;
                top: -10px;
                right: -10px;
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 50%;
                background: white;
                color: #666;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            closeButton.addEventListener('click', () => this.close());
            this.container.appendChild(closeButton);

            this.overlay.appendChild(this.container);
            document.body.appendChild(this.overlay);

            // Close on overlay click
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }

        createInlineContainer() {
            this.container = document.createElement('div');
            this.container.className = 'idp-inline-container';
            
            // Find target element or append to body
            const targetElement = document.querySelector(this.config.target) || document.body;
            targetElement.appendChild(this.container);
        }

        open(view = 'login') {
            if (this.isOpen) return;

            // Insert widget HTML
            if (this.widgetHTML) {
                this.container.innerHTML = this.widgetHTML;
                
                // Initialize widget
                this.initializeWidget(view);
                
                if (this.config.modal) {
                    this.overlay.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
                
                this.isOpen = true;
                
                // Focus management for accessibility
                this.manageFocus();
            }
        }

        close() {
            if (!this.isOpen) return;

            if (this.config.modal) {
                this.overlay.style.display = 'none';
                document.body.style.overflow = '';
            } else {
                this.container.style.display = 'none';
            }

            this.isOpen = false;
            
            if (this.config.onClose) {
                this.config.onClose();
            }

            // Return focus to trigger element
            if (this.lastFocusedElement) {
                this.lastFocusedElement.focus();
            }
        }

        initializeWidget(initialView = 'login') {
            // Create widget instance with custom config
            const widgetConfig = {
                ...this.config,
                onSuccess: (user, tokens) => {
                    if (this.config.autoClose) {
                        this.close();
                    }
                    if (this.config.onSuccess) {
                        this.config.onSuccess(user, tokens);
                    }
                },
                onError: (error) => {
                    if (this.config.onError) {
                        this.config.onError(error);
                    }
                },
                autoInit: false
            };

            this.widget = new IdPWidget(widgetConfig);
            this.widget.init();
            this.widget.showView(initialView);
        }

        manageFocus() {
            // Store currently focused element
            this.lastFocusedElement = document.activeElement;
            
            // Focus first input in widget
            setTimeout(() => {
                const firstInput = this.container.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 100);
        }

        bindGlobalEvents() {
            // Escape key to close modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen && this.config.modal) {
                    this.close();
                }
            });

            // Handle auth triggers
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-idp-action]')) {
                    e.preventDefault();
                    const action = e.target.getAttribute('data-idp-action');
                    const view = e.target.getAttribute('data-idp-view') || 'login';
                    
                    if (action === 'open') {
                        this.open(view);
                    }
                }
            });
        }

        getAssetUrl(filename) {
            // In production, this would point to your S3 bucket
            const baseUrl = this.config.assetsBaseUrl || 'https://your-s3-bucket.s3.amazonaws.com/idp-widget/';
            return baseUrl + filename;
        }

        // Public API
        showLogin() {
            this.open('login');
        }

        showRegister() {
            this.open('register');
        }

        getUser() {
            return this.widget ? this.widget.getUser() : null;
        }

        getTokens() {
            return this.widget ? this.widget.getTokens() : null;
        }

        isAuthenticated() {
            return this.widget ? this.widget.isAuthenticated() : false;
        }

        logout() {
            if (this.widget) {
                this.widget.logout();
            }
        }
    }

    // Add modal animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes idp-modal-enter {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .idp-modal-close:hover {
            background: #f5f5f5 !important;
            color: #333 !important;
        }
    `;
    document.head.appendChild(style);

    // Global API
    window.IdPWidgetIntegration = IdPWidgetIntegration;

    // Auto-initialize if config is provided
    if (window.idpIntegrationConfig) {
        window.idpIntegration = new IdPWidgetIntegration(window.idpIntegrationConfig);
        window.idpIntegration.init();
    }

    // Convenience methods
    window.showIdPLogin = function() {
        if (window.idpIntegration) {
            window.idpIntegration.showLogin();
        }
    };

    window.showIdPRegister = function() {
        if (window.idpIntegration) {
            window.idpIntegration.showRegister();
        }
    };

})();
