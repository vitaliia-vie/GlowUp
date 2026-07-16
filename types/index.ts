export type UserRole = "client" | "master";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  phone?: string;
  // Master-only fields
  specialization?: string;
  createdAt: number;
}

export interface Service {
  id: string;
  masterId: string;
  title: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

export interface WorkingHours {
  // 0 = Sunday ... 6 = Saturday
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string; // "09:00"
  endTime: string; // "18:00"
}

export interface Availability {
  masterId: string;
  workingHours: WorkingHours[];
  exceptions: string[]; // ISO dates the master is off (vacation, sick day)
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  clientId: string;
  masterId: string;
  serviceId: string;
  date: string; // ISO date, e.g. "2026-07-20"
  timeSlot: string; // "14:30"
  status: BookingStatus;
  createdAt: number;
}

export interface PortfolioItem {
  id: string;
  masterId: string;
  imageUrl: string;
  caption?: string;
  createdAt: number;
}
