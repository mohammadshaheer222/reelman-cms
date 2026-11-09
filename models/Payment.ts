import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  paymentId: string;
  clientId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank-transfer' | 'cheque' | 'other';
  paymentDate: Date;
  paymentStatus:
    | 'unpaid'
    | 'advance-received'
    | 'partially-paid'
    | 'fully-paid'
    | 'refund-pending'
    | 'refunded';
  notes?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'cheque', 'other'],
      default: 'cash',
    },
    paymentDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: [
        'unpaid',
        'advance-received',
        'partially-paid',
        'fully-paid',
        'refund-pending',
        'refunded',
      ],
      default: 'advance-received',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ clientId: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ paymentStatus: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;

