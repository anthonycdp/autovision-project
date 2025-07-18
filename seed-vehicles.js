import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { vehicles } from './shared/schema.ts';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/autovision'
});
const db = drizzle(pool);

const sampleVehicles = [
  {
    make: 'Fiat',
    model: 'Strada Adventure',
    fabricateYear: 2022,
    modelYear: 2023,
    color: 'Branco',
    km: 15000,
    price: '89900.00',
    transmissionType: 'manual',
    fuelType: 'flex',
    licensePlate: 'ABC-1234',
    status: 'available',
    approvalStatus: 'approved',
    description: 'Pickup compacta em excelente estado, única dona, revisões em dia na concessionária autorizada. Ar condicionado, direção hidráulica, vidros elétricos.',
    imageURLs: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80',
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80'
    ]
  },
  {
    make: 'Volkswagen',
    model: 'Polo Comfortline',
    fabricateYear: 2021,
    modelYear: 2021,
    color: 'Prata',
    km: 28500,
    price: '75800.00',
    transmissionType: 'automatic',
    fuelType: 'flex',
    licensePlate: 'DEF-5678',
    status: 'available',
    approvalStatus: 'approved',
    description: 'Hatch premium com baixa quilometragem, segunda dona, manual e chave reserva. Central multimídia, ar digital, sensor de estacionamento.',
    imageURLs: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&q=80'
    ]
  },
  {
    make: 'Chevrolet',
    model: 'Onix Premier',
    fabricateYear: 2023,
    modelYear: 2023,
    color: 'Preto',
    km: 8200,
    price: '82500.00',
    transmissionType: 'automatic',
    fuelType: 'flex',
    licensePlate: 'GHI-9012',
    status: 'reserved',
    approvalStatus: 'approved',
    description: 'Seminovo com garantia de fábrica, topo de linha com todos os opcionais. MyLink, câmera de ré, controle de estabilidade.',
    imageURLs: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
      'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&q=80',
      'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&q=80',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=800&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80'
    ]
  },
  {
    make: 'Renault',
    model: 'Kwid Intense',
    fabricateYear: 2020,
    modelYear: 2020,
    color: 'Vermelho',
    km: 42000,
    price: '58900.00',
    transmissionType: 'manual',
    fuelType: 'flex',
    licensePlate: 'JKL-3456',
    status: 'available',
    approvalStatus: 'approved',
    description: 'Econômico e confiável, ideal para cidade. Ar condicionado, direção elétrica, computador de bordo. Ótimo custo-benefício.',
    imageURLs: [
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
      'https://images.unsplash.com/photo-1617469165786-8007eda21945?w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80'
    ]
  },
  {
    make: 'Hyundai',
    model: 'HB20 Evolution',
    fabricateYear: 2022,
    modelYear: 2022,
    color: 'Azul',
    km: 18700,
    price: '71200.00',
    transmissionType: 'automatic',
    fuelType: 'flex',
    licensePlate: 'MNO-7890',
    status: 'available',
    approvalStatus: 'approved',
    description: 'Compacto moderno com tecnologia avançada. Central multimídia com Android Auto/Apple CarPlay, ar automático, freio ABS.',
    imageURLs: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80',
      'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&q=80',
      'https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&q=80'
    ]
  }
];

async function seedVehicles() {
  try {
    console.log('🌱 Inserindo veículos de amostra...');
    
    for (const vehicle of sampleVehicles) {
      await db.insert(vehicles).values(vehicle);
      console.log(`✅ Inserido: ${vehicle.make} ${vehicle.model}`);
    }
    
    console.log('🎉 Todos os veículos foram inseridos com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inserir veículos:', error);
    process.exit(1);
  }
}

seedVehicles();