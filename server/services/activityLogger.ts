import { db } from "../db";
import { activityLogs, vehicleHistory, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { Request } from "express";

export interface LogActivityParams {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  req?: Request;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const { userId, action, resourceType, resourceId, details, req } = params;
    
    await db.insert(activityLogs).values({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.get('User-Agent'),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

export async function logVehicleHistory(params: {
  vehicleId: string;
  userId: string;
  action: string;
  changes?: any;
}) {
  try {
    await db.insert(vehicleHistory).values(params);
  } catch (error) {
    console.error("Error logging vehicle history:", error);
  }
}

export async function getUserActivityLogs(userId: string, limit: number = 50) {
  try {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    return [];
  }
}

export async function getVehicleHistory(vehicleId: string) {
  try {
    return await db
      .select({
        id: vehicleHistory.id,
        action: vehicleHistory.action,
        changes: vehicleHistory.changes,
        createdAt: vehicleHistory.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(vehicleHistory)
      .leftJoin(users, eq(vehicleHistory.userId, users.id))
      .where(eq(vehicleHistory.vehicleId, vehicleId))
      .orderBy(desc(vehicleHistory.createdAt));
  } catch (error) {
    console.error("Error fetching vehicle history:", error);
    return [];
  }
}