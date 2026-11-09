import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStatus extends Document {
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
}

const StatusSchema = new Schema<IStatus>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, default: '#6366f1' },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Status: Model<IStatus> =
  mongoose.models.Status ||
  mongoose.model<IStatus>('Status', StatusSchema);
export default Status;

