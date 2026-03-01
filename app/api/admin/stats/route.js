import { NextResponse } from 'next/server';
import { getAdminStats, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const stats = await getAdminStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('GET /api/admin/stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
