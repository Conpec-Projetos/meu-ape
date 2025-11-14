import { pendingVisitRequestsCounts, pendingReservationRequestCounts, pendingAgentRegistrationRequestCounts } from "@/firebase/admin/dashboard/service";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/supabase/supabase-admin";
import { countProperties } from "@/firebase/properties/service";

export async function GET(request: NextRequest) {
    
    try {
        //supabase
        const propertiesCount = async () => {
            const  { count, error } = await supabaseAdmin.from("properties").select("*", {count: "exact", head: true});

        if (error) throw error;
        return count;
        }

        //firebase
        const [countVisits, countReservations, countRegistrations, countProperties] = await Promise.all([
            pendingVisitRequestsCounts(),
            pendingReservationRequestCounts(),
            pendingAgentRegistrationRequestCounts(),
            propertiesCount(),
        ]);
        
        return NextResponse.json({
            countVisits,
            countReservations,
            countRegistrations,
            countProperties,
        });

    }
    catch (error) {
        console.error('Failed to get counts:', error);
        return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
    }

}   