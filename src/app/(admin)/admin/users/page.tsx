"use client";

import { AgentRequestTable } from "@/components/specifics/admin/users/agent-request-table";
import { DeleteConfirmationModal } from "@/components/specifics/admin/users/delete-confirmation-modal";
import { DenialModal } from "@/components/specifics/admin/users/denial-modal";
import type { UserModalPayload } from "@/components/specifics/admin/users/user-modal";
import { UserModal } from "@/components/specifics/admin/users/user-modal";
import { UserTable, UserTableSkeleton } from "@/components/specifics/admin/users/user-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentRequests } from "@/hooks/use-agent-requests";
import { useUserCounts } from "@/hooks/use-user-counts";
import { useUsers } from "@/hooks/use-users";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { notifyPromise } from "@/services/notificationService";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function UserManagementContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "clients";
    const subtab = searchParams.get("subtab") || "registered-agents";
    const page = Number(searchParams.get("page")) || 1;
    const urlSearchText = searchParams.get("q") || "";
    const [searchInput, setSearchInput] = useState(urlSearchText);

    useEffect(() => {
        setSearchInput(urlSearchText);
    }, [urlSearchText]);

    const [debouncedSearch, setDebouncedSearch] = useState(searchInput);
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearch(searchInput), 500);
        return () => clearTimeout(id);
    }, [searchInput]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDenialModalOpen, setIsDenialModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "review" | "view">("add");
    const [selectedUser, setSelectedUser] = useState<User | undefined>();
    const [selectedRequest, setSelectedRequest] = useState<AgentRegistrationRequest | undefined>();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const isAgentRequestsTab = tab === "agents" && subtab === "registration-requests";
    const basePageSize = 20;

    const activeRole: "client" | "agent" | "admin" =
        tab === "clients" ? "client" : tab === "agents" ? "agent" : "admin";
    const statusFilter = tab === "agents" && subtab === "registered-agents" ? "approved" : undefined;
    const searchTerm = !isAgentRequestsTab ? debouncedSearch : undefined;

    const {
        users,
        totalPages: usersTotalPages,
        isLoading: usersIsLoading,
        error: usersError,
        refresh: refreshUsers,
    } = useUsers(activeRole, page, basePageSize, statusFilter, searchTerm, !isAgentRequestsTab);
    const {
        requests,
        total: requestsTotal,
        totalPages: requestsTotalPages,
        isLoading: requestsIsLoading,
        error: requestsError,
        refresh: refreshRequests,
    } = useAgentRequests("pending", page, 20, isAgentRequestsTab);
    const { counts: userCounts, isLoading: countsIsLoading } = useUserCounts();

    const totalPages = isAgentRequestsTab ? requestsTotalPages : usersTotalPages;
    const isLoading = isAgentRequestsTab ? requestsIsLoading : usersIsLoading;
    const error = isAgentRequestsTab ? requestsError : usersError;

    const handleViewUser = (user: User) => {
        setModalMode("view");
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAddUser = () => {
        setModalMode("add");
        setSelectedUser(undefined);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setModalMode("edit");
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleReviewRequest = (request: AgentRegistrationRequest) => {
        setModalMode("review");
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (debouncedSearch) params.set("q", debouncedSearch);
        else params.delete("q");
        params.set("page", "1");
        const next = `${pathname}?${params.toString()}`;
        const current = `${pathname}?${new URLSearchParams(window.location.search).toString()}`;
        if (next !== current) router.push(next);
    }, [debouncedSearch, pathname, router]);

    const refreshData = () => {
        if (isAgentRequestsTab) {
            refreshRequests();
        } else {
            refreshUsers();
        }
    };

    const handleSave = async (data: UserModalPayload) => {
        const promise = () =>
            new Promise(async (resolve, reject) => {
                try {
                    if (modalMode === "add") {
                        await fetch("/api/admin/users", {
                            method: "POST",
                            body: JSON.stringify(data),
                        });
                    } else if (modalMode === "edit" && selectedUser?.id) {
                        await fetch(`/api/admin/users/${selectedUser.id}`, {
                            method: "PUT",
                            body: JSON.stringify(data),
                        });
                    }
                    setIsModalOpen(false);
                    refreshData();
                    resolve(modalMode === "add" ? "Usuário adicionado com sucesso" : "Usuário atualizado com sucesso");
                } catch (err) {
                    reject(err);
                }
            });

        notifyPromise(promise(), {
            loading: "Salvando usuário...",
            success: message => `${message}`,
            error: "Ocorreu um erro ao salvar o usuário",
        });
    };

    const handleApprove = async (request: AgentRegistrationRequest) => {
        const promise = () =>
            new Promise(async (resolve, reject) => {
                try {
                    if (request.id) {
                        await fetch(`/api/admin/agent-requests/${request.id}/action`, {
                            method: "POST",
                            body: JSON.stringify({ action: "approve" }),
                        });
                        refreshData();
                        resolve("Solicitação de agente aprovada com sucesso");
                    }
                } catch (err) {
                    reject(err);
                }
            });

        notifyPromise(promise(), {
            loading: "Aprovando solicitação...",
            success: message => `${message}`,
            error: "Ocorreu um erro ao aprovar a solicitação",
        });
    };

    const handleDenyRequest = (request: AgentRegistrationRequest) => {
        setSelectedRequest(request);
        setIsDenialModalOpen(true);
    };

    const handleDenialModalConfirm = async (reason: string) => {
        const promise = () =>
            new Promise(async (resolve, reject) => {
                try {
                    if (selectedRequest?.id) {
                        await fetch(`/api/admin/agent-requests/${selectedRequest.id}/action`, {
                            method: "POST",
                            body: JSON.stringify({ action: "deny", adminMsg: reason }),
                        });
                        setIsDenialModalOpen(false);
                        refreshData();
                        resolve("Solicitação de agente negada com sucesso");
                    } else {
                        reject(new Error("Solicitação de agente não selecionada."));
                    }
                } catch (err) {
                    reject(err);
                }
            });

        notifyPromise(promise(), {
            loading: "Negando solicitação...",
            success: message => `${message}`,
            error: "Ocorreu um erro ao negar a solicitação",
        });
    };

    const handleUserModalDeny = async (request: AgentRegistrationRequest, reason: string) => {
        const promise = () =>
            new Promise(async (resolve, reject) => {
                try {
                    if (request.id) {
                        await fetch(`/api/admin/agent-requests/${request.id}/action`, {
                            method: "POST",
                            body: JSON.stringify({ action: "deny", adminMsg: reason }),
                        });
                        setIsModalOpen(false);
                        refreshData();
                        resolve("Solicitação de agente negada com sucesso");
                    } else {
                        reject(new Error("ID da solicitação ausente."));
                    }
                } catch (err) {
                    reject(err);
                }
            });

        notifyPromise(promise(), {
            loading: "Negando solicitação...",
            success: message => `${message}`,
            error: "Ocorreu um erro ao negar a solicitação",
        });
    };

    const confirmDelete = async () => {
        const promise = () =>
            new Promise(async (resolve, reject) => {
                try {
                    if (selectedUser?.id) {
                        await fetch(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
                        setIsDeleteModalOpen(false);
                        refreshData();
                        resolve(`Usuário '${selectedUser.fullName}' deletado com sucesso`);
                    }
                } catch (err) {
                    reject(err);
                }
            });

        notifyPromise(promise(), {
            loading: "Deletando usuário...",
            success: message => `${message}`,
            error: "Ocorreu um erro ao deletar o usuário",
        });
    };

    // Match the property management UX: scroll inside the table without locking the page height.
    const scrollableContainerClasses = "max-h-[60vh] min-h-[24rem] overflow-y-auto pr-1 sm:pr-2";

    const renderScrollableTables = () => {
        if (isAgentRequestsTab) {
            return (
                <AgentRequestTable
                    requests={requests}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onReview={handleReviewRequest}
                    onApprove={handleApprove}
                    onDeny={handleDenyRequest}
                />
            );
        }

        return (
            <UserTable
                users={users}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onView={handleViewUser}
                onAddUser={handleAddUser}
            />
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className={scrollableContainerClasses}>
                    <UserTableSkeleton />
                </div>
            );
        }

        if (error) {
            return (
                <div className={`${scrollableContainerClasses} flex items-center justify-center`}>
                    <p className="text-red-500">{error}</p>
                </div>
            );
        }

        return (
            <div id="admin-users-scrollable" className={scrollableContainerClasses}>
                {renderScrollableTables()}
            </div>
        );
    };

    const getTabContent = (title: string) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen container mx-auto px-4 py-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground">
                        Visualize, adicione, e gerencie todos os usuários do sistema.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Procurar por nome, email, CPF, RG ou CRECI..."
                        className="pl-8 w-full"
                        value={searchInput}
                        onChange={e => {
                            setSearchInput(e.target.value);
                        }}
                        disabled={isAgentRequestsTab}
                    />
                </div>
                <Button onClick={handleAddUser} className="cursor-pointer w-full sm:w-auto">
                    Adicionar Novo Usuário
                </Button>
            </div>

            <Tabs
                defaultValue={tab}
                className="w-full"
                onValueChange={value => {
                    const params = new URLSearchParams(searchParams);
                    params.set("tab", value);
                    params.set("page", "1");
                    if (value !== "agents") {
                        params.delete("subtab");
                    }
                    router.push(`${pathname}?${params.toString()}`);
                }}
            >
                <TabsList className="grid w-full grid-cols-3 relative z-10 overflow-x-auto">
                    <TabsTrigger value="clients" className="cursor-pointer">
                        Clientes{tab === "clients" ? ` (${countsIsLoading ? "..." : userCounts.client})` : ""}
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="cursor-pointer">
                        Corretores
                    </TabsTrigger>
                    <TabsTrigger value="admins" className="cursor-pointer">
                        Administradores{tab === "admins" ? ` (${countsIsLoading ? "..." : userCounts.admin})` : ""}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="clients">{getTabContent("Todos os Clientes")}</TabsContent>
                <TabsContent value="agents">
                    <Tabs
                        defaultValue={subtab}
                        className="w-full mt-4"
                        onValueChange={value => {
                            const params = new URLSearchParams(searchParams);
                            params.set("subtab", value);
                            params.set("page", "1");
                            router.push(`${pathname}?${params.toString()}`);
                        }}
                    >
                        <TabsList className="grid w-full grid-cols-2 relative z-10 overflow-x-auto">
                            <TabsTrigger value="registered-agents" className="cursor-pointer">
                                Corretores Registrados
                                {tab === "agents" && subtab === "registered-agents"
                                    ? ` (${countsIsLoading ? "..." : userCounts.agent})`
                                    : ""}
                            </TabsTrigger>
                            <TabsTrigger value="registration-requests" className="cursor-pointer">
                                Solicitações de Cadastro
                                {tab === "agents" && subtab === "registration-requests"
                                    ? ` (${requestsIsLoading ? "..." : requestsTotal})`
                                    : ""}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="registered-agents">{getTabContent("Corretores Registrados")}</TabsContent>
                        <TabsContent value="registration-requests">
                            {getTabContent("Solicitações de Cadastro de Corretores")}
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="admins">{getTabContent("Todos os Administradores")}</TabsContent>
            </Tabs>
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                userData={selectedUser}
                requestData={selectedRequest}
                onSave={handleSave}
                onApprove={handleApprove}
                onDeny={handleUserModalDeny}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                userName={selectedUser?.fullName}
            />
            <DenialModal
                isOpen={isDenialModalOpen}
                onClose={() => setIsDenialModalOpen(false)}
                onConfirm={handleDenialModalConfirm}
            />
        </div>
    );
}

export default function UserManagementPage() {
    return (
        <Suspense fallback={<UserTableSkeleton />}>
            <UserManagementContent />
        </Suspense>
    );
}
