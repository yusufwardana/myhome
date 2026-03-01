import { NextResponse } from 'next/server';
import { getCategories, createCategory, ensureTables } from '@/lib/db';

export async function GET() {
    try {
        await ensureTables();
        const categories = await getCategories();
        return NextResponse.json(categories);
    } catch (error) {
        console.error('GET /api/categories error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await ensureTables();
        const { name, budget_limit } = await request.json();
        if (!name || budget_limit === undefined) {
            return NextResponse.json({ error: 'name and budget_limit are required' }, { status: 400 });
        }
        const category = await createCategory(name, budget_limit);
        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('POST /api/categories error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
