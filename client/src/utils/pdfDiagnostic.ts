// CKDEV-NOTE: Comprehensive PDF diagnostic utilities for troubleshooting upload and preview issues
export interface PDFDiagnosticResult {
  isValid: boolean;
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
  bufferInfo: {
    byteLength: number;
    hasValidPDFHeader: boolean;
    hasValidPDFFooter: boolean;
  };
  errors: string[];
  warnings: string[];
  timestamp: number;
}

export async function diagnosticPDFFile(file: File): Promise<PDFDiagnosticResult> {
  const result: PDFDiagnosticResult = {
    isValid: true,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
    bufferInfo: {
      byteLength: 0,
      hasValidPDFHeader: false,
      hasValidPDFFooter: false,
    },
    errors: [],
    warnings: [],
    timestamp: Date.now(),
  };

  try {
    // Basic file validation
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      result.errors.push('Arquivo não é um PDF válido');
      result.isValid = false;
    }

    if (file.size === 0) {
      result.errors.push('Arquivo está vazio');
      result.isValid = false;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      result.warnings.push('Arquivo muito grande (>50MB), pode causar problemas de performance');
    }

    // Read file buffer for detailed analysis
    const arrayBuffer = await file.arrayBuffer();
    result.bufferInfo.byteLength = arrayBuffer.byteLength;

    // Check PDF headers and footers
    const uint8Array = new Uint8Array(arrayBuffer);
    const headerBytes = uint8Array.slice(0, 8);
    const footerBytes = uint8Array.slice(-10);

    // PDF should start with %PDF-
    const headerString = new TextDecoder().decode(headerBytes);
    result.bufferInfo.hasValidPDFHeader = headerString.startsWith('%PDF-');

    if (!result.bufferInfo.hasValidPDFHeader) {
      result.errors.push('Arquivo não possui cabeçalho PDF válido');
      result.isValid = false;
    }

    // PDF should end with %%EOF
    const footerString = new TextDecoder().decode(footerBytes);
    result.bufferInfo.hasValidPDFFooter = footerString.includes('%%EOF');

    if (!result.bufferInfo.hasValidPDFFooter) {
      result.warnings.push('Arquivo pode estar truncado ou corrompido (sem %%EOF)');
    }

    // Additional validations
    if (result.bufferInfo.byteLength !== file.size) {
      result.errors.push('Tamanho do buffer não corresponde ao tamanho do arquivo');
      result.isValid = false;
    }

  } catch (error) {
    result.errors.push(`Erro ao analisar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    result.isValid = false;
  }

  return result;
}

export function logPDFDiagnostic(result: PDFDiagnosticResult): void {
  console.group('🔍 PDF Diagnostic Report');
  console.log('📄 File Info:', result.fileInfo);
  console.log('📊 Buffer Info:', result.bufferInfo);
  
  if (result.errors.length > 0) {
    console.error('❌ Errors:', result.errors);
  }
  
  if (result.warnings.length > 0) {
    console.warn('⚠️ Warnings:', result.warnings);
  }
  
  console.log('✅ Valid:', result.isValid);
  console.log('⏰ Timestamp:', new Date(result.timestamp).toISOString());
  console.groupEnd();
}

export interface PDFLoadDiagnostic {
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  numPages?: number;
}

export class PDFLoadMonitor {
  private diagnostics: PDFLoadDiagnostic[] = [];

  startLoad(url: string): PDFLoadDiagnostic {
    const diagnostic: PDFLoadDiagnostic = {
      url,
      startTime: Date.now(),
      success: false,
    };
    
    this.diagnostics.push(diagnostic);
    console.log(`🚀 Starting PDF load: ${url}`);
    
    return diagnostic;
  }

  completeLoad(diagnostic: PDFLoadDiagnostic, success: boolean, numPages?: number, error?: string): void {
    diagnostic.endTime = Date.now();
    diagnostic.duration = diagnostic.endTime - diagnostic.startTime;
    diagnostic.success = success;
    diagnostic.numPages = numPages;
    diagnostic.error = error;

    if (success) {
      console.log(`✅ PDF loaded successfully in ${diagnostic.duration}ms (${numPages} pages)`);
    } else {
      console.error(`❌ PDF load failed after ${diagnostic.duration}ms: ${error}`);
    }
  }

  getDiagnostics(): PDFLoadDiagnostic[] {
    return [...this.diagnostics];
  }

  getAverageLoadTime(): number {
    const successful = this.diagnostics.filter(d => d.success && d.duration);
    if (successful.length === 0) return 0;
    
    const total = successful.reduce((sum, d) => sum + (d.duration || 0), 0);
    return total / successful.length;
  }

  getFailureRate(): number {
    if (this.diagnostics.length === 0) return 0;
    const failures = this.diagnostics.filter(d => !d.success).length;
    return (failures / this.diagnostics.length) * 100;
  }
}

export const pdfLoadMonitor = new PDFLoadMonitor();