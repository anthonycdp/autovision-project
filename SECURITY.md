# 🔒 Guia de Segurança - Autovision

## Configuração Inicial

### 1. Variáveis de Ambiente

**❌ NUNCA faça:**
```bash
# Não commitar no Git
git add .env
git commit -m "Add environment variables"

# Não hardcodar chaves
const OPENAI_API_KEY = "sk-proj-abc123...";
```

**✅ Faça:**
```bash
# Copiar template
cp .env.example .env

# Gerar chaves seguras
openssl rand -base64 32

# Configurar .gitignore
echo ".env" >> .gitignore
```

### 2. Chaves de API

**Formato esperado:**
- `OPENAI_API_KEY`: `sk-proj-[48+ caracteres alfanuméricos]`
- `JWT_SECRET`: Mínimo 32 caracteres aleatórios
- `SESSION_SECRET`: Mínimo 32 caracteres aleatórios

**Validação automática:**
```typescript
import { SecurityValidator } from './server/utils/validation';

// Validação automática no startup
SecurityValidator.validateEnvironmentVariables();
```

## Sistema de Logs

### Logs Seguros
```typescript
// ✅ Correto - dados sensíveis são filtrados automaticamente
logger.info('User login attempt', {
  email: 'user@example.com',
  password: 'secret123', // Será automaticamente [REDACTED]
  token: 'jwt-token'      // Será automaticamente [REDACTED]
});

// ✅ Logs estruturados
logger.logApiRequest(req, res, responseTime);
logger.logOpenAIRequest('generateDescription', success, error);
```

### Localização dos Logs
```
logs/
├── app-2024-01-15.log      # Log atual
├── app-2024-01-15.1.log    # Rotacionado
├── app-2024-01-15.2.log    # Rotacionado
└── ...
```

## Validação de Entrada

### Schemas Zod
```typescript
import { vehicleDescriptionInputSchema } from './server/utils/validation';

// Validação automática
app.post('/api/vehicles/generate-description-preview', 
  validateVehicleDescriptionInput, // Middleware de validação
  async (req, res) => {
    // req.body já validado e sanitizado
  }
);
```

### Proteção contra Ataques
```typescript
// Detecção automática de padrões maliciosos
SecurityValidator.containsSQLInjection(input); // SQL Injection
SecurityValidator.containsXSS(input);          // Cross-Site Scripting
SecurityValidator.sanitizeText(input);         // Sanitização automática
```

## Rate Limiting

### Configuração
```typescript
// Middleware de rate limiting
app.use('/api/vehicles/generate-description-preview', 
  validateRateLimit // Limita requisições por IP
);
```

### Limites Padrão
- **Desenvolvimento**: 100 requests/15 minutos
- **Produção**: 50 requests/15 minutos

## Tratamento de Timeouts

### OpenAI API
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 segundos
  maxRetries: 3,  // 3 tentativas
});

// Timeout customizado
const response = await Promise.race([
  openai.chat.completions.create({...}),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 30000)
  )
]);
```

### Fallback Robusto
```typescript
// Sempre retorna conteúdo, mesmo com falha na IA
try {
  return await openai.generateDescription(data);
} catch (error) {
  logger.error('OpenAI failed', error);
  return generateFallbackDescription(data); // Fallback local
}
```

## Monitoramento

### Métricas Importantes
```typescript
// Tempo de resposta
const startTime = Date.now();
const response = await generateDescription(data);
const responseTime = Date.now() - startTime;

// Logs estruturados
logger.info('Description generated', {
  responseTime: `${responseTime}ms`,
  tokenCount: response.usage?.total_tokens,
  fallbackUsed: !process.env.OPENAI_API_KEY
});
```

### Alertas
- **Erro 500**: Falha na geração de descrição
- **Timeout**: API demorou mais de 30 segundos
- **Rate Limit**: Muitas requisições de um IP
- **Chave inválida**: API Key com formato incorreto

## Configuração de Produção

### Variáveis de Ambiente
```bash
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
MAX_FILE_SIZE_MB=5
CORS_ORIGIN=https://yourdomain.com
```

### Nginx (Proxy Reverso)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
    
    location /api/vehicles/generate-description-preview {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### PM2 (Process Manager)
```json
{
  "name": "autovision",
  "script": "server/index.ts",
  "interpreter": "tsx",
  "env": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "warn"
  },
  "log_file": "logs/pm2.log",
  "error_file": "logs/pm2-error.log",
  "max_memory_restart": "1G",
  "instances": "max",
  "exec_mode": "cluster"
}
```

## Checklist de Segurança

### Pré-Deploy
- [ ] Arquivo `.env` não commitado
- [ ] Chaves API têm formato válido
- [ ] Logs não contêm informações sensíveis
- [ ] Validações de entrada implementadas
- [ ] Rate limiting configurado
- [ ] Timeouts configurados
- [ ] Fallbacks testados

### Pós-Deploy
- [ ] HTTPS configurado
- [ ] WAF (Web Application Firewall) ativo
- [ ] Monitoramento de logs implementado
- [ ] Alertas configurados
- [ ] Backup de logs configurado
- [ ] Rotação de chaves planejada
- [ ] Testes de penetração realizados
- [ ] 2FA para administradores

## Comandos Úteis

```bash
# Verificar logs em tempo real
tail -f logs/app-$(date +%Y-%m-%d).log

# Verificar variáveis de ambiente
npm run check-env

# Executar testes de segurança
npm run test:security

# Verificar dependências vulneráveis
npm audit

# Corrigir dependências vulneráveis
npm audit fix

# Gerar nova chave JWT
openssl rand -base64 32

# Verificar formato de chave OpenAI
echo "sk-proj-abc123..." | grep -E '^sk-[a-zA-Z0-9]{48,}$'
```

## Contato para Incidentes

Em caso de incidente de segurança:
1. **Documentar** o incidente nos logs
2. **Isolar** o sistema se necessário
3. **Notificar** a equipe de segurança
4. **Investigar** a causa raiz
5. **Implementar** correções
6. **Monitorar** para recorrência

---

**Última atualização:** 2024-01-15  
**Versão:** 1.0.0  
**Responsável:** Equipe de Segurança Autovision