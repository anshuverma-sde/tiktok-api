import mongoose ,{ Schema, model, Document } from 'mongoose';

export interface IVerificationToken extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const verificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, 
    },
  },
  { timestamps: true },
);

export const VerificationToken = model<IVerificationToken>(
  'VerificationToken',
  verificationTokenSchema,
); 