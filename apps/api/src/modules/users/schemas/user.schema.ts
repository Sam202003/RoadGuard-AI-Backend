import mongoose, { Schema, model, type Model } from 'mongoose';
import { UserRole } from '@roadguard/types';
import { createBaseSchema } from '@roadguard/database';
import type { IUser, UserDocument } from '../interfaces/user.interface.js';

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, trim: true },
  },
  { _id: false },
);

const addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'IN' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userDefinition = {
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
    index: true,
  },
  profileImage: { type: String, default: null },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  lastLoginAt: { type: Date, default: null },
  refreshTokens: { type: [refreshTokenSchema], default: [] },
  emergencyContacts: { type: [emergencyContactSchema], default: [] },
  addresses: { type: [addressSchema], default: [] },
  preferences: {
    type: new Schema(
      {
        language: { type: String, default: 'en' },
        notifications: {
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
        },
      },
      { _id: false },
    ),
    default: () => ({}),
  },
};

const userSchema = createBaseSchema(userDefinition);

userSchema.index({ role: 1, isActive: 1 });

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  model<UserDocument>('User', userSchema);
