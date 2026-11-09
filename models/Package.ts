import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventScope {
  name: string;
  crew: string[];
}

export interface ITermItem {
  title: string;
  description: string;
}

export interface IPackage extends Document {
  title: string;
  clientId?: mongoose.Types.ObjectId;
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
  events: IEventScope[];
  deliverables: string[];
  totalAmount: string;
  totalAmountLabel?: string;
  amountNote: string;
  termsTitle?: string;
  terms: ITermItem[];
  deliveriesTitle?: string;
  deliveries: ITermItem[];
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
  textStyles?: Record<string, any>;
  pagesList?: any[];
  pageBackgrounds?: Record<string, any>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    title: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, trim: true },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200',
    },
    coverBrand: { type: String, default: 'REELMAN' },
    coverSubtitle: { type: String, default: 'Production' },
    coverFooterText: { type: String, default: 'REELMAN PRODUCTION.' },
    whoWeAreTitle: { type: String, default: 'Who we are?' },
    whoWeAreText: {
      type: String,
      default:
        "Reelman Production is a team of passionate photographers dedicated to capturing life's most meaningful moments. With a blend of creativity, skill, and storytelling, we transform ordinary scenes into extraordinary memories. Whether it's a wedding, a corporate event, or a creative project, we bring a fresh perspective and an artistic touch to every shot. Let us turn your vision into timeless imagery.",
    },
    whoWeAreFooter: { type: String, default: 'Reelman Production' },
    pricelistTitle: { type: String, default: 'WEDDING' },
    pricelistSubtitle: { type: String, default: 'pricelist' },
    deliverablesTitle: { type: String, default: 'DELIVERABLES' },
    events: [
      {
        name: { type: String, required: true },
        crew: [{ type: String }],
      },
    ],
    deliverables: [{ type: String }],
    totalAmount: { type: String, default: '55,000/-' },
    totalAmountLabel: { type: String, default: 'Total Amount :' },
    amountNote: { type: String, default: '(Travel expenses will be an additional)' },
    termsTitle: { type: String, default: 'Terms and Conditions' },
    terms: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    deliveriesTitle: { type: String, default: 'Delivery Timelines' },
    deliveries: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    policiesTitle: { type: String, default: 'Additional Requests' },
    policies: [{ type: String }],
    getInTouchTitle: { type: String, default: 'Get in Touch' },
    contactWebsite: { type: String, default: 'www.reelmanproduction.com' },
    contactPhones: [{ type: String }],
    tagline: { type: String, default: 'REEL OF MEMORIES, REAL EMOTIONS' },
    headlineFont: { type: String, default: 'Cormorant Garamond' },
    scriptFont: { type: String, default: 'Alex Brush' },
    bodyFont: { type: String, default: 'Montserrat' },
    headlineFontWeight: { type: String, default: '400' },
    scriptFontWeight: { type: String, default: '400' },
    bodyFontWeight: { type: String, default: '400' },
    headlineItalic: { type: Boolean, default: false },
    scriptItalic: { type: Boolean, default: false },
    bodyItalic: { type: Boolean, default: false },
    headlineFontSize: { type: String, default: 'base' },
    bodyFontSize: { type: String, default: 'base' },
    textStyles: { type: Schema.Types.Mixed, default: {} },
    pagesList: { type: [Schema.Types.Mixed], default: undefined },
    pageBackgrounds: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, strict: false }
);

// Clear cached model to ensure schema updates like pagesList & pageBackgrounds take effect immediately
if (mongoose.models && mongoose.models.Package) {
  delete mongoose.models.Package;
}

const Package: Model<IPackage> =
  mongoose.models.Package || mongoose.model<IPackage>('Package', PackageSchema);

export default Package;
