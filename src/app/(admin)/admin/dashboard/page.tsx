"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/features/cards/default-card";
import { notifyError } from "@/services/notificationService";
import { BookmarkCheck, Building, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GET } from "@/app/api/admin/dashboard/route";

export default function DashboardPage() {
    const [propertiesNum, setPropertiesNum] = useState<number>(0);
    const [pendingVisitNum, setPendingVisitNum] = useState<number>(0);
    const [pendingReservationNum, setPendingReservationNum] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPendingVisitsNum = async () => {
            try {
                setLoading(true);

                const response = await fetch('/api/admin/dashboard', {
                    method: "GET",
                });
                const { countVisits, countReservations} = await response.json();

                setPendingVisitNum(countVisits.pendingVisitRequest);
                setPendingReservationNum(countReservations.pendingReservationRequest);

                console.log(`Successfully fetched ${countReservations.pendingReservationRequest} pending reservations requests`);
                console.log(`Successfully fetched ${countVisits.pendingVisitRequest} pending visits request`);
            } catch {
                notifyError("Erro ao carregar dados do dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchPendingVisitsNum();
    }, []);

    return (
        <div className="pt-15 h-screen w-screen bg-gray-50 p-6">
            <div className="w-full mb-8">
                <h1 className="text-5xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Visão geral do Meu Apê</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Empreendimentos</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-start mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{propertiesNum}</div>
                                <p className="text-xs text-muted-foreground">
                                    {propertiesNum === 1 ? "empreendimento cadastrado" : "empreendimentos cadastrados"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solicitações de Corretores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-start mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-muted-foreground">solicitações de corretores</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Visitas Pendentes</CardTitle>
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-start mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{pendingVisitNum}</div>
                                <p className="text-xs text-muted-foreground">
                                    {pendingVisitNum == 1 ? "solicitação de visita pendente" : "solicitações de visitas pendentes"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reservas Pendentes</CardTitle>
                        <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-start mt-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold">{pendingReservationNum}</div>
                                <p className="text-xs text-muted-foreground">
                                    {pendingReservationNum == 1 ? "solicitação de reserva pendente" : "solicitações de reservas pendentes"}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link
                            href="/admin/property"
                            className="block w-full p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                            <h3 className="font-semibold text-slate-800">Gerenciar Imóveis</h3>
                            <p className="text-sm text-slate-600">Editar, remover e gerenciar imóveis existentes</p>
                        </Link>

                        <Link
                            href="/admin/requests"
                            className="block w-full p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                            <h3 className="font-semibold text-slate-800">Gerenciar Visitas e Reservas</h3>
                            <p className="text-sm text-slate-600">Aprovar ou rejeitar solicitações</p>                        </Link>

                        <Link
                            href="/admin/users"
                             className="block w-full p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        >
                            <h3 className="font-semibold text-slate-800">Gerenciar Usuários</h3>
                            <p className="text-sm text-slate-600">Visualizar e gerenciar usuários da plataforma</p>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estatísticas Gerais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status do Sistema:</span>
                                <span className="text-green-600 font-semibold">Online</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
