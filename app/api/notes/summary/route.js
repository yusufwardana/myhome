import { NextResponse } from 'next/server';
import { getNoteStats, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const stats = await getNoteStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('GET /api/notes/summary error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
