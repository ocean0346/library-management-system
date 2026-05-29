import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
export async function POST(request: NextRequest) {
    try {
        const { email, password, username, fullName } = await request.json();
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username,
                full_name: fullName
            }
        });
        if (authError) {
            console.error('Auth error:', authError);
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            );
        }
        if (!authData.user) {
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                user_id: authData.user.id,
                email: email,
                username: username,
                full_name: fullName,
            });
        if (profileError) {
            console.error('Profile creation error:', profileError);
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            const profileErrorMessage = profileError.message || profileError.details || JSON.stringify(profileError);
            return NextResponse.json(
                { error: `Failed to create user profile: ${profileErrorMessage}` },
                { status: 500 }
            );
        }
        return NextResponse.json({
            success: true,
            user: {
                id: authData.user.id,
                email: authData.user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
