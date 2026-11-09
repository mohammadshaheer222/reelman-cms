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

export interface IClient extends Document {
  clientId: string;
  name?: string;
  phone?: string;
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

if (mongoose.models && mongoose.models.Client) {
  delete mongoose.models.Client;
}

const Client: Model<IClient> =
  mongoose.models.Client ||
  mongoose.model<IClient>('Client', ClientSchema);
export default Client;

