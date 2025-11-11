import { pendingVisitRequestsCounts, pendingReservationRequestCounts } from "@/firebase/admin/dashboard/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    
    try {
        const [countVisits, countReservations] = await Promise.all([
            pendingVisitRequestsCounts(),
            pendingReservationRequestCounts(),
        ]);
        
        return NextResponse.json({
            countVisits,
            countReservations,
        });

    }
    catch (error) {
        console.error('Failed to get counts:', error);
        return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
    }

}   