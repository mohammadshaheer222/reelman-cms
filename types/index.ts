export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  allowedNavItems?: string[];
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

export interface DeliverableMilestone {
  id: string;
  title: string;
  description?: string;
  targetDays: number; // Promised turnaround in days from event date
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: string;
  notes?: string;
  link?: string;
}

export interface PaymentInstallment {
  id: string; // 'advance' | 'event-day' | 'final-balance' | string
  name: string; // 'Booking Advance' | 'On Event / Shoot Day' | 'Album / Final Handover'
  percentage: number; // 30, 50, 20
  amount: number;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: 'upi' | 'cash' | 'bank-transfer' | 'cheque' | 'other';
  notes?: string;
}

export interface Client {
  _id: string;
  clientId: string;
  name?: string;
  phone?: string;
  date?: string;
  dates?: string[];
  location?: string;
  requirements?: string[];
  packageDetails?: string;
  workPrice?: number;
  advancePaid?: number;
  paymentStatus?: 'unpaid' | 'advance-received' | 'partially-paid' | 'fully-paid';
  deliverables?: DeliverableMilestone[];
  installments?: PaymentInstallment[];
  notes: Note[];
  status: Status | string;
  statusHistory: StatusHistory[];
  createdBy: User | string;
  assignedTo?: User | string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  _id: string;
  name: string;
  order: number;
  isDefault: boolean;
  createdAt?: string;
}

export interface CalendarShootEvent {
  _id: string;
  clientId: string;
  name: string;
  phone?: string;
  date: string;
  dates: string[];
  location?: string;
  requirements?: string[];
  workPrice?: number;
  advancePaid?: number;
  paymentStatus?: string;
  packageDetails?: string;
  status?: {
    _id: string;
    name: string;
    color: string;
  };
}

export interface Status {
  _id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  whatsappMessage?: string;
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
  totalAdvance?: number;
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
  offsetX?: number;       // horizontal drag-and-drop offset in px
  offsetY?: number;       // vertical drag-and-drop offset in px
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

export const DEFAULT_DELIVERABLE_MILESTONES: DeliverableMilestone[] = [
  {
    id: 'raw-backup',
    title: 'Raw Footage Backup & Archive',
    description: 'Offload dual-SD cards to editing RAID storage and secure cloud backup',
    targetDays: 1,
    status: 'pending',
  },
  {
    id: 'teaser-reel',
    title: 'Instagram 60-sec Teaser Reel',
    description: 'Cinematic teaser reel delivered within 72 hours of shoot completion',
    targetDays: 3,
    status: 'pending',
  },
  {
    id: 'photo-gallery',
    title: 'Photo Selection Gallery Link Sent',
    description: 'Curated online proofing gallery for couple to shortlist favorite shots',
    targetDays: 10,
    status: 'pending',
  },
  {
    id: 'photo-selections',
    title: 'Client Photo Selections Received',
    description: 'Couple finalizes album photo selections and retouching requests',
    targetDays: 20,
    status: 'pending',
  },
  {
    id: 'wedding-film',
    title: 'Wedding Film Final Cut & Color Grade',
    description: 'Full ceremony & cinematic story edit with audio mastering and color grading',
    targetDays: 35,
    status: 'pending',
  },
  {
    id: 'album-shipped',
    title: 'Photo Album Printed & Shipped',
    description: 'Flush-mount handcrafted photobook dispatched to client doorstep',
    targetDays: 50,
    status: 'pending',
  },
];

export function createDefaultInstallments(
  workPrice: number = 0,
  advancePaid: number = 0
): PaymentInstallment[] {
  const advanceAmount = Math.round(workPrice * 0.3);
  const eventDayAmount = Math.round(workPrice * 0.5);
  const finalAmount = Math.max(0, workPrice - (advanceAmount + eventDayAmount));

  const isAdvanceCovered = (advancePaid >= advanceAmount && advanceAmount > 0) || advancePaid > 0;

  return [
    {
      id: 'advance',
      name: 'Booking Advance (30%)',
      percentage: 30,
      amount: advanceAmount,
      dueDate: 'Upon Booking Confirmation',
      status: isAdvanceCovered ? 'paid' : 'pending',
      paidAmount: advancePaid > 0 ? (advancePaid >= advanceAmount ? advanceAmount : advancePaid) : 0,
      paidAt: isAdvanceCovered ? new Date().toISOString() : undefined,
      paymentMethod: 'upi',
    },
    {
      id: 'event-day',
      name: 'On Event / Shoot Day (50%)',
      percentage: 50,
      amount: eventDayAmount,
      dueDate: 'On Shoot / Wedding Day',
      status: 'pending',
      paidAmount: 0,
      paymentMethod: 'upi',
    },
    {
      id: 'final-balance',
      name: 'Album / Final Handover (20%)',
      percentage: 20,
      amount: finalAmount,
      dueDate: 'Upon Album & Film Delivery',
      status: 'pending',
      paidAmount: 0,
      paymentMethod: 'upi',
    },
  ];
}


