import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  Search, 
  Phone, 
  Mail, 
  MessageSquare, 
  Book, 
  Video, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  ExternalLink
} from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  date: string;
}

// CKDEV-NOTE: FAQ data is hardcoded for demonstration purposes
// CKDEV-TODO: Replace with dynamic FAQ content from CMS or database
const faqs: FAQ[] = [
  {
    id: '1',
    question: 'Como adicionar um novo veículo ao sistema?',
    answer: 'Para adicionar um novo veículo, vá para a página de Veículos e clique no botão "Adicionar Veículo". Preencha todas as informações necessárias como marca, modelo, ano, preço e fotos. Verifique se todos os campos obrigatórios foram preenchidos antes de salvar.',
    category: 'vehicles'
  },
  {
    id: '2',
    question: 'Como gerenciar usuários do sistema?',
    answer: 'Apenas administradores podem gerenciar usuários. Acesse a página "Usuários" no menu lateral. Você pode adicionar novos usuários, editar informações existentes ou desativar contas. Lembre-se de definir corretamente as permissões de cada usuário.',
    category: 'users'
  },
  {
    id: '3',
    question: 'Como funciona o sistema de aprovação de veículos?',
    answer: 'Todos os veículos adicionados passam por um processo de aprovação. Administradores podem acessar a página "Aprovações" para revisar e aprovar ou rejeitar veículos pendentes. Veículos aprovados ficam disponíveis para visualização.',
    category: 'approval'
  },
  {
    id: '4',
    question: 'Como acessar relatórios e análises?',
    answer: 'Acesse a página "Analytics" para visualizar relatórios detalhados sobre vendas, inventário e performance. Você encontrará gráficos interativos e métricas importantes para tomada de decisões.',
    category: 'analytics'
  },
  {
    id: '5',
    question: 'Como alterar minha senha?',
    answer: 'Vá para a página "Perfil" e clique em "Editar Perfil". Você pode alterar sua senha inserindo a nova senha no campo correspondente. Certifique-se de usar uma senha forte com pelo menos 8 caracteres.',
    category: 'account'
  }
];

// CKDEV-NOTE: Support tickets are mock data for UI demonstration
// CKDEV-TODO: Integrate with real ticketing system API
const supportTickets: SupportTicket[] = [
  {
    id: '1',
    title: 'Erro ao fazer upload de imagens',
    status: 'in-progress',
    priority: 'high',
    date: '2024-01-15'
  },
  {
    id: '2',
    title: 'Problema com filtros de pesquisa',
    status: 'resolved',
    priority: 'medium',
    date: '2024-01-14'
  },
  {
    id: '3',
    title: 'Solicitação de nova funcionalidade',
    status: 'open',
    priority: 'low',
    date: '2024-01-13'
  }
];

// CKDEV-NOTE: Help page with FAQ search, contact form, and support tickets
// CKDEV-TODO: Add real-time chat support integration
export default function Help() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("faq");

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // CKDEV-NOTE: Contact form submission currently shows mock success message
  // CKDEV-TODO: Implement real email sending with backend integration
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mensagem enviada",
      description: "Sua mensagem foi enviada com sucesso. Retornaremos em breve!",
    });
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'medium'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
              <HelpCircle size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-800">Ajuda & Suporte</h1>
              <p className="text-sm text-muted-foreground">Encontre respostas e entre em contato conosco</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-xl">
            <TabsTrigger value="faq" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">FAQ</TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Contato</TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Tickets</TabsTrigger>
            <TabsTrigger value="resources" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Recursos</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {/* Search and Filter */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar perguntas frequentes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="vehicles">Veículos</option>
                    <option value="users">Usuários</option>
                    <option value="approval">Aprovações</option>
                    <option value="analytics">Analytics</option>
                    <option value="account">Conta</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* FAQ List */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Book className="w-5 h-5 text-primary" />
                  <span>Perguntas Frequentes ({filteredFaqs.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle size={48} className="mx-auto text-zinc-400 mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-600 mb-2">Nenhuma pergunta encontrada</h3>
                    <p className="text-sm text-muted-foreground">Tente usar outros termos de busca ou categoria.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
            </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Form */}
              <Card className="bg-white shadow-sm rounded-2xl border border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-zinc-800">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Enviar Mensagem</span>
                  </CardTitle>
                </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitContact} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome</Label>
                          <Input
                            id="name"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input
                          id="subject"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Prioridade</Label>
                        <select
                          value={contactForm.priority}
                          onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Baixa</option>
                          <option value="medium">Média</option>
                          <option value="high">Alta</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea
                          id="message"
                          value={contactForm.message}
                          onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                          rows={4}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full rounded-xl">
                        <Send size={16} className="mr-2" />
                        Enviar Mensagem
                      </Button>
                    </form>
                  </CardContent>
                </Card>

              {/* Contact Info */}
              <Card className="bg-white shadow-sm rounded-2xl border border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-zinc-800">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>Informações de Contato</span>
                  </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">Telefone</p>
                          <p className="text-sm text-muted-foreground">(11) 9999-9999</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">Email</p>
                          <p className="text-sm text-muted-foreground">suporte@autovision.com</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">Horário de Atendimento</p>
                          <p className="text-sm text-muted-foreground">Seg-Sex: 8h às 18h</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-zinc-800 mb-3">Tempo de Resposta</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Prioridade Alta</span>
                          <span className="text-sm font-medium text-green-600">2-4 horas</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Prioridade Média</span>
                          <span className="text-sm font-medium text-yellow-600">1-2 dias</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Prioridade Baixa</span>
                          <span className="text-sm font-medium text-muted-foreground">3-5 dias</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span>Meus Tickets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-muted rounded-xl p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-zinc-800 mb-2">{ticket.title}</h4>
                          <div className="flex items-center space-x-4">
                            <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                              {ticket.status === 'open' ? 'Aberto' : 
                               ticket.status === 'in-progress' ? 'Em Andamento' : 'Resolvido'}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority === 'high' ? 'Alta' : 
                               ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{ticket.date}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-800">Documentação</h3>
                      <p className="text-sm text-muted-foreground">Guias e manuais completos</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <ExternalLink size={16} className="mr-2" />
                    Acessar Documentação
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Video className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-800">Video Tutoriais</h3>
                      <p className="text-sm text-muted-foreground">Aprenda com vídeos explicativos</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <ExternalLink size={16} className="mr-2" />
                    Ver Tutoriais
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-800">Comunidade</h3>
                      <p className="text-sm text-muted-foreground">Fórum da comunidade</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl">
                    <ExternalLink size={16} className="mr-2" />
                    Acessar Fórum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}