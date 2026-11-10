export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  content: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistory {
  status: string;
  statusName: string;
  changedBy: User | string;
  changedAt: string;
}

export interface Client {
  _id: string;
  clientId: string;
  name?: string;
  phone?: string;
  notes: Note[];
  status: Status | string;
  statusHistory: StatusHistory[];
  createdBy: User | string;
  assignedTo?: User | string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Status {
  _id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  clientCount?: number;
  createdAt: string;
}

export interface Project {
  _id: string;
  projectId: string;
  clientId: Client | string;
  title: string;
  projectType: string;
  eventDate?: string;
  location?: string;
  teamMembers: (User | string)[];
  status: 'planning' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
  advanceAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  clientId: Client | string;
  projectId?: Project | string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'other';
  paymentDate: string;
  paymentStatus:
    | 'unpaid'
    | 'advance-received'
    | 'partially-paid'
    | 'fully-paid'
    | 'refund-pending'
    | 'refunded';
  notes?: string;
  createdAt: string;
}

export interface Activity {
  _id: string;
  clientId: Client | string;
  userId: User | string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  completedProjects: number;
  cancelledProjects: number;
  upcomingEvents: number;
  totalRevenue: number;
  pendingPayments: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export const PROJECT_TYPES = [
  'Wedding Photography',
  'Wedding Videography',
  'Engagement',
  'Pre-Wedding',
  'Birthday',
  'Corporate Events',
  'Product Photography',
  'Model Photography',
  'Reels Creation',
  'Other',
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', color: '#6b7280' },
  { value: 'advance-received', label: 'Advance Received', color: '#f59e0b' },
  { value: 'partially-paid', label: 'Partially Paid', color: '#3b82f6' },
  { value: 'fully-paid', label: 'Fully Paid', color: '#22c55e' },
  { value: 'refund-pending', label: 'Refund Pending', color: '#f97316' },
  { value: 'refunded', label: 'Refunded', color: '#8b5cf6' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: '#6366f1' },
  { value: 'confirmed', label: 'Confirmed', color: '#06b6d4' },
  { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
] as const;

export interface PackageEvent {
  name: string;
  crew: string[];
}

export interface PackageTerm {
  title: string;
  description: string;
}

export interface TextStyleConfig {
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  fontSize?: number; // relative or px
  color?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string; // e.g. '-0.05em' | '0em' | '0.1em' | '0.25em' | '0.35em'
  lineHeight?: string;    // e.g. '1' | '1.2' | '1.5' | '1.8' | '2.2'
  textAlign?: 'left' | 'center' | 'right';
  marginTop?: number;     // vertical gap / position offset in px
  marginBottom?: number;  // bottom spacing in px
}

export interface PageBackgroundConfig {
  color?: string;
  image?: string;
}

export interface BookletPageItem {
  id: string;
  type:
    | 'cover'
    | 'story'
    | 'scope'
    | 'deliverables'
    | 'terms'
    | 'delivery'
    | 'policies'
    | 'contact'
    | 'custom';
  title?: string;
  subtitle?: string;
  content?: string;
  bgColor?: string;
  bgImage?: string;
}

export interface PackageData {
  _id?: string;
  title: string;
  clientId?: string;
  clientName?: string;
  coverImage: string;
  coverBrand: string;
  coverSubtitle: string;
  coverFooterText?: string;
  whoWeAreTitle: string;
  whoWeAreText: string;
  whoWeAreFooter?: string;
  pricelistTitle?: string;
  pricelistSubtitle?: string;
  deliverablesTitle?: string;
  events: PackageEvent[];
  deliverables: string[];
  totalAmount: string;
  totalAmountLabel?: string;
  amountNote: string;
  termsTitle?: string;
  terms: PackageTerm[];
  deliveriesTitle?: string;
  deliveries: PackageTerm[];
  policiesTitle?: string;
  policies: string[];
  getInTouchTitle?: string;
  contactWebsite: string;
  contactPhones: string[];
  tagline: string;
  headlineFont?: string;
  scriptFont?: string;
  bodyFont?: string;
  headlineFontWeight?: string;
  scriptFontWeight?: string;
  bodyFontWeight?: string;
  headlineItalic?: boolean;
  scriptItalic?: boolean;
  bodyItalic?: boolean;
  headlineFontSize?: string;
  bodyFontSize?: string;
  textStyles?: Record<string, TextStyleConfig>;
  pagesList?: BookletPageItem[];
  pageBackgrounds?: Record<string, PageBackgroundConfig>;
  createdAt?: string;
  updatedAt?: string;
}


