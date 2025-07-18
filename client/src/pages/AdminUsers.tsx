import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User, CreateUser } from "@/types";
import { UserModal } from "@/components/UserModal";
import { EditUserModal } from "@/components/EditUserModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, Plus, Trash2, Users, Car, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// CKDEV-NOTE: AdminUsers page restricted to admin users only with full CRUD operations
// CKDEV-TODO: Add user role management and permission system
export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => api.getUsers(),
  });

  // CKDEV-NOTE: User mutations handle CRUD operations with optimistic updates
  // CKDEV-TODO: Add confirmation dialogs for destructive actions
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUser) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
      setIsUserModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
      setIsEditModalOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar usuário",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir usuário",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = async (data: CreateUser) => {
    await createUserMutation.mutateAsync(data);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (data: any) => {
    if (!selectedUser) return;
    updateUserMutation.mutate({ id: selectedUser.id, data });
  };

  const handleDeleteUser = (id: string, userName: string) => {
    if (id === user?.id) {
      toast({
        title: "Erro",
        description: "Não é possível excluir a própria conta",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hover:bg-primary/10 hover:text-primary transition-colors rounded-xl"
                >
                  <Link href="/dashboard">
                    <ArrowLeft size={16} className="mr-2" />
                    Voltar ao Dashboard
                  </Link>
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                    <Users size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-zinc-800">Gerenciamento de Usuários</h1>
                    <p className="text-sm text-muted-foreground">Administração de contas de usuário</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-800">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">Administrador</p>
                  </div>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary text-sm font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-muted">
            {/* Header */}
            <div className="p-6 border-b border-muted">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-800">Lista de Usuários</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {users?.length || 0} usuários cadastrados
                  </p>
                </div>
                <Button
                  onClick={() => setIsUserModalOpen(true)}
                  className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                >
                  <Plus size={16} className="mr-2" />
                  Adicionar Usuário
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border border-muted rounded-xl p-4 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-4 bg-muted rounded w-48"></div>
                        </div>
                        <div className="h-8 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {users?.length === 0 ? (
                    <div className="flex justify-center">
                      <div className="text-center py-12 max-w-md">
                        <Users size={48} className="mx-auto text-zinc-400 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-600 mb-2">
                          Nenhum usuário encontrado
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Não há usuários cadastrados no sistema.
                        </p>
                        <Button
                          onClick={() => setIsUserModalOpen(true)}
                          className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                        >
                          <Plus size={16} className="mr-2" />
                          Adicionar Primeiro Usuário
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-muted">
                            <th className="text-left py-3 px-4 font-medium text-zinc-800">Nome</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-800">Email</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-800">Tipo</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-800">Criado em</th>
                            <th className="text-left py-3 px-4 font-medium text-zinc-800">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users?.map((userData) => (
                            <tr key={userData.id} className="border-b border-muted/50 hover:bg-muted/20 transition-colors">
                              <td className="py-4 px-4 text-sm text-zinc-800">{userData.name}</td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">{userData.email}</td>
                              <td className="py-4 px-4 text-sm">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    userData.type === "admin"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {userData.type === "admin" ? "Administrador" : "Comum"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm text-muted-foreground">
                                {userData.createdAt ? formatDate(userData.createdAt) : "-"}
                              </td>
                              <td className="py-4 px-4 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(userData)}
                                    className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
                                  >
                                    <Edit size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(userData.id, userData.name)}
                                    disabled={userData.id === user?.id}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Modal */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSubmit={handleCreateUser}
        />

        {/* Edit User Modal */}
        {selectedUser && (
          <EditUserModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
            onSubmit={handleUpdateUser}
            user={selectedUser}
            currentUserId={user?.id || ""}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
