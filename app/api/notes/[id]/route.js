import { NextResponse } from 'next/server';
import { updateNote, deleteNote, ensureTables } from '@/lib/db';

export async function PUT(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        const data = await request.json();
        if (!data.title) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 });
        }
        const note = await updateNote(Number(id), data);
        return NextResponse.json(note);
    } catch (error) {
        console.error('PUT /api/notes/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await ensureTables();
        const { id } = await params;
        await deleteNote(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE /api/notes/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
