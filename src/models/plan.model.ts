import mongoose, { Schema, model, Document } from 'mongoose';

export interface IPlan extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  resourceLimits: {
    bots: number;
    messages: number;
    [key: string]: number;
  };
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  features: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    resourceLimits: {
      type: Schema.Types.Mixed,
      required: true,
      default: { bots: 0, messages: 0 },
    },
    monthlyPrice: { type: Number, required: true, min: 0 },
    yearlyPrice: { type: Number, required: true, min: 0 },
    stripePriceIdMonthly: { type: String, required: true, unique: true },
    stripePriceIdYearly: { type: String, required: true, unique: true },
    features: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Plan = model<IPlan>('Plan', planSchema);