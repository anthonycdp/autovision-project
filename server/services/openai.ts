import OpenAI from "openai";
import { Vehicle } from "@shared/schema";
import { logger } from "../utils/logger";
import { SecurityValidator } from "../utils/validation";

// CKDEV-NOTE: Optional OpenAI integration - gracefully degrades to fallback methods
const openai = process.env.OPENAI_API_KEY && SecurityValidator.validateApiKey(process.env.OPENAI_API_KEY) ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds timeout
  maxRetries: 3,
}) : null; // CKDEV-NOTE: null when API key not provided or invalid - enables fallback mode

// CKDEV-NOTE: Fallback description generator - works without AI dependencies
function generateFallbackDescription(vehicleData: {
  make: string;
  model: string;
  fabricateYear: number;
  modelYear: number;
  color: string;
  km: number;
  price: string;
}): string {
  // CKDEV-NOTE: Simple heuristics to categorize vehicle characteristics
  const kmText = vehicleData.km < 50000 ? "baixa quilometragem" : "quilometragem dentro da média";
  const ageText = new Date().getFullYear() - vehicleData.modelYear <= 5 ? "modelo recente" : "modelo consolidado";
  
  return `${vehicleData.make} ${vehicleData.model} ${vehicleData.modelYear} na cor ${vehicleData.color.toLowerCase()}. 
Este veículo oferece excelente custo-benefício, sendo um ${ageText} com ${kmText} de apenas ${vehicleData.km.toLocaleString('pt-BR')} km rodados. 
O ${vehicleData.make} ${vehicleData.model} é conhecido por sua confiabilidade e economia de combustível. 
Veículo em bom estado de conservação, ideal para quem busca qualidade e segurança. 
Preço: R$ ${Number(vehicleData.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. 
Não perca esta oportunidade única! Entre em contato conosco para mais informações ou agendar uma visita.`;
}

// CKDEV-NOTE: Main vehicle description generator with AI-first, fallback-second approach
export async function generateVehicleDescription(vehicleData: {
  make: string;
  model: string;
  fabricateYear: number;
  modelYear: number;
  color: string;
  km: number;
  price: string;
}): Promise<string> {
  if (!openai) {
    console.log("OpenAI not configured, using fallback description generator");
    return generateFallbackDescription(vehicleData);
  }
  
  try {
    // CKDEV-NOTE: Input validation and sanitization
    const sanitizedData = {
      make: SecurityValidator.sanitizeText(vehicleData.make),
      model: SecurityValidator.sanitizeText(vehicleData.model),
      fabricateYear: vehicleData.fabricateYear,
      modelYear: vehicleData.modelYear,
      color: SecurityValidator.sanitizeText(vehicleData.color),
      km: vehicleData.km,
      price: vehicleData.price
    };

    const prompt = `Gere uma descrição atrativa e profissional para um veículo com as seguintes características:
    
    Marca: ${sanitizedData.make}
    Modelo: ${sanitizedData.model}
    Ano de Fabricação: ${sanitizedData.fabricateYear}
    Ano do Modelo: ${sanitizedData.modelYear}
    Cor: ${sanitizedData.color}
    Quilometragem: ${sanitizedData.km.toLocaleString('pt-BR')} km
    Preço: R$ ${Number(sanitizedData.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    
    A descrição deve:
    - Ser escrita em português brasileiro
    - Ter entre 100-200 palavras
    - Destacar as principais características e vantagens do veículo
    - Ser persuasiva mas honesta
    - Incluir aspectos sobre economia, conforto, segurança quando relevante
    - Ser adequada para um site de venda de veículos
    
    Não inclua informações que não foram fornecidas.`;

    logger.info('Iniciando geração de descrição OpenAI', {
      make: sanitizedData.make,
      model: sanitizedData.model,
      year: sanitizedData.fabricateYear
    });

    // CKDEV-NOTE: OpenAI API call with timeout and retry logic
    const startTime = Date.now();
    
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o-mini", // CKDEV-NOTE: More cost-effective model
        messages: [
          {
            role: "system",
            content: "Você é um especialista em redação para vendas de veículos. Crie descrições atrativas e profissionais que ajudem na venda de carros."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300, // CKDEV-NOTE: Limit to control costs and response length
        temperature: 0.7, // CKDEV-NOTE: Balance between creativity and consistency
      }),
      // CKDEV-NOTE: Custom timeout implementation
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout after 30 seconds')), 30000)
      )
    ]);

    const responseTime = Date.now() - startTime;
    
    logger.logOpenAIRequest('generateVehicleDescription', true, undefined, {
      responseTime: `${responseTime}ms`,
      model: 'gpt-4o-mini',
      tokenCount: (response as any).usage?.total_tokens
    });

    const description = (response as any).choices[0].message.content || "";
    
    if (!description || description.length < 50) {
      throw new Error('OpenAI returned empty or too short description');
    }

    return description;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // CKDEV-NOTE: Structured error logging
    logger.logOpenAIRequest('generateVehicleDescription', false, error instanceof Error ? error : new Error(errorMessage), {
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.fabricateYear
    });
    
    // CKDEV-NOTE: Graceful degradation - always provide content even when AI fails
    logger.info("OpenAI failed, using fallback description generator", {
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: errorMessage.substring(0, 200)
    });
    
    return generateFallbackDescription(vehicleData);
  }
}

