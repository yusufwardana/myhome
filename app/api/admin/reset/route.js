import { NextResponse } from 'next/server';
import { resetAndSeed, ensureTables } from '@/lib/db';

export async function POST() {
    try {
        await ensureTables();
        await resetAndSeed();
        return NextResponse.json({ success: true, message: 'Data berhasil di-reset dan seed ulang' });
    } catch (error) {
        console.error('POST /api/admin/reset error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
