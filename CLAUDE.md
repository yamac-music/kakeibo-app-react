# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Japanese household expense tracking application ("二人暮らしの家計簿" - Shared Living Expense Book) built as a React SPA with Firebase backend. The app supports two-person expense sharing with authentication, data visualization, and offline fallback capabilities.

## Important
- このプロジェクトでは、日本語で「現在行っている処理や作業」を説明すること。
- 何かの問題をFixする場合、適切にテストを行い、何が原因だったのか、何を治して、どうよくなったかを適切に報告すること


## Common Development Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint linting
```

### Testing
```bash
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report
```

### Docker Development (Recommended)
```bash
# Development environment
docker-compose --profile dev up --build     # Start dev server with hot reload
docker-compose --profile dev up --build -d  # Start in background
docker-compose --profile dev logs -f app-dev # View logs

# Testing
docker-compose --profile test run --rm app-test npm run test:run

# Production
docker-compose --profile prod up --build    # Build and serve production build
```

## Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4.1.8
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore with offline fallback to localStorage
- **Routing**: React Router DOM 7.6.2
- **Charts**: Recharts 2.15.3
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library
- **Deployment**: Multiple options (GitHub Pages, Vercel, Netlify, Docker)

## Architecture

### Core Components Structure
- `/src/components/Home.jsx` - Main expense tracking application
- `/src/components/auth/` - Authentication components (Login, Signup, ForgotPassword, PrivateRoute)
- `/src/contexts/AuthContext.jsx` - Authentication state management
- `/src/App.jsx` - Main router with conditional rendering based on Firebase availability

### Firebase Integration
- Configuration in `/src/firebase.js` with environment variable validation
- Graceful fallback to localStorage when Firebase is unavailable (demo/offline mode)
- Security rules in `/firestore.rules` enforce user-specific data access

### Data Architecture
- Firestore path: `/artifacts/{appId}/users/{userId}/{collection}`
- Collections: `expenses`, `settings`
- Each document includes `uid` field for security validation

## Environment Configuration

### Required Environment Variables (.env.local)
```bash
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Deployment Configurations
- **GitHub Pages**: Base path `/kakeibo-app-react/` in production
- **Vercel/Netlify**: SPA rewrites configured in `vercel.json`/`netlify.toml`
- **Docker**: Multi-stage build with Nginx for production serving

## Key Features Implementation

### Authentication Flow
- Conditional routing based on Firebase availability (`isFirebaseAvailable`)
- When Firebase unavailable: direct access to Home component (demo mode)
- When Firebase available: protected routes with authentication required

### Dual-User Expense Tracking
- Customizable user names for two-person households
- Expense categorization and visualization
- Settlement calculation between users
- Monthly budget management with category-based tracking

### Data Persistence
- Primary: Firebase Firestore with real-time sync
- Fallback: localStorage for offline/demo mode
- Import/export functionality for data backup (JSON format)

## Development Guidelines

### Code Conventions
- React functional components with hooks
- Context API for state management (avoid prop drilling)
- Tailwind CSS for styling with consistent design patterns
- ESLint configuration enforces React best practices

### Firebase Security
- All Firestore operations validate user authentication
- Documents must include user's `uid` for security rules enforcement
- Never expose Firebase config in client-side code logs

### Testing Strategy
- Component rendering tests
- Authentication flow testing
- Firebase offline mode testing
- Coverage reporting available with `npm run test:coverage`

## Critical Development Workflow

### Before Making Changes
1. Always run `npm run lint` before committing changes
2. Run tests with `npm run test:run` to ensure nothing breaks
3. Use Docker environment for consistent development: `docker-compose --profile dev up --build`

### Single Test Execution
```bash
# Run specific test file
npm run test -- Login.test.jsx

# Run tests matching pattern
npm run test -- --grep "authentication"

# Docker test execution
docker-compose --profile test run --rm app-test npm run test -- Login.test.jsx
```

### Code Quality Standards
- All React components must be functional components with hooks
- Use Context API for state management (AuthContext pattern)
- Maintain Firebase security with uid validation in all Firestore operations
- Follow existing Tailwind CSS patterns for consistent styling

## Troubleshooting

### Firebase Configuration Issues
- Check environment variables are properly set
- Validate Firebase project settings in console
- Review browser console for configuration validation logs
- Ensure Firestore security rules are deployed

### Build Issues
- Run `npm run lint` to check for ESLint errors
- Verify all environment variables for target deployment
- Check Docker logs for container-specific issues: `docker-compose logs`