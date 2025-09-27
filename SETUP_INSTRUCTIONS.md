# iSafe - Setup Instructions

## Firebase Configuration

1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable Authentication and Firestore in your Firebase project
3. Enable Realtime Database in your Firebase project
4. In Authentication > Sign-in method, enable Email/Password
4. Create a `.env.local` file in your project root with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.region.firebasedatabase.app/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

**Important:** Replace `your_project_id` and `region` with your actual Firebase project values. For the database URL provided in your example, it would be:
```
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://isafeunej-default-rtdb.asia-southeast1.firebasedatabase.app/
```

You can find these values in your Firebase project settings under "Project settings" > "General" > "Your apps".

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Features Implemented

### Authentication System
- **Login/Register pages** with role-based authentication
- **Three user roles**: Admin, Worker, Viewer
- **Firebase integration** for user management and authentication
- **Protected routes** with role-based access control

### Admin Panel
- **Sidebar navigation** with the following pages:
  - **Home**: Dashboard overview with statistics and recent activities
  - **Posture**: Real-time worker posture monitoring and analysis
  - **Sensor**: Sensor network management and status monitoring
  - **Alert**: Alert management system with filtering and status tracking
  - **Report**: Analytics, reports generation, and data export
  - **Workers**: Complete worker management with CRUD operations

### Security Features
- Role-based route protection
- Authenticated user context
- Unauthorized access handling
- Session management with Firebase Auth

## User Roles

1. **Admin**: Full access to all features and admin panel
2. **Worker**: Limited access (can be customized as needed)
3. **Viewer**: Read-only access (can be customized as needed)

## Next Steps

1. Configure your Firebase project with the provided configuration
2. Customize the role permissions as needed for your use case
3. Add real sensor integration and data processing
4. Implement real-time alerts and notifications
5. Add more detailed reporting and analytics features

## Technology Stack

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Firebase** for authentication and database
- **Lucide React** for icons
- **React Hook Form** for form handling

The application is now ready for development and can be extended with additional features as needed.
