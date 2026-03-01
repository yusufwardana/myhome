import { NextResponse } from 'next/server';
import { getActivityLog, clearActivityLog, ensureTables } from '@/lib/db';

export async function GET(request) {
    try {
        await ensureTables();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const logs = await getActivityLog(limit);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('GET /api/admin/activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await ensureTables();
        await clearActivityLog();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/admin/activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
