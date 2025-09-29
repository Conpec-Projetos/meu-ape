"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { UserTable, UserTableSkeleton } from "@/components/features/tables/user-table";
import { AgentRequestTable } from "@/components/features/tables/agent-request-table";
import { UserModal } from "@/components/features/modals/user-modal";
import { DeleteConfirmationModal } from "@/components/features/modals/delete-confirmation-modal";
import { DenialModal } from "@/components/features/modals/denial-modal";
import { useUsers } from "@/hooks/use-users";
import { useAgentRequests } from "@/hooks/use-agent-requests";
import { useUserCounts } from "@/hooks/use-user-counts";
import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

function UserManagementContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "clients";
  const subtab = searchParams.get("subtab") || "registered-agents";
  const page = Number(searchParams.get("page")) || 1;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDenialModalOpen, setIsDenialModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "review" | "view">("add");
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedRequest, setSelectedRequest] = useState<AgentRegistrationRequest | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAgentRequestsTab = tab === 'agents' && subtab === 'registration-requests';

  const { users, total: usersTotal, totalPages: usersTotalPages, isLoading: usersIsLoading, error: usersError, refresh: refreshUsers } = useUsers(
    tab === 'clients' ? 'client' : tab === 'agents' ? 'agent' : 'admin',
    page,
    20,
    tab === 'agents' && subtab === 'registered-agents' ? 'approved' : undefined,
    !isAgentRequestsTab
  );
  const { requests, total: requestsTotal, totalPages: requestsTotalPages, isLoading: requestsIsLoading, error: requestsError, refresh: refreshRequests } = useAgentRequests(
    'pending',
    page,
    20,
    isAgentRequestsTab
  );
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

  const refreshData = () => {
    if (isAgentRequestsTab) {
      refreshRequests();
    } else {
      refreshUsers();
    }
  };

  const handleSave = async (data: Partial<User>) => {
    const promise = () => new Promise(async (resolve, reject) => {
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
        resolve(modalMode === 'add' ? 'Usuário adicionado com sucesso' : 'Usuário atualizado com sucesso');
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise(), {
      loading: 'Salvando usuário...',
      success: (message) => `${message}`,
      error: 'Ocorreu um erro ao salvar o usuário',
    });
  };

  const handleApprove = async (request: AgentRegistrationRequest) => {
    const promise = () => new Promise(async (resolve, reject) => {
      try {
        if(request.id) {
          await fetch(`/api/admin/agent-requests/${request.id}/action`,
            {
              method: 'POST',
              body: JSON.stringify({ action: 'approve' }),
            }
          );
          refreshData();
          resolve('Solicitação de agente aprovada com sucesso');
        }
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise(), {
      loading: 'Aprovando solicitação...',
      success: (message) => `${message}`,
      error: 'Ocorreu um erro ao aprovar a solicitação',
    });
  };

  const handleDenyRequest = (request: AgentRegistrationRequest) => {
    setSelectedRequest(request);
    setIsDenialModalOpen(true);
  };

  const handleConfirmDeny = async (reason: string) => {
    const promise = () => new Promise(async (resolve, reject) => {
      try {
        if(selectedRequest?.id) {
          await fetch(`/api/admin/agent-requests/${selectedRequest.id}/action`,
            {
              method: 'POST',
              body: JSON.stringify({ action: 'deny', adminMsg: reason }),
            }
          );
          setIsDenialModalOpen(false);
          refreshData();
          resolve('Solicitação de agente negada com sucesso');
        }
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise(), {
      loading: 'Negando solicitação...',
      success: (message) => `${message}`,
      error: 'Ocorreu um erro ao negar a solicitação',
    });
  };

  const confirmDelete = async () => {
    const promise = () => new Promise(async (resolve, reject) => {
      try {
        if (selectedUser?.id) {
          await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' });
          setIsDeleteModalOpen(false);
          refreshData();
          resolve(`Usuário '${selectedUser.fullName}' deletado com sucesso`);
        }
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise(), {
      loading: 'Deletando usuário...',
      success: (message) => `${message}`,
      error: 'Ocorreu um erro ao deletar o usuário',
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <UserTableSkeleton />;
    }

    if (error) {
      return <p className="text-red-500">{error}</p>;
    }

    if (isAgentRequestsTab) {
      return <AgentRequestTable requests={requests} page={page} totalPages={totalPages} onPageChange={handlePageChange} onReview={handleReviewRequest} onApprove={handleApprove} onDeny={handleDenyRequest} />;
    }

    return <UserTable users={users} page={page} totalPages={totalPages} onPageChange={handlePageChange} onEdit={handleEditUser} onDelete={handleDeleteUser} onView={handleViewUser} onAddUser={handleAddUser} />;
  }

  const getTabContent = (title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Visualize, adicione, e gerencie todos os usuários do sistema.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Procurar por nome ou email..." className="pl-8 w-full" />
        </div>
        <Button onClick={handleAddUser} className="w-full sm:w-auto">Adicionar Novo Usuário</Button>
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
          <TabsTrigger value="clients">Clientes ({countsIsLoading ? '...' : userCounts.client})</TabsTrigger>
          <TabsTrigger value="agents">Corretores ({countsIsLoading ? '...' : userCounts.agent + requestsTotal})</TabsTrigger>
          <TabsTrigger value="admins">Administradores ({countsIsLoading ? '...' : userCounts.admin})</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          {getTabContent("Todos os Clientes")}
        </TabsContent>
        <TabsContent value="agents">
          <Tabs defaultValue={subtab} className="w-full mt-4" onValueChange={(value) => {
            const params = new URLSearchParams(searchParams);
            params.set("subtab", value);
            params.set("page", "1");
            router.push(`${pathname}?${params.toString()}`);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="registered-agents">Corretores Registrados ({countsIsLoading ? '...' : userCounts.agent})</TabsTrigger>
              <TabsTrigger value="registration-requests">Solicitações de Cadastro ({requestsIsLoading ? '...' : requestsTotal})</TabsTrigger>
            </TabsList>
            <TabsContent value="registered-agents">
              {getTabContent("Corretores Registrados")}
            </TabsContent>
            <TabsContent value="registration-requests">
              {getTabContent("Solicitações de Cadastro de Corretores")}
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="admins">
          {getTabContent("Todos os Administradores")}
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
        onDeny={handleConfirmDeny}
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
        onConfirm={handleConfirmDeny}
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
