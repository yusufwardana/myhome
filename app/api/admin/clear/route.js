import { NextResponse } from 'next/server';
import { clearAllData, ensureTables } from '@/lib/db';

export async function POST() {
    try {
        await ensureTables();
        await clearAllData();
        return NextResponse.json({ success: true, message: 'Semua data berhasil dihapus' });
    } catch (error) {
        console.error('POST /api/admin/clear error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
