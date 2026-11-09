import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  clientId: mongoose.Types.ObjectId;
  title: string;
  projectType: string;
  eventDate?: Date;
  location?: string;
  teamMembers: mongoose.Types.ObjectId[];
  status: 'planning' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  totalAmount: number;
  advanceAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectId: { type: String, required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    title: { type: String, required: true, trim: true },
    projectType: {
      type: String,
      enum: [
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
      ],
      default: 'Other',
    },
    eventDate: { type: Date },
    location: { type: String, trim: true },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['planning', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'planning',
    },
    totalAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ eventDate: 1 });
ProjectSchema.index({ status: 1 });

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>('Project', ProjectSchema);
export default Project;

