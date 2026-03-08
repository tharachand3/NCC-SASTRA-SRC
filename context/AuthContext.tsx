import { auth, db } from '@/config/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'admin' | 'cadet';

export interface UserProfile {
    uid: string;
    role: UserRole;
    fullName: string;
    registerNumber?: string;
    year?: string;
    department?: string;
    phone?: string;
    email: string;
    bloodGroup?: string;
    enrollmentNumber?: string;
    status?: 'active' | 'passedOut';
    totalPoints?: number;
    rank?: number | string;
    cdtRank?: string;
    wing?: string;
    squad?: string;
    mustChangePassword?: boolean;
}

// Represent a cadet registration request submitted by a user
export interface CadetRequest {
    uid: string;
    fullName: string;
    registerNumber: string;
    year: string;
    department?: string;
    phone: string;
    email: string;
    wing?: string;
    squad?: string;
    bloodGroup?: string;
    enrollmentNumber?: string;
    status: 'pending' | 'approved' | 'rejected';
    reviewedAt?: any; // Timestamp
    reviewComments?: string;
    createdAt: any; // Timestamp
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    cadetRequest: CadetRequest | null;
    loadingRequest: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [cadetRequest, setCadetRequest] = useState<CadetRequest | null>(null);
    const [loadingRequest, setLoadingRequest] = useState(false);

    useEffect(() => {
        let profileUnsub: (() => void) | undefined;
        let requestUnsub: (() => void) | undefined;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // listen to profile changes in real-time
                const docRef = doc(db, 'users', firebaseUser.uid);
                profileUnsub = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        setUserProfile({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
                    } else {
                        setUserProfile(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error('Error listening to user profile:', error);
                    setLoading(false);
                });

                // also listen to any pending/approved/rejected cadet request
                setLoadingRequest(true);
                const reqRef = doc(db, 'cadet_requests', firebaseUser.uid);
                requestUnsub = onSnapshot(reqRef, (snap) => {
                    if (snap.exists()) {
                        setCadetRequest({ uid: firebaseUser.uid, ...snap.data() } as CadetRequest);
                    } else {
                        setCadetRequest(null);
                    }
                    setLoadingRequest(false);
                }, (err) => {
                    console.error('Error listening to cadet request:', err);
                    setLoadingRequest(false);
                });
            } else {
                setUser(null);
                setUserProfile(null);
                setCadetRequest(null);
                setLoading(false);
                setLoadingRequest(false);
                if (profileUnsub) {
                    profileUnsub();
                }
                if (requestUnsub) {
                    requestUnsub();
                }
            }
        });

        return () => {
            if (profileUnsub) profileUnsub();
            if (requestUnsub) requestUnsub();
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged above will handle setting user + profile
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, cadetRequest, loadingRequest, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
