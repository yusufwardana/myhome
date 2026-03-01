import { NextResponse } from 'next/server';
import { getItems, createItem, ensureTables } from '@/lib/db';

export async function GET(request) {
    try {
        await ensureTables();
        const { searchParams } = new URL(request.url);
        const filters = {
            category_id: searchParams.get('category_id') || '',
            priority: searchParams.get('priority') || '',
            status: searchParams.get('status') || '',
        };
        const items = await getItems(filters);
        return NextResponse.json(items);
    } catch (error) {
        console.error('GET /api/items error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await ensureTables();
        const data = await request.json();
        if (!data.name || !data.category_id) {
            return NextResponse.json({ error: 'name and category_id are required' }, { status: 400 });
        }
        const item = await createItem(data);
        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('POST /api/items error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
