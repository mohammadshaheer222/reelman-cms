import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRequirement extends Document {
  name: string;
  order: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RequirementSchema.index({ order: 1 });

const Requirement: Model<IRequirement> =
  mongoose.models.Requirement ||
  mongoose.model<IRequirement>('Requirement', RequirementSchema);

export default Requirement;
