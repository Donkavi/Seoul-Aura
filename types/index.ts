export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  origin: "Korea" | "Dubai" | "Other";
  type: string;
  subtype: string;
  images: string[];
  stock: number;
  tags: string[];
  concerns: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  images: string[];
  isApproved: boolean;
  isVerifiedBuyer: boolean;
  flagged: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  type: string;
  slug: string;
  subtypes: Array<{ name: string; slug: string }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  origin: "Korea" | "Dubai" | "Mixed" | "Other";
  items: string[];
  featured: boolean;
  active: boolean;
  badge?: string;
  order: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  orderType: "standard" | "subscription";
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
  createdAt: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingReviews: number;
  pendingPreOrders: number;
}

export type PreOrderStatus =
  | "pending"
  | "reviewing"
  | "confirmed"
  | "rejected"
  | "fulfilled";

export interface StockNotification {
  _id: string;
  productId: string;
  productName: string;
  email: string;
  name?: string;
  status: "pending" | "notified" | "expired";
  notifiedAt?: string;
  createdAt: string;
}

export interface Concern {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  _id?: string;
  heading: string;
  links: NavLink[];
}

export interface NavFeature {
  title: string;
  description: string;
  image: string;
  href: string;
  cta: string;
}

export interface NavMenuItem {
  _id: string;
  label: string;
  href: string;
  highlight: boolean;
  order: number;
  columns: NavColumn[];
  feature?: NavFeature;
}

export interface Subscription {
  _id: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  planId: string;
  planName: string;
  planPrice: number;
  origin: "Korea" | "Dubai" | "Mixed" | "Other";
  status: "active" | "paused" | "cancelled";
  startDate: string;
  nextBillingDate: string;
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
  };
  notes?: string;
  createdAt: string;
}

export interface PreOrder {
  _id: string;
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  productBrand: string;
  productName: string;
  productLink?: string;
  quantity: number;
  origin?: "Korea" | "Dubai" | "Other";
  notes?: string;
  status: PreOrderStatus;
  estimatedPrice?: number;
  estimatedAvailability?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
