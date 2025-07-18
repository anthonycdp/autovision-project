# CLAUDE.md - Autovision Project

## Informações do Projeto

**Nome:** Autovision  
**Tipo:** Sistema de Gerenciamento de Concessionária  
**Stack:** React + TypeScript + Node.js + PostgreSQL + Express  
**Versão:** 1.0.0  

## Configuração Atual

### Banco de Dados
- **Tipo:** PostgreSQL
- **URL:** `postgresql://postgres:postgres@localhost:5432/autovision`
- **Database:** autovision
- **ORM:** Drizzle

### Servidor
- **Porta:** 3000
- **Ambiente:** Development
- **Framework:** Express

### Credenciais de Acesso
- **Email:** admin@autovision.com
- **Senha:** admin123
- **Tipo:** Administrador

## Comandos Importantes

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar migrações do banco
npm run db:push

# Verificar tipos TypeScript
npm run check

# Build para produção
npm run build
```

### Banco de Dados
```bash
# Criar usuário admin (se necessário)
npx tsx create-admin.js

# Conectar ao PostgreSQL
psql -U postgres -d autovision

# Verificar status do PostgreSQL (WSL)
sudo service postgresql status
sudo service postgresql start
```

## Estrutura do Projeto

```
autovision-project/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # Context providers
│   │   └── lib/           # Utilitários
├── server/                # Backend Express
│   ├── routes.ts          # Rotas da API
│   ├── auth.ts           # Autenticação
│   ├── db.ts             # Conexão banco
│   └── services/         # Serviços
├── shared/               # Código compartilhado
│   └── schema.ts         # Schema do banco
└── .env                  # Variáveis de ambiente
```

## Funcionalidades Principais

### Autenticação
- Sistema de login/logout
- JWT para tokens
- Tipos de usuário: admin, common
- Hash de senhas com bcrypt

### Veículos
- CRUD completo de veículos
- Upload de imagens
- Filtros e busca
- Comparação de veículos
- Sistema de aprovação

### Usuários
- Gerenciamento de usuários (admin)
- Perfis de usuário
- Histórico de atividades

### Dashboard
- Estatísticas de vendas
- Gráficos e relatórios
- Cards informativos
- Navegação por status

## Configurações Especiais

### OpenAI (Opcional)
- Configuração opcional para descrições automáticas
- Fallback implementado se não configurada
- Variável: `OPENAI_API_KEY`

### Email (Opcional)
- SendGrid para envio de emails
- Variável: `SENDGRID_API_KEY`

## Problemas Conhecidos

1. **PostgreSQL WSL:** Pode precisar iniciar manualmente
   ```bash
   sudo service postgresql start
   ```

2. **Primeiro Login:** Requer criação manual do admin
   ```bash
   npx tsx create-admin.js
   ```

3. **OpenAI:** Funciona sem API key (usa fallback)

## Últimas Alterações

- ✅ Projeto renomeado completamente para "Autovision"
- ✅ PostgreSQL configurado para WSL
- ✅ Usuário administrador criado
- ✅ Sistema funcionando corretamente
- ✅ Dependências atualizadas (pg, dotenv)

## URLs Importantes

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Login:** http://localhost:3000 (redireciona se não autenticado)

## Contatos do Sistema

- **Email:** contato@autovision.com
- **Suporte:** suporte@autovision.com
- **Website:** https://autovision.com

## 🏗️ Decisões de Arquitetura

### Frontend (React + TypeScript)
- **Estrutura de Componentes:** Separação clara entre UI components (`/ui`) e business components
- **Gerenciamento de Estado:** Context API para autenticação, React Query para server state
- **Roteamento:** Wouter (leve, funcional) em vez de React Router
- **Styling:** Tailwind CSS com componentes Shadcn/ui para consistência
- **Formulários:** React Hook Form + Zod para validação
- **Comunicação API:** Fetch nativo com abstração em `/lib/api.ts`
- **Componentes Dinâmicos:** Sempre buscar dados da API, nunca hardcodear listas

### Backend (Node.js + Express)
- **ORM:** Drizzle (type-safe, performático) em vez de Prisma/Sequelize
- **Autenticação:** JWT + bcrypt, session em memória para desenvolvimento
- **Validação:** Zod compartilhado entre frontend/backend (`shared/schema.ts`)
- **Upload de Arquivos:** Multer com storage local (considerar S3 para produção)
- **Banco de Dados:** PostgreSQL com conexão via pool
- **Middleware:** Separação em `/middleware` para auth, upload, etc.

### Arquitetura Geral
- **Monorepo:** Frontend e backend no mesmo repositório
- **Shared Code:** Schemas e tipos compartilhados em `/shared`
- **Build:** Vite para frontend, esbuild para backend
- **Desenvolvimento:** Hot reload para ambos frontend/backend

## 🎨 Estilo de Código

### TypeScript
```typescript
// ✅ Interfaces para props de componentes
interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: string) => void;
}