// CKDEV-NOTE: Fallback comparison generator using simple sorting algorithms
function generateFallbackComparison(vehicles: Vehicle[]): string {
  // CKDEV-NOTE: Create multiple sorted views to find best options by different criteria
  const sortedByPrice = [...vehicles].sort((a, b) => Number(a.price) - Number(b.price));
  const sortedByKm = [...vehicles].sort((a, b) => a.km - b.km);
  const sortedByAge = [...vehicles].sort((a, b) => b.modelYear - a.modelYear);
  
  const cheapest = sortedByPrice[0];
  const lowestKm = sortedByKm[0];
  const newest = sortedByAge[0];
  
  return `Comparação dos veículos selecionados:

**Melhor Custo-Benefício**: ${cheapest.make} ${cheapest.model} ${cheapest.modelYear} - R$ ${Number(cheapest.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

**Menor Quilometragem**: ${lowestKm.make} ${lowestKm.model} ${lowestKm.modelYear} - ${lowestKm.km.toLocaleString('pt-BR')} km

**Mais Novo**: ${newest.make} ${newest.model} ${newest.modelYear}

**Análise Geral**: 
Os veículos apresentam características distintas. Para economia inicial, recomenda-se o ${cheapest.make} ${cheapest.model}. Para menor desgaste, o ${lowestKm.make} ${lowestKm.model} é ideal. Para tecnologia mais recente, o ${newest.make} ${newest.model} é a melhor opção.

Considere suas prioridades: economia, confiabilidade ou modernidade ao fazer sua escolha.`;
}

// CKDEV-NOTE: Vehicle comparison with AI analysis and fallback capability
export async function generateVehicleComparisonSummary(vehicles: Vehicle[]): Promise<string> {
  if (!openai) {
    console.log("OpenAI not configured, using fallback comparison generator");
    return generateFallbackComparison(vehicles);
  }
  
  try {
    const vehiclesSummary = vehicles.map(v => 
      `${v.make} ${v.model} ${v.modelYear} - R$ ${Number(v.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${v.km.toLocaleString('pt-BR')} km`
    ).join('\n');

    const prompt = `Compare os seguintes veículos e forneça um resumo das principais diferenças e vantagens de cada um:

${vehiclesSummary}

Forneça uma análise comparativa focando em:
- Custo-benefício
- Quilometragem
- Idade do veículo
- Recomendações para diferentes perfis de compradores

Responda em português brasileiro em até 200 palavras.`;

    // CKDEV-NOTE: AI-powered vehicle comparison with automotive expertise context
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // CKDEV-TODO: Monitor for model updates and performance improvements
      messages: [
        {
          role: "system",
          content: "Você é um consultor especialista em veículos que ajuda compradores a escolherem o melhor carro para suas necessidades."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating vehicle comparison:", error);
    
    // Handle quota exceeded error - use fallback
    if (error instanceof Error && error.message.includes('exceeded your current quota')) {
      console.log("OpenAI quota exceeded, using fallback comparison generator");
      return generateFallbackComparison(vehicles);
    }
    
    throw new Error("Failed to generate vehicle comparison");
  }
}