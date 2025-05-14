import { Schema, model, Document } from 'mongoose';

export interface ILoginAttempt extends Document {
  email: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    email: { 
      type: String, 
      required: true, 
      index: true 
    },
    count: { 
      type: Number, 
      default: 1 
    },
  },
  { 
    timestamps: true 
  }
);

loginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const LoginAttempt = model<ILoginAttempt>('LoginAttempt', loginAttemptSchema);