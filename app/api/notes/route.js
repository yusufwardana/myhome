import { NextResponse } from 'next/server';
import { getNotes, createNote, ensureTables } from '@/lib/db';

export async function GET(request) {
    try {
        await ensureTables();
        const { searchParams } = new URL(request.url);
        const filters = {
            type: searchParams.get('type') || '',
            category: searchParams.get('category') || '',
            search: searchParams.get('search') || '',
        };
        const notes = await getNotes(filters);
        return NextResponse.json(notes);
    } catch (error) {
        console.error('GET /api/notes error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await ensureTables();
        const data = await request.json();
        if (!data.title) {
            return NextResponse.json({ error: 'title is required' }, { status: 400 });
        }
        if (!data.amount || isNaN(Number(data.amount))) {
            return NextResponse.json({ error: 'amount harus berupa angka' }, { status: 400 });
        }
        const note = await createNote(data);
        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error('POST /api/notes error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
