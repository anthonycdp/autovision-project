export interface User {
  id: string;
  name: string;
  email: string;
  type: "admin" | "common";
  phone?: string;
  profileImageUrl?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  fabricateYear: number;
  modelYear: number;
  color: string;
  km: number;
  price: string;
  status: "available" | "reserved" | "sold";
  imageURLs: string[];
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  status?: "available" | "reserved" | "sold";
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface VehicleStats {
  totalVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  soldVehicles: number;
  averagePrice: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  type: "admin" | "common";
}

export interface CreateVehicle {
  make: string;
  model: string;
  fabricateYear: number;
  modelYear: number;
  color: string;
  km: number;
  price: string;
  status: "available" | "reserved" | "sold";
}
