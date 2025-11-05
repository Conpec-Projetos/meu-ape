import { ReservationRequest } from "@/interfaces/reservationRequest";
import { VisitRequest } from "@/interfaces/visitRequest";

type VisitAgentBase = NonNullable<VisitRequest["agents"]>[number];
type ReservationAgentBase = NonNullable<ReservationRequest["agents"]>[number];

type ReservationClient = ReservationRequest["client"];

type VisitClient = VisitRequest["client"];

type WithOptionalRef<T extends { ref?: unknown }> = Omit<T, "ref"> & { ref?: string };

type NormalizedVisitAgent = VisitAgentBase extends never
    ? { ref?: string; name?: string; email?: string; phone?: string; creci?: string }
    : WithOptionalRef<VisitAgentBase>;
type NormalizedReservationAgent = ReservationAgentBase extends never
    ? { ref?: string; name?: string; email?: string; phone?: string; creci?: string }
    : WithOptionalRef<ReservationAgentBase>;

type NormalizedReservationClient = WithOptionalRef<ReservationClient>;
type NormalizedVisitClient = WithOptionalRef<VisitClient> & { fullName: string };

export interface VisitRequestListItem {
    id: string;
    status: VisitRequest["status"];
    client: NormalizedVisitClient;
    property: VisitRequest["property"];
    unit: VisitRequest["unit"];
    agents?: NormalizedVisitAgent[];
    requestedSlots: string[];
    scheduledSlot?: string | null;
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface ReservationRequestListItem {
    id: string;
    status: ReservationRequest["status"];
    client: NormalizedReservationClient;
    property: ReservationRequest["property"];
    unit: ReservationRequest["unit"];
    agents?: NormalizedReservationAgent[];
    agentMsg?: string;
    clientMsg?: string;
    createdAt: string;
    updatedAt?: string;
}

export type AdminRequestListItem = VisitRequestListItem | ReservationRequestListItem;
