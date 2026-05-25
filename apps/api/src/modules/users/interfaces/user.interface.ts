import type { Document, Types } from 'mongoose';
import type { UserRole } from '@roadguard/types';
import type { BaseEntity } from '@roadguard/database';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface UserAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export interface UserPreferences {
  language?: string;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}

export interface StoredRefreshToken {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  profileImage?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
  refreshTokens: StoredRefreshToken[];
  emergencyContacts: EmergencyContact[];
  addresses: UserAddress[];
  preferences: UserPreferences;
}

export type UserDocument = IUser & Document<Types.ObjectId>;

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  profileImage?: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
  emergencyContacts: EmergencyContact[];
  addresses: UserAddress[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}
