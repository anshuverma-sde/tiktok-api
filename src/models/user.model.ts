// models/user.model.ts
import mongoose, { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  companyName?: string;
  role: 'brand_owner' | 'admin' | 'brand_manager' | 'creator';
  isEmailVerified: boolean;
  active: boolean; 
  stripeCustomerId?: string;
  subscription?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    companyName: { type: String },
    role: {
      type: String,
      enum: ['brand_owner', 'admin', 'brand_manager', 'creator'],
      default: 'brand_owner',
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    stripeCustomerId: { type: String, sparse: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription', index: true },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);