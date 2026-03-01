import { NextResponse } from 'next/server';
import { seedData, ensureTables } from '@/lib/db';

export async function POST() {
    try {
        await ensureTables();
        const seeded = await seedData();
        if (seeded) {
            return NextResponse.json({ message: 'Demo data seeded successfully' });
        }
        return NextResponse.json({ message: 'Data already exists, skipping seed' });
    } catch (error) {
        console.error('POST /api/seed error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
