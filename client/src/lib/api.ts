import { queryClient } from "./queryClient";

const API_BASE_URL = "/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // CKDEV-NOTE: Initialize tokens from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // CKDEV-NOTE: Refresh token from localStorage on each request to handle updates
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem("accessToken");
      this.refreshToken = localStorage.getItem("refreshToken");
    }
    
    console.log('ApiClient.request:', { endpoint, hasToken: !!this.accessToken });
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as any).Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh
    if (response.status === 403 && this.refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken } = await refreshResponse.json();
          this.setTokens(accessToken, refreshToken);
          
          // Retry original request with new token
          (headers as any).Authorization = `Bearer ${accessToken}`;
          response = await fetch(url, { ...options, headers });
        } else {
          this.clearTokens();
          window.location.href = "/login";
          throw new Error("Sessão expirada. Faça login novamente.");
        }
      } catch (error) {
        this.clearTokens();
        window.location.href = "/login";
        throw error;
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async getMe() {
    return this.request<any>("/auth/me");
  }

  logout() {
    this.clearTokens();
  }

  // User methods
  async getUsers() {
    return this.request<any[]>("/users");
  }

  async createUser(userData: any) {
    return this.request<any>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<void>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Vehicle methods
  async getVehicles(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    return this.request<{ vehicles: any[]; total: number }>(`/vehicles?${params}`);
  }

  async getVehicle(id: string) {
    return this.request<any>(`/vehicles/${id}`);
  }

  async createVehicle(vehicleData: any) {
    return this.request<any>("/vehicles", {
      method: "POST",
      body: JSON.stringify(vehicleData),
    });
  }

  async updateVehicle(id: string, vehicleData: any) {
    return this.request<any>(`/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(vehicleData),
    });
  }

  async deleteVehicle(id: string) {
    return this.request<void>(`/vehicles/${id}`, {
      method: "DELETE",
    });
  }

  async uploadVehicleImages(id: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const url = `${API_BASE_URL}/vehicles/${id}/images`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  // Statistics methods
  async getStats() {
    return this.request<any>("/stats");
  }

  async getVehiclesByStatus() {
    return this.request<any>("/stats/vehicles-by-status");
  }

  async getSalesData() {
    return this.request<any>("/stats/sales");
  }

  // CKDEV-NOTE: Get distinct vehicle brands for dynamic dropdown
  async getVehicleBrands() {
    return this.request<Array<{ make: string; count: number }>>("/marcas");
  }

  // Document methods
  async getDocuments(filters: any = {}) {
    console.log('ApiClient.getDocuments called with filters:', filters);
    console.log('Current accessToken:', this.accessToken ? 'Present' : 'Missing');
    
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    try {
      const result = await this.request<{ documents: any[]; total: number }>(`/documents?${params}`);
      console.log('ApiClient.getDocuments result:', result);
      return result;
    } catch (error) {
      console.error('ApiClient.getDocuments error:', error);
      throw error;
    }
  }

  async getDocument(id: string) {
    return this.request<any>(`/documents/${id}`);
  }

  async createDocument(documentData: any) {
    return this.request<any>("/documents", {
      method: "POST",
      body: JSON.stringify(documentData),
    });
  }

  async updateDocument(id: string, documentData: any) {
    return this.request<any>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(documentData),
    });
  }

  async deleteDocument(id: string) {
    return this.request<void>(`/documents/${id}`, {
      method: "DELETE",
    });
  }

  async uploadDocument(file: File, category: string = 'other', status: string = 'active') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('status', status);

    const url = `${API_BASE_URL}/documents/upload`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(errorData.message || `Erro ${response.status}`);
    }

    return response.json();
  }

  async downloadDocument(id: string) {
    const url = `${API_BASE_URL}/documents/${id}/download`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `document_${id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  // CKDEV-NOTE: Get current access token for react-pdf authentication
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem("accessToken");
    }
    return this.accessToken;
  }

  // CKDEV-NOTE: Get document URL with authentication token for react-pdf
  getDocumentUrl(id: string): string {
    if (this.accessToken) {
      return `${API_BASE_URL}/documents/${id}/download?token=${encodeURIComponent(this.accessToken)}`;
    }
    return `${API_BASE_URL}/documents/${id}/download`;
  }

  // CKDEV-NOTE: Open document in new tab with authentication
  async openDocumentInNewTab(id: string) {
    if (!this.accessToken) {
      throw new Error('Token de acesso requerido');
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Open in new tab error:', error);
      throw error;
    }
  }
}

export const api = new ApiClient();
