import { pendingVisitRequestsCounts } from "@/firebase/admin/dashboard/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    
    const countVisits = await pendingVisitRequestsCounts();

    return;

}