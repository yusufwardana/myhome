import { NextResponse } from 'next/server';
import { bulkUpdateStatus, bulkDeleteByCategory, addActivityLog, ensureTables } from '@/lib/db';

export async function POST(request) {
    try {
        await ensureTables();
        const { action, item_ids, status, category_id } = await request.json();

        if (action === 'update_status') {
            if (!item_ids || !status) {
                return NextResponse.json({ error: 'item_ids and status required' }, { status: 400 });
            }
            const count = await bulkUpdateStatus(item_ids, status);
            await addActivityLog('Bulk Status Update', `${count} items → ${status}`);
            return NextResponse.json({ success: true, updated: count });
        }

        if (action === 'delete_by_category') {
            if (!category_id) {
                return NextResponse.json({ error: 'category_id required' }, { status: 400 });
            }
            await bulkDeleteByCategory(category_id);
            await addActivityLog('Bulk Delete', `Items in category #${category_id} deleted`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('POST /api/admin/bulk error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
