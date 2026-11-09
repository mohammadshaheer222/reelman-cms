import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  clientId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivitySchema.index({ clientId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;

