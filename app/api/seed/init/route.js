import { NextResponse } from 'next/server';
import { ensureTables } from '@/lib/db';

// Only ensures DB tables exist — does NOT seed demo data.
// Called on every app load to bootstrap the schema.
export async function POST() {
    try {
        await ensureTables();
        return NextResponse.json({ message: 'Tables ready' });
    } catch (error) {
        console.error('POST /api/seed/init error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
