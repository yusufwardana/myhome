import { NextResponse } from 'next/server';
import { exportAllData, addActivityLog, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const data = await exportAllData();
        await addActivityLog('Data Exported', `${data.categories.length} kategori, ${data.items.length} items`);
        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/admin/export error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
