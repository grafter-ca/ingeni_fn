// src/types/api.ts

export type ProductFormData = {
  title: string;
  slug?: string;
  stock: number | string;
  price: number | string;
  description: string;
  location?: string;
  isActive?: boolean;
  images: string[];     // Existing image URLs
  imageFiles: File[];   // New files from input
  categoryId: string;
  vendorId: string;
};

export type ApiProduct = {
  id: string;
  origin?: "local" | "fake";
  title: string;
  slug: string;
  price: number | string;
  description: string;
  location?: string | null;
  stock: number;
  isActive: boolean;
  images: string[];
  imageFiles?: File[];
  category: ApiCategory;
  vendor?: ApiVendor;
  categoryId: string;
  vendorId: string;
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiCategory = {
  id: string;
  name: string;
  image: string;
  imageUrl?: string;
  description?: string;
  itemCount?: number;
  productsCount?: number;
};

export type ApiVendor = {
  id: string;
  storeName: string;
  email?: string;
  userId?: string;
  description?: string | null;
  businessDescription?: string | null;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  image?: string | null;
  isActive?: boolean;
};

export type UserRole = "user" | "admin" | "vendor";

// Auth types
export type ApiUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  country?: string | null;
  phone?: string | null;
  role?: UserRole | string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  image?: string;
};

export interface RegisterPayloadProps extends RegisterPayload {
  country: string;
  phone: string;
  role?: "USER" | "VENDOR" | "ADMIN";
  storeName?: string;
}

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
};

export type ProductFilters = {
  title?: string;
  categoryName?: string | undefined;
  price_min?: number;
  price_max?: number;
  offset?: number;
  limit?: number;
  vendorId?: string;
};

export type ProductState = {
  // --- STATE ---
  products: ApiProduct[];
  filteredProducts: ApiProduct[];
  categories: ApiCategory[];
  currentProduct: ApiProduct | null;
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  isFetchingMore: boolean;
  fetchMoreProducts: (filters?: ProductFilters) => Promise<void>;

  // --- ACTIONS: FETCHING ---
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: number | string) => Promise<void>;
  fetchCategories: () => Promise<void>;

  // --- ACTIONS: LOOKUPS (For Cart, Details, and Breadcrumbs) ---
  getCategoryById: (id: number | string) => ApiCategory | undefined;
  getLocalProductById: (id: number | string) => ApiProduct | undefined;

  // --- ACTIONS: UI LOGIC ---
  setSearchQuery: (query: string) => void;
  setCategory: (categoryName: string | null, shouldFetch?: boolean) => Promise<void>;
  clearFilters: () => void;
};

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "INITIALIZED"
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "REFUNDED";

export type PaymentMethod =
  | "MOBILE_MONEY"
  | "CREDIT_CARD"
  | "CASH_ON_DELIVERY"
  | "WORKFORCE_WALLET";

// Individual Item in an Order
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  vendorId?: string;
  product: ApiProduct;
  quantity: number;
  priceAtPurchase: number | string;
  vendorEarnings: number | string;
}

// The Main Order Object
export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  items: OrderItem[];
  totalAmount: number | string;
  taxAmount: number | string;
  shippingFees: number | string;
  status: OrderStatus | (string & {});
  paymentStatus: PaymentStatus | (string & {});
  paymentMethod: PaymentMethod | (string & {});
  shippingAddress: string;
  phoneNumber: string;
  email?: string;
  user?: { id?: string; name?: string; email?: string; phone?: string };
  vendorId?: string;
  fulfillments?: Array<{
    id: string;
    vendorId: string;
    revenue: number | string;
    status?: string;
    vendor?: ApiVendor;
  }>;
  createdAt: string;
  updatedAt?: string;
}

// Data Transfer Object for creating an order
export interface CreateOrderDto {
  items: {
    productId: string;
    quantity: number;
    vendorId: string;
  }[];
  shippingAddress: string;
  phoneNumber: string;
  paymentMethod: PaymentMethod;
}