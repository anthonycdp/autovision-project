import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  timestamp, 
  decimal,
  varchar,
  uuid,
  pgEnum,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// CKDEV-NOTE: Database enums ensure data consistency and type safety
export const userTypeEnum = pgEnum("user_type", ["admin", "common"]);
// CKDEV-TODO: Add "manager" role for future hierarchical permissions
export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "reserved", "sold"]);
export const vehicleApprovalStatusEnum = pgEnum("vehicle_approval_status", ["pending", "approved", "rejected"]);

// CKDEV-NOTE: Vehicle characteristics enums for enhanced filtering and data integrity
export const transmissionTypeEnum = pgEnum("transmission_type", ["manual", "automatic", "cvt", "semi_automatic"]);
export const fuelTypeEnum = pgEnum("fuel_type", ["gasoline", "ethanol", "flex", "diesel", "electric", "hybrid"]);

// CKDEV-NOTE: Document management enums for file types and status
export const documentStatusEnum = pgEnum("document_status", ["active", "draft", "archived"]);
export const documentCategoryEnum = pgEnum("document_category", ["contract", "invoice", "certificate", "manual", "other"]);

// CKDEV-NOTE: Session table for connect-pg-simple session store
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)], // CKDEV-NOTE: Index for efficient session cleanup
);

// CKDEV-NOTE: Users table with UUID primary key for scalability
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(), // CKDEV-NOTE: Email uniqueness enforced at DB level
  passwordHash: varchar("password_hash", { length: 255 }).notNull(), // CKDEV-NOTE: bcrypt hash storage
  type: userTypeEnum("type").notNull().default("common"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CKDEV-NOTE: Core vehicles table with approval workflow and audit fields
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  fabricateYear: integer("fabricate_year").notNull(),
  modelYear: integer("model_year").notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  km: integer("km").notNull(),
  // CKDEV-QUESTION: Should price be stored as integer cents for precision?
  price: varchar("price", { length: 20 }).notNull(),
  // CKDEV-NOTE: New vehicle characteristics for enhanced filtering and search
  transmissionType: transmissionTypeEnum("transmission_type").notNull().default("manual"),
  fuelType: fuelTypeEnum("fuel_type").notNull().default("flex"),
  licensePlate: varchar("license_plate", { length: 10 }), // CKDEV-NOTE: Brazilian license plate format ABC-1234 or AAA1B23
  status: vehicleStatusEnum("status").notNull().default("available"),
  approvalStatus: vehicleApprovalStatusEnum("approval_status").notNull().default("pending"),
  description: text("description"),
  imageURLs: jsonb("image_urls").$type<string[]>().default([]), // CKDEV-NOTE: Array of image URLs as JSONB
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id), // CKDEV-NOTE: Tracks who added the vehicle
  approvedBy: uuid("approved_by").references(() => users.id), // CKDEV-NOTE: Tracks admin approval
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CKDEV-NOTE: Activity logs for security auditing and user behavior tracking
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // CKDEV-NOTE: CREATE, UPDATE, DELETE, LOGIN, etc.
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // CKDEV-NOTE: vehicle, user, etc.
  resourceId: uuid("resource_id"), // CKDEV-NOTE: ID of the affected resource
  details: jsonb("details"), // CKDEV-NOTE: Additional context as JSON
  ipAddress: varchar("ip_address", { length: 45 }), // CKDEV-NOTE: IPv6 compatible length
  userAgent: varchar("user_agent", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CKDEV-NOTE: Vehicle-specific change history for detailed audit trail
export const vehicleHistory = pgTable("vehicle_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  changes: jsonb("changes"), // CKDEV-NOTE: Before/after values for change tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CKDEV-NOTE: Documents table for file management and document tracking
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // CKDEV-NOTE: File extension (pdf, docx, etc.)
  size: integer("size").notNull(), // CKDEV-NOTE: File size in bytes
  filePath: varchar("file_path", { length: 500 }).notNull(), // CKDEV-NOTE: Path to stored file
  category: documentCategoryEnum("category").notNull().default("other"),
  status: documentStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CKDEV-NOTE: Drizzle relations enable type-safe joins and eager loading
export const vehicleRelations = relations(vehicles, ({ one, many }) => ({
  createdBy: one(users, { fields: [vehicles.createdBy], references: [users.id] }),
  approvedBy: one(users, { fields: [vehicles.approvedBy], references: [users.id] }),
  history: many(vehicleHistory), // CKDEV-NOTE: Access vehicle change history
}));

export const userRelations = relations(users, ({ many }) => ({
  createdVehicles: many(vehicles, { relationName: "createdBy" }),
  approvedVehicles: many(vehicles, { relationName: "approvedBy" }),
  activityLogs: many(activityLogs),
  vehicleHistory: many(vehicleHistory),
  documents: many(documents),
}));

export const documentRelations = relations(documents, ({ one }) => ({
  createdBy: one(users, { fields: [documents.createdBy], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  passwordHash: true,
  type: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  make: true,
  model: true,
  fabricateYear: true,
  modelYear: true,
  color: true,
  km: true,
  price: true,
  transmissionType: true, // CKDEV-NOTE: New field for transmission type
  fuelType: true, // CKDEV-NOTE: New field for fuel type
  licensePlate: true, // CKDEV-NOTE: New field for license plate
  status: true,
  description: true,
});

export const updateVehicleSchema = insertVehicleSchema.partial().extend({
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  approvedBy: z.string().uuid().optional().nullable(),
  approvedAt: z.date().optional().nullable(),
});

export const vehicleFiltersSchema = z.object({
  make: z.string().transform(val => val === "" ? undefined : val).optional(),
  model: z.string().transform(val => val === "" ? undefined : val).optional(),
  status: z.string().transform(val => val === "" ? undefined : val).optional().refine(val => val === undefined || ["available", "reserved", "sold"].includes(val), "Invalid status"),
  approvalStatus: z.string().transform(val => val === "" ? undefined : val).optional().refine(val => val === undefined || ["pending", "approved", "rejected"].includes(val), "Invalid approval status"),
  minYear: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  maxYear: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  minPrice: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  maxPrice: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  minKm: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  maxKm: z.string().transform(val => val === "" ? undefined : Number(val)).optional(),
  color: z.string().transform(val => val === "" ? undefined : val).optional(),
  search: z.string().transform(val => val === "" ? undefined : val).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  name: true,
  originalName: true,
  type: true,
  size: true,
  filePath: true,
  category: true,
  status: true,
});

export const updateDocumentSchema = insertDocumentSchema.partial().omit({ filePath: true, size: true });

export const documentFiltersSchema = z.object({
  category: z.string().transform(val => val === "" ? undefined : val).optional(),
  status: z.string().transform(val => val === "" ? undefined : val).optional(),
  search: z.string().transform(val => val === "" ? undefined : val).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

// CKDEV-NOTE: TypeScript types inferred from Drizzle schemas for consistency
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type VehicleHistory = typeof vehicleHistory.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type DocumentFilters = z.infer<typeof documentFiltersSchema>;
