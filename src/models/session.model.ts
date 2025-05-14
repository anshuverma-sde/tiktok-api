import mongoose, { Schema, model, Document } from 'mongoose';
import jwt, { SignOptions } from 'jsonwebtoken';
import ms from 'ms';
import env from '../config/env';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  role: 'brand_owner' | 'admin' | 'brand_manager' | 'creator';
  persistent: boolean; 
  createdAt: Date;
  updatedAt: Date;
  generateAccessToken(persistent?: boolean): string;
  generateRefreshToken(persistent?: boolean): string;
  isAccessTokenValid(): boolean;
  isRefreshTokenValid(): boolean;
  refresh(): Promise<{ accessToken: string; refreshToken: string }>;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    role: {
      type: String,
      enum: ['brand_owner', 'admin', 'brand_manager', 'creator'],
      required: true,
    },
    persistent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

sessionSchema.methods.generateAccessToken = function(this: ISession, persistent = this.persistent) {
  const payload = { userId: this.userId.toString(), role: this.role };
  const expiresIn = persistent ? env.accessTokenExpiresInLong : env.accessTokenExpiresIn;
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, env.accessTokenSecret, options);
};

sessionSchema.methods.generateRefreshToken = function(this: ISession, persistent = this.persistent) {
  const payload = { userId: this.userId.toString(), role: this.role };
  const expiresIn = persistent ? env.refreshTokenExpiresInLong : env.refreshTokenExpiresIn;
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, env.refreshTokenSecret, options);
};

sessionSchema.methods.isAccessTokenValid = function() {
  return this.accessTokenExpiresAt > new Date();
};

sessionSchema.methods.isRefreshTokenValid = function() {
  return this.refreshTokenExpiresAt > new Date();
};

sessionSchema.methods.refresh = async function() {
  const persistent = this.persistent;
  this.accessToken = this.generateAccessToken(persistent);
  this.refreshToken = this.generateRefreshToken(persistent);
  
  const accessDuration = persistent ? env.accessTokenExpiresInLong : env.accessTokenExpiresIn;
  const refreshDuration = persistent ? env.refreshTokenExpiresInLong : env.refreshTokenExpiresIn;
  
  this.accessTokenExpiresAt = new Date(Date.now() + ms(accessDuration));
  this.refreshTokenExpiresAt = new Date(Date.now() + ms(refreshDuration));
  
  await this.save();
  return { accessToken: this.accessToken, refreshToken: this.refreshToken };
};

sessionSchema.index({ userId: 1 });
sessionSchema.index({ accessToken: 1 });
sessionSchema.index({ refreshToken: 1 });

export const Session = model<ISession>('Session', sessionSchema);
