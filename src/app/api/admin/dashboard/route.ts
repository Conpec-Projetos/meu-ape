import { pendingVisitRequestsCounts, pendingReservationRequestCounts, pendingAgentRegistrationRequestCounts } from "@/firebase/admin/dashboard/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    
    try {
        const [countVisits, countReservations, countRegistrations] = await Promise.all([
            pendingVisitRequestsCounts(),
            pendingReservationRequestCounts(),
            pendingAgentRegistrationRequestCounts(),
        ]);
        
        return NextResponse.json({
            countVisits,
            countReservations,
            countRegistrations,
        });

    }
    catch (error) {
        console.error('Failed to get counts:', error);
        return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
    }

}   