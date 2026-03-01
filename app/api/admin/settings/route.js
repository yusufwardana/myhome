import { NextResponse } from 'next/server';
import { getSettings, updateSettings, addActivityLog, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('GET /api/admin/settings error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await ensureTables();
        const data = await request.json();
        await updateSettings(data);
        await addActivityLog('Settings Updated', `Updated: ${Object.keys(data).join(', ')}`);
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('PUT /api/admin/settings error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
