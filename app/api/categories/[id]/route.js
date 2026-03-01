import { NextResponse } from 'next/server';
import { updateCategory, deleteCategory, ensureTables } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        const { name, budget_limit } = await request.json();
        const category = await updateCategory(Number(id), name, budget_limit);
        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        await deleteCategory(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
