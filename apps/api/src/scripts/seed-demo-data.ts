/**
 * Seed demo customers, providers, and one admin into MongoDB.
 *
 * Usage (from repo root or apps/api):
 *   pnpm --filter @roadguard/api seed:demo
 *   pnpm --filter @roadguard/api seed:demo -- --reset
 *
 * All demo accounts use password: Demo@12345
 * Emails end with @roadguard.demo
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { loadEnv, resetEnvCache } from '@roadguard/config';
import { UserRole } from '@roadguard/types';
import { disconnectMongo } from '@roadguard/database';
import { connectMongoFromEnv } from '../database/index.js';
import { hashPassword, getSaltRounds } from '../modules/auth/utils/password.util.js';
import { UserModel } from '../modules/users/schemas/user.schema.js';
import { ProviderModel } from '../modules/providers/schemas/provider.schema.js';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
  ProviderType,
} from '../modules/providers/constants/provider.enums.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_EMAIL_DOMAIN = '@roadguard.demo';
const DEMO_PASSWORD = 'Demo@12345';

type GeoPoint = { type: 'Point'; coordinates: [number, number] };

interface DemoCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  city: string;
}

interface DemoProviderUser extends DemoCustomer {
  businessName: string;
  providerType: ProviderType;
  servicesOffered: string[];
  serviceRadius: number;
  location: GeoPoint;
  availabilityStatus: AvailabilityStatus;
  onlineStatus: OnlineStatus;
}

const demoCustomers: DemoCustomer[] = [
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800100001',
    city: 'Mumbai',
  },
  {
    firstName: 'Rahul',
    lastName: 'Mehta',
    email: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800100002',
    city: 'Pune',
  },
  {
    firstName: 'Ananya',
    lastName: 'Desai',
    email: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800100003',
    city: 'Mumbai',
  },
  {
    firstName: 'Karan',
    lastName: 'Iyer',
    email: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800100004',
    city: 'Thane',
  },
];

const demoProviders: DemoProviderUser[] = [
  {
    firstName: 'Vikram',
    lastName: 'Patil',
    email: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800200001',
    city: 'Mumbai',
    businessName: 'Patil Roadside Mechanics',
    providerType: ProviderType.MECHANIC,
    servicesOffered: ['Engine repair', 'Flat tyre', 'Battery jump-start'],
    serviceRadius: 15,
    location: { type: 'Point', coordinates: [72.8777, 19.076] },
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    onlineStatus: OnlineStatus.ONLINE,
  },
  {
    firstName: 'Sneha',
    lastName: 'Kulkarni',
    email: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800200002',
    city: 'Pune',
    businessName: 'Kulkarni Tow & Rescue',
    providerType: ProviderType.TOWING,
    servicesOffered: ['Light towing', 'Vehicle recovery', 'Highway assist'],
    serviceRadius: 25,
    location: { type: 'Point', coordinates: [73.8567, 18.5204] },
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    onlineStatus: OnlineStatus.ONLINE,
  },
  {
    firstName: 'Arjun',
    lastName: 'Singh',
    email: `arjun.singh${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800200003',
    city: 'Mumbai',
    businessName: 'Singh Battery Assist',
    providerType: ProviderType.BATTERY_SUPPORT,
    servicesOffered: ['Battery replacement', 'Jump start', 'EV charge assist'],
    serviceRadius: 12,
    location: { type: 'Point', coordinates: [72.845, 19.1136] },
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    onlineStatus: OnlineStatus.ONLINE,
  },
  {
    firstName: 'Meera',
    lastName: 'Joshi',
    email: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800200004',
    city: 'Navi Mumbai',
    businessName: 'Joshi Fuel On-Demand',
    providerType: ProviderType.FUEL_DELIVERY,
    servicesOffered: ['Petrol delivery', 'Diesel delivery', 'Emergency fuel'],
    serviceRadius: 18,
    location: { type: 'Point', coordinates: [73.0297, 19.033] },
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    onlineStatus: OnlineStatus.ONLINE,
  },
  {
    firstName: 'Rohan',
    lastName: 'Verma',
    email: `rohan.verma${DEMO_EMAIL_DOMAIN}`,
    phoneNumber: '+919800200005',
    city: 'Mumbai',
    businessName: 'Verma EV Rapid Help',
    providerType: ProviderType.EV_SUPPORT,
    servicesOffered: ['EV towing', 'Charging support', 'Software reset assist'],
    serviceRadius: 20,
    location: { type: 'Point', coordinates: [72.91, 19.05] },
    availabilityStatus: AvailabilityStatus.BUSY,
    onlineStatus: OnlineStatus.ONLINE,
  },
];

const demoAdmin: DemoCustomer = {
  firstName: 'Admin',
  lastName: 'RoadGuard',
  email: `admin${DEMO_EMAIL_DOMAIN}`,
  phoneNumber: '+919800300001',
  city: 'Mumbai',
};

function defaultAddress(city: string) {
  return [
    {
      label: 'Home',
      line1: '12 Demo Street',
      line2: 'Near City Center',
      city,
      state: 'Maharashtra',
      zip: '400001',
      country: 'IN',
      isDefault: true,
    },
  ];
}

async function clearDemoData(): Promise<void> {
  const demoUsers = await UserModel.find({
    email: { $regex: /@roadguard\.demo$/i },
  }).select('_id email');

  const userIds = demoUsers.map((u) => u._id);
  if (userIds.length > 0) {
    await ProviderModel.deleteMany({ userId: { $in: userIds } });
    await UserModel.deleteMany({ _id: { $in: userIds } });
  }

  console.log(`Removed ${demoUsers.length} demo user(s) and linked provider profiles.`);
}

async function seedUser(
  data: DemoCustomer,
  role: UserRole,
  passwordHash: string,
): Promise<{ created: boolean; id: string }> {
  const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    return { created: false, id: existing._id.toString() };
  }

  const user = await UserModel.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    phoneNumber: data.phoneNumber,
    password: passwordHash,
    role,
    isEmailVerified: true,
    isPhoneVerified: true,
    isActive: true,
    addresses: defaultAddress(data.city),
    preferences: {
      language: 'en',
      notifications: { email: true, sms: true, push: true },
    },
  });

  return { created: true, id: user._id.toString() };
}

async function seedProviderProfile(data: DemoProviderUser, userId: string): Promise<boolean> {
  const existing = await ProviderModel.findOne({ userId });
  if (existing) return false;

  await ProviderModel.create({
    userId,
    businessName: data.businessName,
    providerType: data.providerType,
    servicesOffered: data.servicesOffered,
    phoneNumber: data.phoneNumber,
    email: data.email.toLowerCase(),
    currentLocation: data.location,
    serviceRadius: data.serviceRadius,
    availabilityStatus: data.availabilityStatus,
    onlineStatus: data.onlineStatus,
    kycStatus: KycStatus.VERIFIED,
    ratings: { average: 4.5 + Math.random() * 0.4, count: Math.floor(10 + Math.random() * 90) },
    totalCompletedRequests: Math.floor(Math.random() * 50),
    vehicleDetails: {
      type: 'Van',
      brand: 'Tata',
      model: 'Ace',
      registrationNumber: `MH${Math.floor(10 + Math.random() * 89)}AB${1000 + Math.floor(Math.random() * 9000)}`,
    },
  });

  return true;
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');

  loadDotenv({ path: path.resolve(__dirname, '../../.env') });
  resetEnvCache();
  const env = loadEnv({ envPath: path.resolve(__dirname, '../../.env') });

  const uri = env.MONGODB_URI;
  const masked = uri.replace(/:([^:@/]+)@/, ':****@');
  console.log(`MongoDB target: ${masked}`);

  if (/localhost|127\.0\.0\.1/i.test(uri)) {
    console.warn(
      '\n⚠️  MONGODB_URI points to LOCALHOST — data will NOT appear in Atlas / Compass Atlas connection.',
    );
    console.warn(
      '   Edit apps/api/.env → use your Atlas URI (mongodb+srv://...@roadguard.fvofcm1.mongodb.net/roadguard...)\n',
    );
  }

  console.log('Connecting to MongoDB…');
  await connectMongoFromEnv(env);

  if (reset) {
    await clearDemoData();
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD, getSaltRounds(env));
  const summary: string[] = [];

  for (const customer of demoCustomers) {
    const { created, id } = await seedUser(customer, UserRole.CUSTOMER, passwordHash);
    summary.push(
      `${created ? '✓' : '○'} Customer ${customer.firstName} ${customer.lastName} <${customer.email}>`,
    );
    if (!created) console.log(`  (skip — exists) ${customer.email}`);
    else console.log(`  (created) ${id}`);
  }

  for (const provider of demoProviders) {
    const { created, id } = await seedUser(provider, UserRole.PROVIDER, passwordHash);
    const profileCreated = await seedProviderProfile(provider, id);
    summary.push(
      `${created ? '✓' : '○'} Provider ${provider.businessName} <${provider.email}> ${profileCreated ? '+ profile' : ''}`,
    );
  }

  const { created: adminCreated } = await seedUser(demoAdmin, UserRole.ADMIN, passwordHash);
  summary.push(`${adminCreated ? '✓' : '○'} Admin <${demoAdmin.email}>`);

  await disconnectMongo();

  console.log('\n--- Demo seed complete ---\n');
  summary.forEach((line) => console.log(line));
  console.log(`
Login password for ALL demo accounts: ${DEMO_PASSWORD}

Customers (use on /login):
${demoCustomers.map((c) => `  • ${c.email}`).join('\n')}

Providers (use on /login — profiles already onboarded):
${demoProviders.map((p) => `  • ${p.email} — ${p.businessName} (${p.providerType})`).join('\n')}

Admin:
  • ${demoAdmin.email}

Re-run with --reset to delete and recreate all @roadguard.demo users.
`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
