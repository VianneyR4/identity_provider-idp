# School Budget Management Demo

A comprehensive React-based demo application showcasing the IdP backend integration with role-based access control for school budget management.

## Features

- **Authentication Integration**: Uses the IdP backend for user authentication
- **Role-Based Access Control**: Different permissions for Admin, Department Head, Teacher, and User roles
- **Budget Management**: Create, edit, approve, and track budgets
- **Department Management**: Organize budgets by departments
- **Reports & Analytics**: Visual charts and data analysis
- **User Management**: Admin-only user administration interface
- **Responsive Design**: Modern UI built with Tailwind CSS

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Heroicons
- **Routing**: React Router v6

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v16 or higher) and npm installed
2. **IdP Backend** running on `http://localhost:8080`

## Installation

1. **Install Node.js**: Download and install from [nodejs.org](https://nodejs.org/)

2. **Install dependencies**:
   ```bash
   cd school-budget-demo
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Demo Credentials

The application includes demo credentials for testing different roles:

- **Admin**: `admin@school.edu` / `admin123`
- **Department Head**: `math.head@school.edu` / `math123`
- **Teacher**: `teacher@school.edu` / `teacher123`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   └── ProtectedRoute.tsx # Route protection component
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   └── BudgetContext.tsx # Budget data management
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview dashboard
│   ├── LoginPage.tsx   # Authentication page
│   ├── BudgetManagement.tsx # Budget CRUD operations
│   ├── Reports.tsx     # Analytics and reporting
│   └── UserManagement.tsx # Admin user management
├── services/           # API service layer
│   └── api.ts         # HTTP client and API calls
├── types/              # TypeScript type definitions
│   └── index.ts       # Shared interfaces
├── App.tsx            # Main application component
├── index.tsx          # Application entry point
└── index.css          # Global styles and Tailwind imports
```

## Key Features by Role

### Admin
- Full system access
- User management (create, edit, delete users)
- All budget operations
- System-wide reports and analytics

### Department Head
- Manage budgets for their department
- Approve/reject budget requests
- Department-specific reports
- View user information

### Teacher
- View assigned budgets
- Submit budget requests
- Track budget utilization
- Limited reporting access

### User
- Read-only access to public budget information
- Basic dashboard view

## API Integration

The application integrates with the IdP backend for:

- User authentication (login/logout)
- Token management and refresh
- User profile information
- Role-based authorization

## Development Notes

- Uses mock data for budget and department information
- Authentication flows through the IdP backend
- Responsive design works on desktop and mobile
- Error handling and loading states included
- Type-safe with TypeScript throughout

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Troubleshooting

1. **Backend Connection**: Ensure the IdP backend is running on port 8080
2. **CORS Issues**: The backend should be configured to allow requests from `http://localhost:3000`
3. **Authentication**: Use the provided demo credentials or create users through the backend API

## Future Enhancements

- Real-time budget updates
- Email notifications for budget approvals
- Advanced reporting with more chart types
- Budget templates and workflows
- Integration with external accounting systems
- Mobile app version
