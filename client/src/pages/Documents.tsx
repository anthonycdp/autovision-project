import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { DocumentViewer } from "@/components/DocumentViewer";
import { diagnosticPDFFile, logPDFDiagnostic } from "@/utils/pdfDiagnostic";
import { 
  FileText, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Folder,
  File,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  Plus,
  Archive,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  filePath: string;
  category: 'contract' | 'invoice' | 'certificate' | 'manual' | 'other';
  status: 'active' | 'archived' | 'draft';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
}


export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    category: 'other' as 'contract' | 'invoice' | 'certificate' | 'manual' | 'other',
    status: 'active' as 'active' | 'draft' | 'archived',
    file: null as File | null
  });

  const [editForm, setEditForm] = useState({
    name: '',
    category: 'other' as 'contract' | 'invoice' | 'certificate' | 'manual' | 'other',
    status: 'active' as 'active' | 'draft' | 'archived'
  });

  // Fetch documents
  const { data: documentsData, isLoading, error } = useQuery<DocumentsResponse>({
    queryKey: ['documents', { category: selectedCategory, status: selectedStatus, search: searchQuery }],
    queryFn: async () => {
      console.log('Documents useQuery executing...');
      const filters: any = {};
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (searchQuery) filters.search = searchQuery;
      
      console.log('About to call api.getDocuments with filters:', filters);
      const result = await api.getDocuments(filters);
      console.log('Documents useQuery result:', result);
      return result;
    },
  });

  // Log para debug
  console.log('Documents component state:', {
    documentsData,
    isLoading,
    error,
    selectedCategory,
    selectedStatus,
    searchQuery
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      return api.uploadDocument(file, 'other', 'active');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Sucesso', description: 'Arquivo enviado com sucesso!' });
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao enviar arquivo', variant: 'destructive' });
      setIsUploading(false);
      setUploadProgress(0);
    }
  });

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; status: string; file: File }) => {
      const document = await api.uploadDocument(data.file, data.category, data.status);
      
      // Update document name if different from original
      if (data.name !== data.file.name) {
        return api.updateDocument(document.id, {
          name: data.name,
          category: data.category,
          status: data.status
        });
      }
      
      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Sucesso', description: 'Documento criado com sucesso!' });
      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', category: 'other', status: 'active', file: null });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao criar documento', variant: 'destructive' });
    }
  });

  // Update document mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; category: string; status: string }) => {
      return api.updateDocument(data.id, {
        name: data.name,
        category: data.category,
        status: data.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Sucesso', description: 'Documento atualizado com sucesso!' });
      setIsEditDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao atualizar documento', variant: 'destructive' });
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({ title: 'Sucesso', description: 'Documento deletado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message || 'Erro ao deletar documento', variant: 'destructive' });
    }
  });

  // CKDEV-NOTE: Enhanced file upload with PDF diagnostic validation
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Perform PDF diagnostic if it's a PDF file
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        toast({ title: 'Validando PDF...', description: 'Verificando integridade do arquivo' });
        
        const diagnostic = await diagnosticPDFFile(file);
        logPDFDiagnostic(diagnostic);
        
        if (!diagnostic.isValid) {
          toast({ 
            title: 'PDF Inválido', 
            description: `Arquivo com problemas: ${diagnostic.errors.join(', ')}`,
            variant: 'destructive' 
          });
          return;
        }
        
        if (diagnostic.warnings.length > 0) {
          toast({ 
            title: 'Avisos do PDF', 
            description: `${diagnostic.warnings.join(', ')}. O upload continuará.`,
            variant: 'default' 
          });
        } else {
          toast({ 
            title: 'PDF Válido', 
            description: 'Arquivo verificado com sucesso, iniciando upload'
          });
        }
        
      } catch (error) {
        console.error('PDF diagnostic failed:', error);
        toast({ 
          title: 'Erro na Validação', 
          description: 'Não foi possível validar o PDF, mas o upload continuará',
          variant: 'default' 
        });
      }
    }

    uploadMutation.mutate(file);
  };

  // Handle create document
  const handleCreateDocument = () => {
    if (!createForm.file) {
      toast({ title: 'Erro', description: 'Selecione um arquivo', variant: 'destructive' });
      return;
    }
    
    createMutation.mutate({
      name: createForm.name || createForm.file.name,
      category: createForm.category,
      status: createForm.status,
      file: createForm.file
    });
  };

  // Handle edit document
  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    setEditForm({
      name: document.name,
      category: document.category,
      status: document.status
    });
    setIsEditDialogOpen(true);
  };

  // Handle view document
  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
  };

  // Handle download document
  const handleDownloadDocument = (document: Document) => {
    api.downloadDocument(document.id);
  };

  // Handle update document
  const handleUpdateDocument = () => {
    if (!selectedDocument) return;
    
    updateMutation.mutate({
      id: selectedDocument.id,
      name: editForm.name,
      category: editForm.category,
      status: editForm.status
    });
  };

  // Handle delete document
  const handleDeleteDocument = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const documents = documentsData?.documents || [];
  const filteredDocuments = documents;

  const documentStats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    draft: documents.filter(d => d.status === 'draft').length,
    archived: documents.filter(d => d.status === 'archived').length
  };


  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'draft':
        return 'Rascunho';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contract':
        return 'Contrato';
      case 'invoice':
        return 'Fatura';
      case 'certificate':
        return 'Certificado';
      case 'manual':
        return 'Manual';
      case 'other':
        return 'Outros';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'invoice':
        return <FileText className="w-4 h-4" />;
      case 'certificate':
        return <FileText className="w-4 h-4" />;
      case 'manual':
        return <File className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };


  return (
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
                  <FileText size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Documentos</h1>
                  <p className="text-sm text-muted-foreground">Gerenciamento de documentos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt,.xlsx,.jpeg,.jpg,.png"
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                {isUploading ? (
                  <Loader2 size={18} className="mr-2 animate-spin" />
                ) : (
                  <Upload size={18} className="mr-2" />
                )}
                Fazer Upload
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shadow-sm hover:shadow-md transition-all duration-300 font-medium">
                    <Plus size={18} className="mr-2" />
                    Novo Documento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Documento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="document-name">Nome do Documento</Label>
                      <Input
                        id="document-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                        placeholder="Nome do documento"
                      />
                    </div>
                    <div>
                      <Label htmlFor="document-category">Categoria</Label>
                      <Select value={createForm.category} onValueChange={(value) => setCreateForm({...createForm, category: value as any})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contrato</SelectItem>
                          <SelectItem value="invoice">Fatura</SelectItem>
                          <SelectItem value="certificate">Certificado</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document-status">Status</Label>
                      <Select value={createForm.status} onValueChange={(value) => setCreateForm({...createForm, status: value as any})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document-file">Arquivo</Label>
                      <Input
                        id="document-file"
                        type="file"
                        accept=".pdf,.docx,.txt,.xlsx,.jpeg,.jpg,.png"
                        onChange={(e) => setCreateForm({...createForm, file: e.target.files?.[0] || null})}
                      />
                    </div>
                    <Button onClick={handleCreateDocument} disabled={createMutation.isPending}>
                      {createMutation.isPending ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : null}
                      Criar Documento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Cards - Clickable Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <Card 
              className={`bg-white shadow-lg rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                selectedStatus === 'all' ? 'ring-2 ring-blue-500 ring-offset-2' : ''
              }`}
              onClick={() => setSelectedStatus('all')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{documentStats.total}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl shadow-inner">
                    <FileText className="w-6 h-6 text-blue-600 drop-shadow-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-white shadow-lg rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                selectedStatus === 'active' ? 'ring-2 ring-green-500 ring-offset-2' : ''
              }`}
              onClick={() => setSelectedStatus('active')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ativos</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{documentStats.active}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl shadow-inner">
                    <FileText className="w-6 h-6 text-green-600 drop-shadow-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-white shadow-lg rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                selectedStatus === 'draft' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
              }`}
              onClick={() => setSelectedStatus('draft')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rascunhos</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{documentStats.draft}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-2xl shadow-inner">
                    <Edit className="w-6 h-6 text-yellow-600 drop-shadow-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`bg-white shadow-lg rounded-3xl border-0 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                selectedStatus === 'archived' ? 'ring-2 ring-gray-500 ring-offset-2' : ''
              }`}
              onClick={() => setSelectedStatus('archived')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivados</p>
                    <p className="text-3xl font-bold text-gray-600 mt-1">{documentStats.archived}</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-2xl shadow-inner">
                    <Archive className="w-6 h-6 text-gray-600 drop-shadow-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white shadow-xl rounded-3xl border-0">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar documentos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-xl shadow-sm border-gray-200 focus:border-blue-500 transition-all duration-300"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-xl shadow-sm border-gray-200">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">Todas as Categorias</SelectItem>
                    <SelectItem value="contract" className="rounded-lg">Contratos</SelectItem>
                    <SelectItem value="invoice" className="rounded-lg">Faturas</SelectItem>
                    <SelectItem value="certificate" className="rounded-lg">Certificados</SelectItem>
                    <SelectItem value="manual" className="rounded-lg">Manuais</SelectItem>
                    <SelectItem value="other" className="rounded-lg">Outros</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-xl shadow-sm border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">Todos os Status</SelectItem>
                    <SelectItem value="active" className="rounded-lg">Ativos</SelectItem>
                    <SelectItem value="draft" className="rounded-lg">Rascunhos</SelectItem>
                    <SelectItem value="archived" className="rounded-lg">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="bg-white shadow-xl rounded-3xl border-0">
            <CardHeader className="px-8 pt-8 pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <span>Documentos ({filteredDocuments.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-16">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-500 font-medium">Carregando documentos...</p>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                      <FileText size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Nenhum documento corresponde aos filtros aplicados. Tente ajustar seus critérios de busca.</p>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-xl ${
                            doc.type.includes('pdf') ? 'bg-red-100' : 
                            doc.type.includes('doc') ? 'bg-blue-100' : 
                            'bg-gray-100'
                          }`}>
                            <FileText className={`w-6 h-6 ${
                              doc.type.includes('pdf') ? 'text-red-600' : 
                              doc.type.includes('doc') ? 'text-blue-600' : 
                              'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{doc.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                              <span className="text-sm text-gray-500 font-medium">{doc.type.toUpperCase()}</span>
                              <span className="text-sm text-gray-500">{formatFileSize(doc.size)}</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">{formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-medium px-3 py-1 rounded-full">
                              {getCategoryLabel(doc.category)}
                            </Badge>
                            <Badge className={`text-xs font-medium px-3 py-1 rounded-full ${
                              doc.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                              doc.status === 'draft' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                              'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}>
                              {getStatusLabel(doc.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button variant="ghost" size="sm" className="hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => handleViewDocument(doc)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:text-green-600 hover:bg-green-50 rounded-lg" onClick={() => handleDownloadDocument(doc)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:text-orange-600 hover:bg-orange-50 rounded-lg" onClick={() => handleEditDocument(doc)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="hover:text-red-600 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o documento "{doc.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Document Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-document-name">Nome do Documento</Label>
              <Input
                id="edit-document-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Nome do documento"
              />
            </div>
            <div>
              <Label htmlFor="edit-document-category">Categoria</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="invoice">Fatura</SelectItem>
                  <SelectItem value="certificate">Certificado</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-document-status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value as any})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdateDocument} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </div>
  );
}