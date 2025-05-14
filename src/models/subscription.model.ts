import mongoose ,{ Schema, model, Document } from 'mongoose';

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  plan: mongoose.Types.ObjectId;
  period: 'monthly' | 'yearly';
  stripeSubscriptionId: string;
  status: 'active' | 'pending' | 'canceled' | 'expired';
  startDate: Date;
  endDate: Date;
  resourceUsage: {
    bots: number;
    messages: number;
    [key: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
  resetResourceUsage(): Promise<void>;
  renew(): Promise<void>;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    period: { type: String, enum: ['monthly', 'yearly'], required: true },
    stripeSubscriptionId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'canceled', 'expired'],
      default: 'pending',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    resourceUsage: {
      type: Schema.Types.Mixed,
      required: true,
      default: { bots: 0, messages: 0 },
    },
  },
  { timestamps: true },
);

subscriptionSchema.methods.resetResourceUsage = async function () {
  this.resourceUsage = { bots: 0, messages: 0 };
  await this.save();
};

subscriptionSchema.methods.renew = async function () {
  const periodDuration =
    this.period === 'monthly'
      ? 30 * 24 * 60 * 60 * 1000
      : 365 * 24 * 60 * 60 * 1000;
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + periodDuration);
  this.status = 'active';
  await this.resetResourceUsage();
  await this.save();
};

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ plan: 1 });

export const Subscription = model<ISubscription>(
  'Subscription',
  subscriptionSchema,
);
