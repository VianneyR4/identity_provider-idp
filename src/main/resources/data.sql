-- Insert default OAuth client for testing
INSERT INTO oauth_clients (client_id, client_secret_hash, client_name, redirect_uris, scopes, is_active) 
VALUES (
    'demo-app-client',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Demo Application',
    '{"http://localhost:3000/auth/callback", "http://localhost:8081/login/oauth2/code/idp"}',
    '{"openid", "profile", "email"}',
    true
) ON CONFLICT (client_id) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active) 
VALUES (
    'admin@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'System',
    'Administrator',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert test user (password: user123)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active) 
VALUES (
    'user@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Test',
    'User',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Assign admin role to admin user
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'ADMIN' 
FROM users u 
WHERE u.email = 'admin@example.com' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'ADMIN'
);

-- Assign user role to admin user (admin can also be a regular user)
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'USER' 
FROM users u 
WHERE u.email = 'admin@example.com' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'USER'
);

-- Assign user role to test user
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'USER' 
FROM users u 
WHERE u.email = 'user@example.com' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'USER'
);

-- Insert department head user for demo app (password: dept123)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active) 
VALUES (
    'dept.head@school.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'John',
    'Department Head',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Assign department head role
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'DEPARTMENT_HEAD' 
FROM users u 
WHERE u.email = 'dept.head@school.edu' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'DEPARTMENT_HEAD'
);

-- Also assign user role to department head
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'USER' 
FROM users u 
WHERE u.email = 'dept.head@school.edu' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'USER'
);

-- Insert teacher user for demo app (password: teacher123)
INSERT INTO users (email, password_hash, first_name, last_name, email_verified, is_active) 
VALUES (
    'teacher@school.edu',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'Jane',
    'Teacher',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Assign teacher role
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'TEACHER' 
FROM users u 
WHERE u.email = 'teacher@school.edu' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'TEACHER'
);

-- Also assign user role to teacher
INSERT INTO user_roles (user_id, role) 
SELECT u.id, 'USER' 
FROM users u 
WHERE u.email = 'teacher@school.edu' 
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'USER'
);
