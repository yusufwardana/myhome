import { NextResponse } from 'next/server';
import { exportAllData, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const data = await exportAllData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/admin/export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
