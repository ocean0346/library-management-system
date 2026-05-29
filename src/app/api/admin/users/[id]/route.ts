import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const token = authHeader.split(' ')[1]
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { data: callerData } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('user_id', caller.id)
            .single()
        if (!callerData || callerData.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Only Super Admin can delete users' }, { status: 403 })
        }
        if (id === caller.id) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
        if (authDeleteError) {
            console.error('Error deleting from auth:', authDeleteError)
            return NextResponse.json({ error: authDeleteError.message }, { status: 500 })
        }
        const { error: publicDeleteError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('user_id', id)
        if (publicDeleteError) {
            console.error('Error deleting from public.users:', publicDeleteError)
        }
        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error: any) {
        console.error('Server error deleting user:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
