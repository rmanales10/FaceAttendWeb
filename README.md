# Face Attendance Management System

A modern, responsive web application for managing student attendance using face recognition technology. Built with Next.js 15, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

- **Admin Authentication** - Secure login system with Firebase Auth
- **Dashboard Overview** - Real-time statistics and system monitoring
- **Student Management** - Complete CRUD operations with multiple view modes
- **Teacher Management** - Staff administration and management
- **Subject Management** - Course and subject administration
- **Face Training** - Student face recognition training system
- **Activity Logs** - Comprehensive system activity tracking
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Modern UI** - Beautiful interface with smooth animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Firebase (Firestore, Authentication)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore enabled

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd faceattend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase configuration

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore collections**
   Create the following collections in your Firestore database:
   - `students` - Student records
   - `teachers` - Teacher records  
   - `subjects` - Subject/course records
   - `holidays` - Holiday calendar
   - `activity_logs` - System activity logs

6. **Run the development server**
```bash
npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   │   ├── students/      # Student management
│   │   ├── teachers/      # Teacher management
│   │   ├── subjects/      # Subject management
│   │   ├── face-training/ # Face training system
│   │   └── activity-logs/ # Activity logs
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   └── Layout/           # Layout components
├── contexts/             # React contexts
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   └── firestore.ts      # Firestore operations
└── styles/               # Global styles
```

## 🔐 Authentication

The system uses Firebase Authentication with email/password. To create an admin account:

1. Go to the Firebase Console
2. Navigate to Authentication > Users
3. Add a new user with email and password
4. Use these credentials to log into the system

## 📊 Data Models

### Student
```typescript
interface Student {
  id?: string;
  full_name: string;
  year_level: string;
  department: string;
  section: string;
  subject?: string[];
  face_trained?: boolean;
  training_date?: string;
  accuracy?: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}
```

### Teacher
```typescript
interface Teacher {
  id?: string;
  full_name: string;
  email: string;
  department: string;
  subjects?: string[];
  created_at?: Timestamp;
  updated_at?: Timestamp;
}
```

### Subject
```typescript
interface Subject {
  id?: string;
  course_code: string;
  subject_name: string;
  department: string;
  credits: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}
```

## 🎨 UI Features

- **Responsive Design**: Adapts to all screen sizes
- **Multiple View Modes**: List, Grid, and Compact views
- **Search & Filter**: Real-time search across all data
- **Modern Animations**: Smooth transitions and hover effects
- **Color-coded Status**: Visual indicators for different states
- **Loading States**: Skeleton loaders for better UX

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Firebase Hosting
- Railway

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Migration from Flutter

This Next.js application is a complete conversion of the original Flutter attendance management system. Key improvements include:

- **Better Performance**: Server-side rendering and optimized loading
- **Responsive Design**: Works on all devices without platform-specific code
- **Modern UI**: Updated design with better UX
- **Type Safety**: Full TypeScript implementation
- **Scalability**: Better architecture for future enhancements

## 📈 Future Enhancements

- [ ] Real-time face recognition integration
- [ ] Mobile app companion
- [ ] Advanced reporting and analytics
- [ ] Bulk import/export functionality
- [ ] Email notifications
- [ ] Multi-language support
- [ ] Advanced user roles and permissions