// ✅ Union types para status
type VehicleStatus = 'pending' | 'approved' | 'rejected';

// ✅ Async/await em vez de .then()
const handleSubmit = async (data: FormData) => {
  try {
    await api.createVehicle(data);
  } catch (error) {
    console.error(error);
  }
};
```

### React Components
```typescript
// ✅ Functional components com TypeScript
export function VehicleCard({ vehicle, onEdit }: VehicleCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      {/* JSX aqui */}
    </Card>
  );
}

// ✅ Custom hooks para lógica reutilizável
export function useVehicleFilters() {
  const [filters, setFilters] = useState<VehicleFilters>({});
  // lógica do hook
  return { filters, setFilters, clearFilters };
}
```

### Backend/API
```typescript
// ✅ Middleware tipado
interface AuthenticatedRequest extends Request {
  user?: User;
}

// ✅ Handlers assíncronos com error handling
app.post('/api/vehicles', async (req: AuthenticatedRequest, res) => {
  try {
    const vehicle = await db.insert(vehicles).values(req.body);
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📋 Padrões a Seguir

### Nomenclatura
- **Componentes:** PascalCase (`VehicleCard`, `UserModal`, `BrandDropdown`)
- **Hooks:** camelCase com "use" prefix (`useAuth`, `useVehicleFilters`, `useMarcas`)
- **Arquivos:** kebab-case para páginas (`vehicle-details.tsx`)
- **Props:** camelCase (`onEdit`, `isLoading`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

### Estrutura de Arquivos
```
components/
├── ui/              # Componentes reutilizáveis (Button, Input, etc.)
├── VehicleCard.tsx  # Componentes específicos do domínio
├── VehicleModal.tsx
└── BrandDropdown.tsx # Componentes dinâmicos reutilizáveis

pages/
├── Dashboard.tsx    # Páginas principais
└── VehicleDetails.tsx

hooks/
├── useAuth.ts      # Custom hooks
├── useVehicleFilters.ts
└── useMarcas.ts    # Hooks para dados dinâmicos
```

### Error Handling
- **Frontend:** Toast notifications para feedback
- **Backend:** Logs estruturados + códigos HTTP apropriados
- **Banco:** Tratamento de constraints e foreign keys
- **Validação:** Zod schemas em ambos frontend/backend

### Performance
- **Lazy Loading:** Componentes pesados com `React.lazy()`
- **Memoização:** `useMemo` para cálculos custosos
- **Paginação:** Implementada no backend e frontend
- **Images:** Otimização automática e lazy loading

### Segurança
- **Autenticação:** JWT com expiração
- **Autorização:** Middleware verificando user.type
- **Sanitização:** Inputs sempre validados com Zod
- **CORS:** Configurado apropriadamente

## ❌ O que NÃO Fazer

### Frontend
- ❌ **Não usar `any`** - sempre tipar adequadamente
- ❌ **Não fazer fetch direto** - usar a abstração em `/lib/api.ts`
- ❌ **Não misturar estilos** - só Tailwind, evitar CSS modules/styled-components
- ❌ **Não usar class components** - só functional components
- ❌ **Não fazer setState em loops** - usar useCallback/useMemo
- ❌ **Não esquecer keys em listas** - sempre key única
- ❌ **Não ignorar warnings do TypeScript** - resolver todos
- ❌ **Não usar dados hardcoded** - sempre buscar da API ou banco de dados

### Backend
- ❌ **Não fazer queries SQL diretas** - usar Drizzle ORM
- ❌ **Não expor dados sensíveis** - filtrar responses da API
- ❌ **Não hardcodar configs** - usar variáveis de ambiente
- ❌ **Não ignorar error handling** - sempre try/catch em async functions
- ❌ **Não fazer joins desnecessários** - otimizar queries
- ❌ **Não usar console.log em produção** - proper logging

### Banco de Dados
- ❌ **Não fazer migrations manuais** - usar `npm run db:push`
- ❌ **Não deletar dados sem backup** - sempre confirmar
- ❌ **Não expor credenciais** - usar .env
- ❌ **Não fazer queries em loops** - usar batch operations

### Geral
- ❌ **Não commitar .env** - sempre no .gitignore
- ❌ **Não usar dependências desnecessárias** - manter bundle pequeno
- ❌ **Não ignorar TypeScript errors** - projeto deve compilar sem warnings
- ❌ **Não quebrar convenções** - seguir padrões estabelecidos
- ❌ **Não fazer changes sem testes** - verificar funcionalidade

### Específico do Projeto
- ❌ **Não alterar shared/schema.ts** sem migração
- ❌ **Não quebrar autenticação** - sempre testar login/logout
- ❌ **Não remover validações** - manter segurança
- ❌ **Não fazer uploads sem validação** - verificar tipos/tamanhos
- ❌ **Não usar dados mockados em produção** - sempre validar origem dos dados

## 🔒 Configuração de Segurança e Boas Práticas

### Proteção de Chaves de API
- ✅ **Arquivo .env protegido** - Nunca commitar no Git
- ✅ **Validação de formato** - Chaves API são validadas antes do uso
- ✅ **Fallback automático** - Sistema funciona sem chaves API
- ✅ **Logs seguros** - Informações sensíveis são filtradas automaticamente

### Sistema de Logs
- ✅ **Logs estruturados** - Formato JSON com timestamp, nível, contexto
- ✅ **Rotação automática** - Logs são rotacionados quando excedem 10MB
- ✅ **Sanitização** - Dados sensíveis são automaticamente removidos
- ✅ **Múltiplos níveis** - debug, info, warn, error

### Validações de Entrada
- ✅ **Esquemas Zod** - Validação robusta com mensagens claras
- ✅ **Proteção XSS** - Detecção e bloqueio de padrões maliciosos
- ✅ **Proteção SQL Injection** - Validação de padrões suspeitos
- ✅ **Sanitização** - Limpeza automática de dados de entrada

### Tratamento de Timeouts
- ✅ **Timeout configurável** - OpenAI API com timeout de 30 segundos
- ✅ **Retry automático** - 3 tentativas em caso de falha
- ✅ **Fallback robusto** - Sempre retorna conteúdo, mesmo com falha na IA
- ✅ **Métricas de performance** - Logging do tempo de resposta

### Rate Limiting
- ✅ **Validação de requests** - Proteção contra spam
- ✅ **Identificação de cliente** - Por IP e User-Agent
- ✅ **Respostas padronizadas** - Códigos HTTP apropriados

### Configuração de Produção
```bash
# Gerar chaves seguras
openssl rand -base64 32

# Configurar variáveis de ambiente
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
```

### Monitoramento
- ✅ **Logs de API** - Todas as requisições são logadas
- ✅ **Métricas OpenAI** - Tempo de resposta, tokens usados
- ✅ **Alertas de erro** - Logs estruturados para fácil análise
- ✅ **Auditoria** - Rastreamento de ações por usuário

### Checklist de Segurança
- [ ] Configurar HTTPS em produção
- [ ] Implementar rate limiting com Redis
- [ ] Configurar backup automático de logs
- [ ] Implementar monitoramento de métricas
- [ ] Configurar alertas para erros críticos
- [ ] Implementar rotação automática de chaves
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Implementar 2FA para administradores

## 🔍 Comentários Âncora (AIDEV System)

### Objetivo
Tornar o código mais compreensível e navegável tanto para humanos quanto para IA, especialmente em trechos críticos ou com decisões técnicas importantes.

### Lições Aprendidas
- Sempre validar se dados estão vindo da API e não hardcoded
- Componentes dinâmicos devem ser reutilizáveis entre páginas
- Implementar validação robusta em hooks de dados

### Tipos de Comentários
```typescript
// CKDEV-NOTE: Explicações de decisões técnicas e instruções para futuras edições
// CKDEV-TODO: Melhorias ou extensões futuras planejadas
// CKDEV-QUESTION: Dúvidas sobre trechos ambíguos que precisam validação humana
```

### Diretrizes de Uso
- **Máximo 120 caracteres** por comentário
- **Não remover** comentários AIDEV-* existentes sem instrução explícita
- **Atualizar** comentários relacionados ao fazer mudanças no código
- **Revisar** comentários AIDEV-* existentes antes de criar novos
- **Manter consistência** no estilo e formato

### Exemplos Práticos

#### Frontend (React/TypeScript)
```typescript
// CKDEV-NOTE: useAuth hook manages JWT tokens and user state across the app
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  // CKDEV-TODO: Add refresh token logic for better security
  const login = async (credentials: LoginData) => {
    // implementation
  };
  
  // CKDEV-QUESTION: Should we auto-logout on token expiry or show refresh modal?
  useEffect(() => {
    checkTokenExpiry();
  }, []);
}

// CKDEV-NOTE: VehicleCard uses lazy loading for images; see: intersection observer API
export function VehicleCard({ vehicle }: VehicleCardProps) {
  // CKDEV-TODO: Add skeleton loading state while image loads
  return (
    <Card>
      <img loading="lazy" src={vehicle.imageUrl} />
    </Card>
  );
}
```

#### Backend (Node.js/Express)
```typescript
// CKDEV-NOTE: Authentication middleware validates JWT and injects user into request
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  // CKDEV-TODO: Add rate limiting to prevent brute force attacks
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  // CKDEV-QUESTION: Should we blacklist revoked tokens or use short-lived tokens?
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}
```

#### Database/Schema
```typescript
// CKDEV-NOTE: Vehicle table designed for multi-tenant support; dealerId for future use
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  // CKDEV-TODO: Add soft delete functionality with deletedAt timestamp
  dealerId: uuid('dealer_id'), // for future multi-tenant support
  
  // CKDEV-QUESTION: Should price be stored as integer (cents) to avoid float precision?
  price: varchar('price', { length: 20 }).notNull(),
});
```

#### API Routes
```typescript
// CKDEV-NOTE: Vehicle CRUD operations follow RESTful conventions
app.get('/api/vehicles', async (req, res) => {
  // CKDEV-TODO: Add caching layer (Redis) for frequently accessed vehicle lists
  const { page = 1, limit = 10, status } = req.query;
  
  // CKDEV-QUESTION: Should we limit max page size to prevent DoS attacks?
  const vehicles = await db.select().from(vehiclesTable)
    .where(status ? eq(vehiclesTable.status, status) : undefined)
    .limit(Number(limit))
    .offset((Number(page) - 1) * Number(limit));
});
```

### Casos de Uso Específicos

#### Decisões Técnicas Importantes
```typescript
// CKDEV-NOTE: Using Drizzle ORM instead of Prisma for better TypeScript performance
// CKDEV-NOTE: Wouter router chosen over React Router for smaller bundle size
// CKDEV-NOTE: JWT stored in memory, not localStorage, for security (XSS protection)
```

#### Integrações Externas
```typescript
// CKDEV-NOTE: OpenAI integration is optional; fallback generates descriptions locally
// CKDEV-TODO: Add retry logic with exponential backoff for OpenAI API calls
// CKDEV-QUESTION: Should we cache OpenAI responses to reduce API costs?
```

#### Performance Considerations
```typescript
// CKDEV-NOTE: Virtual scrolling implemented for vehicle lists >100 items
// CKDEV-TODO: Add image optimization/compression before upload
// CKDEV-NOTE: Database indexes on make, model, year for fast filtering
```

#### Security & Validation
```typescript
// CKDEV-NOTE: All inputs validated with Zod schemas shared between frontend/backend
// CKDEV-TODO: Add CSRF protection for state-changing operations
// CKDEV-QUESTION: Should we implement 2FA for admin users?
```

### Manutenção de Comentários
- **Antes de modificar código:** Verificar se há comentários AIDEV-* relacionados
- **Após mudanças:** Atualizar comentários que se tornaram obsoletos
- **Code review:** Verificar se novos comentários seguem as diretrizes
- **Limpeza periódica:** Remover TODOs implementados, resolver QUESTIONs

### Benefícios
1. **Contexto preservado** para futuras modificações
2. **Decisões técnicas documentadas** no próprio código
3. **IA assistants** têm melhor compreensão do código
4. **Onboarding** mais rápido para novos desenvolvedores
5. **Debt técnico** visível e rastreável

## 🚨 Lições Aprendidas - Modernização de UI (17/07/2025)

### Problemas Identificados e Soluções

#### **1. Erros de JSX - Estrutura Incompleta**
```typescript
// ❌ PROBLEMA: Tags JSX não fechadas ou estrutura incorreta
return (
  <div>
    <div className="content">
      // conteúdo
    </div>
  // </div> <- div principal não fechada
);

// ✅ SOLUÇÃO: Sempre verificar estrutura completa
return (
  <div>
    <div className="content">
      // conteúdo
    </div>
  </div> // <- div principal fechada corretamente
);
```

#### **2. Erros Após MultiEdit - Validação Obrigatória**
```bash
# ❌ PROBLEMA: Não validar após múltiplas edições
MultiEdit aplicado → Deploy direto → Erro de sintaxe

# ✅ SOLUÇÃO: Sempre validar após edições massivas
MultiEdit aplicado → npm run check → Corrigir erros → Deploy
```

#### **3. Indentação Inconsistente em Estruturas Aninhadas**
```typescript
// ❌ PROBLEMA: Indentação incorreta após edições
<div>
  <Card>
    <CardContent>
      <div>
        // conteúdo
      </div>
    </CardContent>
  </Card>
</div>

// ✅ SOLUÇÃO: Manter estrutura visual clara
<div>
  <Card>
    <CardContent>
      <div>
        // conteúdo
      </div>
    </CardContent>
  </Card>
</div>
```

### **Checklist de Validação - Modernização UI**

#### **Antes de Aplicar Mudanças:**
- [ ] Analisar screenshots para entender layout atual
- [ ] Identificar componentes que precisam de modernização
- [ ] Planejar estrutura de classes Tailwind consistente

#### **Durante as Edições:**
- [ ] Usar MultiEdit para mudanças consistentes
- [ ] Manter padrões de nomenclatura (primary, zinc, muted-foreground)
- [ ] Preservar funcionalidade existente

#### **Após as Edições (OBRIGATÓRIO):**
- [ ] Executar `npm run check` para validar TypeScript
- [ ] Verificar estrutura JSX está completa
- [ ] Testar `npm run dev` para confirmar sem erros
- [ ] Validar se aplicação carrega corretamente

### **Padrões de Modernização Aplicados**

#### **Layout Moderno:**
```typescript
// Container padrão
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

// Background gradient
<div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">

// Header sticky
<header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
```

#### **Componentes Modernizados:**
```typescript
// Cards com sombras suaves
<Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">

// Botões modernos
<Button className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95">

// Tabs com estado ativo
<TabsTrigger className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
```

#### **Cores e Tipografia:**
```typescript
// Texto principal: text-zinc-800
// Texto secundário: text-muted-foreground
// Títulos: text-xl font-semibold
// Botões primários: bg-primary text-white
// Bordas: border-muted
```

### **Comandos de Validação Essenciais**

```bash
# Validar TypeScript (SEMPRE após edições)
npm run check

# Testar desenvolvimento
npm run dev

# Verificar se API responde
curl -s http://localhost:3000/api/vehicles | head -c 100

# Listar scripts disponíveis
npm run
```

### **Arquivos Modernizados (Referência)**
- ✅ `/client/src/pages/VehicleComparison.tsx`
- ✅ `/client/src/pages/AdminUsers.tsx`
- ✅ `/client/src/pages/Analytics.tsx`
- ✅ `/client/src/pages/VehicleApproval.tsx`
- ✅ `/client/src/pages/Settings.tsx`
- ✅ `/client/src/pages/Help.tsx`

### **Notas Importantes**
- **MultiEdit**: Ferramenta poderosa mas requer validação imediata
- **JSX Structure**: Sempre verificar fechamento de tags após edições massivas
- **TypeScript**: `npm run check` é obrigatório antes de deploy
- **Consistência**: Manter padrões de cores e espaçamento em todas as páginas

## 🚨 Lições Aprendidas - Correção de Erros JSX e Estrutura (17/07/2025)

### **Problemas Identificados e Soluções**

#### **1. Erro de Sintaxe JSX - Desequilíbrio de Tags**
```typescript
// ❌ PROBLEMA: Divs não balanceados após MultiEdit
<div className="relative group">
  <Avatar>...</Avatar>
  
  <button>...</button>
  <input>...</input>
  </div>  // <- div extra aqui
</div>    // <- fechamento duplicado

// ✅ SOLUÇÃO: Contar sistematicamente divs de abertura/fechamento
grep -o '<div' arquivo.tsx | wc -l  # Contar aberturas
grep -o '</div>' arquivo.tsx | wc -l # Contar fechamentos
```

#### **2. Erro de Parser Babel/Vite - Estrutura JSX Incorreta**
```bash
# ❌ ERRO: Unexpected token, expected "," (247:6)
# Causa: Estrutura JSX mal formada após edições

# ✅ SOLUÇÃO: Verificar contexto completo da estrutura
sed -n '240,250p' arquivo.tsx  # Examinar contexto ao redor do erro
```

#### **3. Indentação Inconsistente Após Edições**
```typescript
// ❌ PROBLEMA: Indentação incorreta quebrando parser
<div>
  <Avatar>
      <AvatarImage />  // <- indentação errada
      <AvatarFallback>  // <- indentação errada
  </Avatar>
</div>

// ✅ SOLUÇÃO: Manter indentação consistente
<div>
  <Avatar>
    <AvatarImage />    // <- indentação correta
    <AvatarFallback>   // <- indentação correta
  </Avatar>
</div>
```

### **Checklist de Diagnóstico - Erros JSX**

#### **Passo 1: Identificar Tipo de Erro**
```bash
# Verificar tipo de erro
npm run check                    # TypeScript errors
npm run dev                     # Runtime/Parser errors
npx tsc --noEmit arquivo.tsx    # Arquivo específico
```

#### **Passo 2: Diagnóstico Estrutural**
```bash
# Contar tags balanceadas
grep -o '<div' arquivo.tsx | wc -l     # Divs de abertura  
grep -o '</div>' arquivo.tsx | wc -l   # Divs de fechamento
grep -o '<.*>' arquivo.tsx | wc -l     # Todas as tags

# Verificar contexto do erro
sed -n 'LINHA_ERRO-5,LINHA_ERRO+5p' arquivo.tsx
```

#### **Passo 3: Verificar Estrutura JSX**
```bash
# Encontrar return statement
grep -n "return (" arquivo.tsx
awk '/return \(/ {start=NR} /^  \);/ {end=NR; print "Return: " start " to " end}' arquivo.tsx
```

### **Padrões de Correção**

#### **1. Balanceamento de Divs**
```typescript
// Sempre verificar que cada div tem fechamento
<div className="container">        // +1 div
  <div className="header">         // +1 div
    <div className="content">      // +1 div
    </div>                         // -1 div
  </div>                           // -1 div  
</div>                             // -1 div = 0 (balanceado)
```

#### **2. Indentação Correta**
```typescript
// Manter indentação consistente (2 espaços por nível)
<div className="level-0">
  <div className="level-1">
    <div className="level-2">
      <Component />
    </div>
  </div>
</div>
```

#### **3. Estrutura de Componentes**
```typescript
// Sempre fechar componentes React adequadamente
<Avatar className="...">
  <AvatarImage src="..." />
  <AvatarFallback>Content</AvatarFallback>
</Avatar>
```

### **Comandos de Validação - Pós Correção**

```bash
# Validação obrigatória após correções
npm run check                    # 1. TypeScript válido
npm run dev                     # 2. Servidor inicia
timeout 5s npm run dev          # 3. Teste rápido startup

# Validação estrutural
grep -o '<div' arquivo.tsx | wc -l    # Verificar balance
grep -o '</div>' arquivo.tsx | wc -l  # Deve ser igual
```

### **Prevenção de Erros**

#### **Durante MultiEdit:**
- [ ] Sempre verificar estrutura JSX após mudanças massivas
- [ ] Contar divs de abertura/fechamento
- [ ] Manter indentação consistente
- [ ] Testar arquivo específico: `npx tsc --noEmit arquivo.tsx`

#### **Sinais de Alerta:**
- Erro "Unexpected token, expected ','"
- Erro "Declaration or statement expected"
- Contador de divs desequilibrado
- Parser Babel/Vite falhando

#### **Ferramentas de Debug:**
```bash
# Análise estrutural
sed -n 'LINHA-10,LINHA+10p' arquivo.tsx  # Contexto do erro
cat -A arquivo.tsx | grep -n LINHA       # Caracteres ocultos
hexdump -C arquivo.tsx | head -20        # Análise binária
```

### **Notas Importantes**
- **MultiEdit**: Sempre validar estrutura JSX após edições massivas
- **Indentação**: Manter consistência para evitar erros de parser
- **Balance**: Divs desequilibrados causam erros de sintaxe
- **Testing**: `npm run check` é obrigatório antes de deploy

---

*Última atualização: 2025-07-17*
*Versão Claude: Sonnet 4*