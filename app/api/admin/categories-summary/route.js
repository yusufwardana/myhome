import { NextResponse } from 'next/server';
import { getCategorySummary, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const summary = await getCategorySummary();
        return NextResponse.json(summary);
    } catch (error) {
        console.error('GET /api/admin/categories-summary error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
