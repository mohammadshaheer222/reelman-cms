import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStatusHistory {
  status: string;
  statusName: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

export interface IDeliverableMilestone {
  id: string;
  title: string;
  description?: string;
  targetDays?: number;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: Date;
  notes?: string;
  link?: string;
}

export interface IPaymentInstallment {
  id: string;
  name: string;
  percentage?: number;
  amount: number;
  dueDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: Date;
  paidAmount?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface IClient extends Document {
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
  deliverables?: IDeliverableMilestone[];
  installments?: IPaymentInstallment[];
  notes: mongoose.Types.DocumentArray<INote & Document>;
  status: mongoose.Types.ObjectId;
  statusHistory: IStatusHistory[];
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    content: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const StatusHistorySchema = new Schema<IStatusHistory>({
  status: { type: String, required: true },
  statusName: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now },
});

const ClientSchema = new Schema<IClient>(
  {
    clientId: { type: String, required: true, unique: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    date: { type: String, trim: true },
    dates: [{ type: String, trim: true }],
    location: { type: String, trim: true },
    requirements: [{ type: String, trim: true }],
    packageDetails: { type: String, trim: true },
    workPrice: { type: Number, default: 0 },
    advancePaid: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'advance-received', 'partially-paid', 'fully-paid'],
      default: 'unpaid',
    },
    deliverables: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        targetDays: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ['pending', 'in-progress', 'completed'],
          default: 'pending',
        },
        completedAt: { type: Date },
        notes: { type: String },
        link: { type: String },
      },
    ],
    installments: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        percentage: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        dueDate: { type: String },
        status: {
          type: String,
          enum: ['paid', 'pending', 'overdue'],
          default: 'pending',
        },
        paidAt: { type: Date },
        paidAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, default: 'upi' },
        notes: { type: String },
      },
    ],
    notes: [NoteSchema],
    status: { type: Schema.Types.ObjectId, ref: 'Status', required: true },
    statusHistory: [StatusHistorySchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ClientSchema.index({ clientId: 1 });
ClientSchema.index({ status: 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ isArchived: 1 });
ClientSchema.index({ isArchived: 1, createdAt: -1 });
ClientSchema.index({ isArchived: 1, status: 1, createdAt: -1 });

const Client: Model<IClient> =
  mongoose.models.Client ||
  mongoose.model<IClient>('Client', ClientSchema);
export default Client;

