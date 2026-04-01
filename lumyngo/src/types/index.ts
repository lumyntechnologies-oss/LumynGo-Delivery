export type Role = "CUSTOMER" | "RIDER" | "ADMIN";
export type VehicleType = "BICYCLE" | "MOTORCYCLE" | "CAR" | "VAN";
export type RiderStatus = "ONLINE" | "OFFLINE" | "BUSY";
export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PICKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  riderProfile?: RiderProfile | null;
}

export interface RiderProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  license: string;
  status: RiderStatus;
  currentLat?: number | null;
  currentLng?: number | null;
}

export interface Order {
  id: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  status: OrderStatus;
  price: number;
  distance: number;
  notes?: string | null;
  customerId: string;
  riderId?: string | null;
  promoCodeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: User;
  rider?: User | null;
  payment?: Payment | null;
  ratings?: Rating[];
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  pesapalRef?: string | null;
  transactionId?: string | null;
  createdAt: Date;
}

export interface Rating {
  id: string;
  orderId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string | null;
  createdAt: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  isPercent: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  riderId: string;
}

export interface PriceEstimate {
  distance: number;
  price: number;
  breakdown: {
    baseFare: number;
    distanceCharge: number;
    surgeMultiplier: number;
  };
}

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  activeRiders: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
}
