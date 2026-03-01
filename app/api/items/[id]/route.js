import { NextResponse } from 'next/server';
import { updateItem, deleteItem, ensureTables } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        const data = await request.json();
        const item = await updateItem(Number(id), data);
        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        await deleteItem(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
