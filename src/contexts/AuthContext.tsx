'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
type AuthContextType = {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    signInWithMagicLink: (email: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    updatePassword: (newPassword: string) => Promise<void>
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const syncUserProfile = async (currentUser: User) => {
        try {
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', currentUser.id)
                .maybeSingle()
            if (checkError) {
                console.error('Error checking user:', checkError)
                return
            }
            if (existingUser?.is_banned) {
                console.warn('User is banned. Logging out...')
                await supabase.auth.signOut()
                setUser(null)
                return
            }
            if (!existingUser) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            user_id: currentUser.id,
                            email: currentUser.email,
                            username: currentUser.user_metadata.username || currentUser.email?.split('@')[0] || 'user',
                            full_name: currentUser.user_metadata.full_name || 'Unknown'
                        }
                    ])
                if (insertError) {
                    console.error('Error creating user profile:', insertError)
                }
            }
        } catch (error) {
            console.error('Error syncing user profile:', error)
            throw error
        }
    }
    useEffect(() => {
        const setupAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                    setUser(session.user)
                    syncUserProfile(session.user).catch(err => {
                        console.error('Profile sync error (non-blocking):', err)
                    })
                }
            } catch (error) {
                console.error('Auth setup error:', error)
            } finally {
                setLoading(false)
            }
        }
        setupAuth()
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user)
                syncUserProfile(session.user).catch(err => {
                    console.error('Profile sync error (non-blocking):', err)
                })
            } else {
                setUser(null)
            }
            setLoading(false)
        })
        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])
    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        if (data.user) {
            syncUserProfile(data.user).catch(err => {
                console.error('Profile sync error (non-blocking):', err)
            })
        }
    }
    const signUp = async (email: string, password: string, username: string, fullName: string) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                    fullName
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (signInError) {
                console.error('Sign in error after registration:', signInError);
                throw new Error('Registration successful, but failed to sign in');
            }
            return data;
        } catch (error) {
            console.error('SignUp error:', error);
            throw error;
        }
    }
    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }
    const resetPassword = async (email: string) => {
        const redirectUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : undefined
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        })
        if (error) throw error
    }
    const signInWithMagicLink = async (email: string) => {
        const redirectUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl,
            }
        })
        if (error) throw error
    }
    const signInWithGoogle = async () => {
        const redirectUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/`
            : undefined
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
            }
        })
        if (error) throw error
    }
    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw error
    }
    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signIn,
            signUp,
            signOut,
            resetPassword,
            signInWithMagicLink,
            signInWithGoogle,
            updatePassword
        }}>
            {children}
        </AuthContext.Provider>
    )
}
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
