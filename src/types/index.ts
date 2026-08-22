export interface OptionItem {
  id: number;
  option_group_id: number;
  name: string;
  extra_price: number;
  image_path?: string | null;
  is_active?: boolean;
}

export interface OptionGroup {
  id: number;
  name: string;
  selection_type: 'single_select' | 'multi_select';
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  free_choice_limit: number;
  options: OptionItem[];
  pivot?: {
    step_order: number;
    free_choice_limit_override?: number | null;
  };
}

export interface Product {
  category: any;
  id: number;
  name: string;
  description?: string;
  ingredients?: string[] | string;
  allergens?: string[] | string;
  dietary_flags?: string[] | string;
  calories?: string;
  price?: any;
  unit_price?: any;
  amount?: any;
  vat_rate?: number | string; // 🚀 Dynamic TVA (5.50, 10.00, 20.00) from Laravel DB
  image_path: string | null;
  category_name?: string;
  category_id?: number;
  is_active?: boolean;
  option_groups?: OptionGroup[]; // 🚀 Dynamic Kiosk Option Groups
}

export interface OrderItem {
  id: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_rate?: number;
  subtotal: number;
  notes?: string[] | string | null; // 🚀 Kitchen instructions ("No Onions", "Extra Bacon")
  item_status?: 'pending' | 'preparing' | 'done'; // KDS checklist status
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: 'stripe_checkout' | 'card' | 'cash' | 'split';
  split_cash_amount?: number;
  split_card_amount?: number;
  created_at?: string;
}

export interface ClientProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  loyalty_points?: number; // 🚀 Customer loyalty points balance
  created_at?: string;
}

export interface Order {
  // 🚀 Core Identifiers & Sequence
  id: number;
  uuid?: string;
  sequence_number?: number; // Ticket # (1, 2, 3...)
  payment_intent_id?: string | null; // Stripe pi_... ID

  // 🚀 Order Type & Workflow Statuses
  order_type?: 'click_and_collect' | 'takeaway' | 'dine_in' | 'online';
  preparation_status?: 'not_accepted' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  status?: 'completed' | 'paid' | 'refunded' | 'cancelled';

  // 🚀 Customer Details
  user_id?: number | null; // POS Cashier ID
  client_id?: number | null; // Registered Customer ID
  customer_name?: string | null;
  customer_phone?: string | null;
  client?: ClientProfile | null;

  // 🚀 Financials & French NF525 Tax Breakdown
  subtotal_excl_vat?: number; // Total HT (€)
  vat_amount?: number;        // VAT / TVA Collected (€)
  total_incl_vat?: number;    // Grand Total TTC (€)
  total_amount?: number;      // Legacy fallback alias

  // 🚀 Discounts, Promo Codes & Loyalty Rewards
  coupon_code?: string | null;  // e.g. "WELCOME10"
  discount_amount?: number;     // Total Discount (€)
  points_redeemed?: number;     // Loyalty points used during checkout
  points_earned?: number;       // Loyalty points awarded for this purchase

  // 🚀 French NF525 Audit Hash Chain
  hash?: string | null;
  previous_hash?: string | null;

  // 🚀 Timestamps & Preparation Timers
  estimated_prep_time?: number | null; // Prep time in minutes (15, 30, 45)
  estimated_ready_at?: string | null;  // Estimated completion ISO timestamp
  completed_at?: string | null;
  created_at: string;
  updated_at?: string;

  // 🚀 Relational Line Items & Payments
  items?: OrderItem[];
  payments?: Payment[];
}





export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string[];
  extraPrice?: number; // Stores extra cost from paid suppléments (+€1.50 Bacon, etc.)
}


export interface SiteSettings {
  id?: number;
  country?: string;
  currency?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_title: string;
  hero_subtitle?: string;
  hero_slides?: any[];
  promo_banner_text?: string;
  promo_active?: boolean;
  
  // Section Visibility Toggles
  show_how_it_works?: boolean;
  show_featured?: boolean;
  show_why_choose_us?: boolean;
  show_newsletter?: boolean;
  show_faq?: boolean;
  show_about?: boolean;
  show_contact?: boolean;

  // Dynamic Section Content
  how_it_works_title?: string;
  how_it_works_subtitle?: string;
  how_it_works_steps?: Array<{ step: number; title: string; description: string }>;

  why_choose_us_title?: string;
  why_choose_us_subtitle?: string;
  why_choose_us_items?: Array<{ icon: string; title: string; description: string }>;

  faq_title?: string;
  faq_subtitle?: string;
  faq_items?: Array<{ question: string; answer: string }>;

  about_title?: string;
  about_text?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  google_maps_iframe?: string;

  // Theme
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  border_radius?: string;

  // Operations
  is_store_open?: boolean;
  online_orders_enabled?: boolean;
  reservations_enabled?: boolean;
  schedule?: string;
  closed_message?: string;
}