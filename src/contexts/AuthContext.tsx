'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminService } from '@/lib/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
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
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        console.log('AuthContext initializing...');
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Firebase auth state changed:', user);
            setUser(user);

            // Check if user is admin
            if (user) {
                const adminStatus = await adminService.isAdmin(user.uid);
                setIsAdmin(adminStatus);
                console.log('User is admin:', adminStatus);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if user is an admin
            const adminStatus = await adminService.isAdmin(userCredential.user.uid);
            if (!adminStatus) {
                // User exists but is not an admin
                await signOut(auth);
                throw new Error('Access denied. Admin privileges required.');
            }

            setIsAdmin(adminStatus);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setLoading(true);
        try {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Update user profile with display name
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: name
                });

                // Create admin record in Firestore
                await adminService.createAdmin({
                    uid: userCredential.user.uid,
                    fullName: name,
                    email: email,
                    role: 'admin'
                });

                console.log('Admin registered successfully in Firebase Auth and Firestore');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
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
        isAdmin,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
