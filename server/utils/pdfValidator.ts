import fs from 'fs/promises';
import { logger } from './logger';

export interface PDFValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    fileSize: number;
    hasValidHeader: boolean;
    hasValidFooter: boolean;
    isPotentiallyCorrupted: boolean;
  };
}

export async function validatePDFFile(filePath: string): Promise<PDFValidationResult> {
  const result: PDFValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {
      fileSize: 0,
      hasValidHeader: false,
      hasValidFooter: false,
      isPotentiallyCorrupted: false,
    },
  };

  try {
    // Read file stats
    const stats = await fs.stat(filePath);
    result.metadata.fileSize = stats.size;

    // Check file size limits
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (stats.size > maxSize) {
      result.warnings.push(`Arquivo muito grande (${(stats.size / 1024 / 1024).toFixed(2)}MB). Tamanho máximo recomendado: 50MB`);
    }

    if (stats.size === 0) {
      result.errors.push('Arquivo está vazio');
      result.isValid = false;
      return result;
    }

    // Read file content for header/footer validation
    const buffer = await fs.readFile(filePath);
    
    // Check PDF header (should start with %PDF-)
    const headerBytes = buffer.slice(0, 8);
    const headerString = headerBytes.toString('ascii');
    result.metadata.hasValidHeader = headerString.startsWith('%PDF-');

    if (!result.metadata.hasValidHeader) {
      result.errors.push('Arquivo não possui cabeçalho PDF válido');
      result.isValid = false;
    }

    // Check PDF footer (should contain %%EOF)
    const footerBytes = buffer.slice(-1024); // Check last 1KB for %%EOF
    const footerString = footerBytes.toString('ascii');
    result.metadata.hasValidFooter = footerString.includes('%%EOF');

    if (!result.metadata.hasValidFooter) {
      result.warnings.push('Arquivo pode estar truncado (sem %%EOF no final)');
      result.metadata.isPotentiallyCorrupted = true;
    }

    // Basic corruption checks
    if (buffer.length !== stats.size) {
      result.errors.push('Tamanho do arquivo não corresponde aos dados lidos');
      result.isValid = false;
    }

    // Check for basic PDF structure
    const contentString = buffer.toString('ascii');
    const hasXref = contentString.includes('xref');
    const hasTrailer = contentString.includes('trailer');

    if (!hasXref || !hasTrailer) {
      result.warnings.push('Estrutura PDF possivelmente incompleta (faltando xref ou trailer)');
      result.metadata.isPotentiallyCorrupted = true;
    }

    // Extract PDF version if possible
    const versionMatch = headerString.match(/%PDF-(\d+\.\d+)/);
    if (versionMatch) {
      const version = parseFloat(versionMatch[1]);
      if (version < 1.0 || version > 2.0) {
        result.warnings.push(`Versão PDF incomum: ${version}`);
      }
    }

    logger.info('PDF validation completed', {
      filePath,
      isValid: result.isValid,
      fileSize: result.metadata.fileSize,
      hasValidHeader: result.metadata.hasValidHeader,
      hasValidFooter: result.metadata.hasValidFooter,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
    });

  } catch (error) {
    result.errors.push(`Erro ao validar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    result.isValid = false;
    
    logger.error('PDF validation failed', {
      filePath,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as any);
  }

  return result;
}

export function formatValidationErrors(result: PDFValidationResult): string {
  const messages: string[] = [];
  
  if (result.errors.length > 0) {
    messages.push(`Erros: ${result.errors.join(', ')}`);
  }
  
  if (result.warnings.length > 0) {
    messages.push(`Avisos: ${result.warnings.join(', ')}`);
  }
  
  return messages.join(' | ');
}