import { NextResponse } from 'next/server';
import { importData, addActivityLog, ensureTables } from '@/lib/db';

export async function POST(request) {
    try {
        await ensureTables();
        const data = await request.json();

        if (!data.categories || !Array.isArray(data.categories)) {
            return NextResponse.json({ error: 'Invalid format: categories array required' }, { status: 400 });
        }

        const result = await importData(data);
        await addActivityLog('Data Imported', `${result.categories_imported} kategori, ${result.items_imported} items`);
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('POST /api/admin/import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
