/** Delivery legs live in `lib/deliveryStatus` so admin, email and tracking agree. */
import type { DeliveryStatus } from "@/lib/deliveryStatus";
export type { DeliveryStatus };

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  origin: "Korea" | "Dubai" | "Other";
  description?: string;
  active: boolean;
}

export interface ProductVariant {
  name: string;
  price: number;
}

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
  brand?: string;
  tags: string[];
  concerns: string[];
  variants?: ProductVariant[];
  active?: boolean;
  isPreOrder?: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  productId?: string;
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
  /** Epoch ms when this line was added — used to expire pre-order bag items after 24h. */
  addedAt?: number;
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
  /** Total saved against compare-at prices (reporting only, not deducted). */
  savings?: number;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  orderType: "standard" | "subscription";
  shippingAddress: {
    line1: string;
    line2?: string;
    district: string;
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

export interface DeliveryEvent {
  status: DeliveryStatus;
  note?: string;
  at: string;
}

export type PreOrderStatus =
  | "pending"
  | "reviewing"
  | "availability"
  | "confirmed"
  | "rejected"
  | "fulfilled"
  | "done";

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

export interface PreOrderPriceChange {
  previousUnitPrice?: number;
  newUnitPrice: number;
  reason: string;
  changedAt: string;
}

export interface PreOrderItem {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  /** Shop compare-at price when the item came from the bag. */
  comparePrice?: number;
  /** First quoted unit price — kept even after revisions. */
  originalUnitPrice?: number;
  priceHistory?: PreOrderPriceChange[];
  availability?: "available" | "unavailable";
}

export interface PreOrder {
  _id: string;
  requestNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  items: PreOrderItem[];
  // Legacy single-product fields (mirror the first item, kept for older records)
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
  balancePaymentMethod?: "cod" | "bank";
  depositPaid?: boolean;
  shippingAddress?: {
    district: string;
    city: string;
  };
  shippingFee?: number;
  deliveryStatus?: DeliveryStatus;
  deliveryEvents?: DeliveryEvent[];
  trackingToken?: string;
  estimatedDeliveryDate?: string;
  estimatedDeliveryMessage?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Beauty assistant (chat)                                            */
/* ------------------------------------------------------------------ */

/** One plain-text turn, kept in the browser and replayed to the model. */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** Product cards with working Add to Cart buttons. */
export interface ChatProductsBlock {
  kind: "products";
  productIds: string[];
  reason?: string;
}

/** A "we don't stock this yet — ask us to bring it in" card. */
export interface ChatRequestBlock {
  kind: "request";
  productName: string;
  brand?: string;
  category?: string;
  concern?: string;
  reason?: string;
}

/** A button that navigates somewhere on this site. */
export interface ChatLinkBlock {
  kind: "link";
  path: string;
  label: string;
}

export type ChatBlock = ChatProductsBlock | ChatRequestBlock | ChatLinkBlock;

/** A rendered message in the chat panel. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  blocks?: ChatBlock[];
  /** Object URL of an image the shopper attached, for the outgoing bubble. */
  imagePreview?: string;
  error?: boolean;
}

export type ProductRequestStatus = "pending" | "sourcing" | "added" | "declined";

export interface ProductRequest {
  _id: string;
  productName: string;
  brand?: string;
  category?: string;
  concern?: string;
  reason?: string;
  images?: string[];
  customerMessage?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;
  source: "chat" | "manual";
  status: ProductRequestStatus;
  requestCount: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}
