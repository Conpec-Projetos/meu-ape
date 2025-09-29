"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { UserTable } from "@/components/features/tables/user-table";
import { AgentRequestTable } from "@/components/features/tables/agent-request-table";
import { UserModal } from "@/components/features/modals/user-modal";
import { DeleteConfirmationModal } from "@/components/features/modals/delete-confirmation-modal";
import { useUsers } from "@/hooks/use-users";
import { useAgentRequests } from "@/hooks/use-agent-requests";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";

import { Skeleton } from "@/components/ui/skeleton";

function UserManagementContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "clients";
  const subtab = searchParams.get("subtab") || "registered-agents";
  const page = Number(searchParams.get("page")) || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "review" | "view">("add");
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<AgentRegistrationRequest | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAgentRequestsTab = tab === 'agents' && subtab === 'registration-requests';

  const { users, totalPages: usersTotalPages, isLoading: usersIsLoading, error: usersError, refresh: refreshUsers } = useUsers(
    tab === 'clients' ? 'client' : tab === 'agents' ? 'agent' : 'admin',
    page,
    20,
    tab === 'agents' && subtab === 'registered-agents' ? 'approved' : undefined,
    !isAgentRequestsTab
  );
  const { requests, totalPages: requestsTotalPages, isLoading: requestsIsLoading, error: requestsError, refresh: refreshRequests } = useAgentRequests(
    'pending',
    page,
    20,
    isAgentRequestsTab
  );

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

  const refreshData = () => {
    if (isAgentRequestsTab) {
      refreshRequests();
    } else {
      refreshUsers();
    }
  };

  const handleSave = async (data: Partial<User>) => {
    try {
      if (modalMode === 'add') {
        await fetch('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else if (modalMode === 'edit' && selectedUser?.id) {
        await fetch(`/api/admin/users/${selectedUser.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(data),
          }
        );
      }
      setIsModalOpen(false);
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (request: AgentRegistrationRequest) => {
    try {
      if(request.id) {
        await fetch(`/api/admin/agent-requests/${request.id}/action`,
          {
            method: 'POST',
            body: JSON.stringify({ action: 'approve' }),
          }
        );
        setIsModalOpen(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeny = async (request: AgentRegistrationRequest, reason: string) => {
    try {
      if(request.id) {
        await fetch(`/api/admin/agent-requests/${request.id}/action`,
          {
            method: 'POST',
            body: JSON.stringify({ action: 'deny', adminMsg: reason }),
          }
        );
        setIsModalOpen(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    try {
      if (selectedUser?.id) {
        await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' });
        setIsDeleteModalOpen(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }

    if (isAgentRequestsTab) {
      return <AgentRequestTable requests={requests} page={page} totalPages={totalPages} onPageChange={handlePageChange} onReview={handleReviewRequest} />;
    }

    return <UserTable users={users} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEditUser} onDelete={handleDeleteUser} onView={handleViewUser} />;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={handleAddUser}>Adicionar Novo Usuário</Button>
      </div>
      <Tabs defaultValue={tab} className="w-full" onValueChange={(value) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", value);
        params.set("page", "1");
        if (value !== 'agents') {
          params.delete('subtab');
        }
        router.push(`${pathname}?${params.toString()}`);
      }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="agents">Corretores</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="agents">
          <Tabs defaultValue={subtab} className="w-full mt-4" onValueChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set("subtab", value);
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registered-agents">Corretores Registrados</TabsTrigger>
              <TabsTrigger value="registration-requests">Solicitações de Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="registered-agents">
              <Card>
                <CardHeader>
                  <CardTitle>Corretores Registrados</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContent()}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="registration-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitações de Cadastro de Corretores</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContent()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        userData={selectedUser}
        requestData={selectedRequest}
        onSave={handleSave}
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}
