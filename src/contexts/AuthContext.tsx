'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('AuthContext initializing...');
        // Check for static admin user in sessionStorage
        const staticUser = sessionStorage.getItem('static-admin-user');
        if (staticUser) {
            console.log('Found static user in sessionStorage:', staticUser);
            setUser(JSON.parse(staticUser));
            setLoading(false);
            return;
        }

        console.log('No static user found, checking Firebase auth');
        // Otherwise check Firebase auth
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Firebase auth state changed:', user);
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            // Static credentials for testing
            if (email === 'admin@gmail.com' && password === 'admin') {
                // Create a mock user object
                const mockUser = {
                    uid: 'admin-user',
                    email: 'admin@gmail.com',
                    displayName: 'Admin User'
                } as User;
                console.log('Setting static user:', mockUser);
                setUser(mockUser);
                // Store in sessionStorage to persist across page refreshes
                sessionStorage.setItem('static-admin-user', JSON.stringify(mockUser));
                console.log('Static user stored in sessionStorage');
            } else {
                // Try Firebase authentication for other credentials
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            // If it's the static admin user, just clear the state
            if (user?.uid === 'admin-user') {
                setUser(null);
                sessionStorage.removeItem('static-admin-user');
            } else {
                // Otherwise use Firebase logout
                await signOut(auth);
            }
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
