/**
 * Seed demo users, vehicles, breakdown requests (complaints), and notifications.
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
import { Types } from 'mongoose';
import { loadEnv, resetEnvCache } from '@roadguard/config';
import { UserRole } from '@roadguard/types';
import { disconnectMongo } from '@roadguard/database';
import { connectMongoFromEnv } from '../database/index.js';
import { hashPassword, getSaltRounds } from '../modules/auth/utils/password.util.js';
import {
  BreakdownStatus,
  IssueType,
  RequestPriority,
} from '../modules/breakdown-requests/constants/breakdown.enums.js';
import { BreakdownRequestModel } from '../modules/breakdown-requests/schemas/breakdown.schema.js';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../modules/notifications/constants/notification.enums.js';
import { NotificationModel } from '../modules/notifications/schemas/notification.schema.js';
import {
  AvailabilityStatus,
  KycStatus,
  OnlineStatus,
  ProviderType,
} from '../modules/providers/constants/provider.enums.js';
import { ProviderModel } from '../modules/providers/schemas/provider.schema.js';
import { UserModel } from '../modules/users/schemas/user.schema.js';
import {
  FuelType,
  TransmissionType,
  VehicleType,
} from '../modules/vehicles/constants/vehicle.enums.js';
import { VehicleModel } from '../modules/vehicles/schemas/vehicle.schema.js';

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

const DEMO_SEED_PREFIX = 'DEMO_SEED:';

interface DemoVehicleSeed {
  customerEmail: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  brand: string;
  vehicleModel: string;
  year: number;
  fuelType: FuelType;
  transmissionType: TransmissionType;
  isPrimaryVehicle: boolean;
  color?: string;
}

interface DemoBreakdownSeed {
  seedKey: string;
  customerEmail: string;
  registrationNumber: string;
  providerEmail?: string;
  issueType: IssueType;
  issueDescription: string;
  priority: RequestPriority;
  status: BreakdownStatus;
  location: GeoPoint;
  hoursAgoRequested: number;
  trackingEnabled?: boolean;
  estimatedArrivalTime?: number;
  estimatedDistance?: number;
  serviceCost?: number;
  cancellationReason?: string;
}

interface DemoNotificationSeed {
  seedKey: string;
  userEmail: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  breakdownSeedKey?: string;
}

const demoVehicles: DemoVehicleSeed[] = [
  {
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    vehicleType: VehicleType.CAR,
    brand: 'Honda',
    vehicleModel: 'City',
    year: 2021,
    fuelType: FuelType.PETROL,
    transmissionType: TransmissionType.AUTOMATIC,
    isPrimaryVehicle: true,
    color: 'White',
  },
  {
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    vehicleType: VehicleType.CAR,
    brand: 'Hyundai',
    vehicleModel: 'Creta',
    year: 2022,
    fuelType: FuelType.DIESEL,
    transmissionType: TransmissionType.MANUAL,
    isPrimaryVehicle: true,
    color: 'Grey',
  },
  {
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    vehicleType: VehicleType.EV,
    brand: 'Tata',
    vehicleModel: 'Nexon EV',
    year: 2023,
    fuelType: FuelType.ELECTRIC,
    transmissionType: TransmissionType.AUTOMATIC,
    isPrimaryVehicle: true,
    color: 'Blue',
  },
  {
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    vehicleType: VehicleType.CAR,
    brand: 'Maruti',
    vehicleModel: 'Swift',
    year: 2020,
    fuelType: FuelType.PETROL,
    transmissionType: TransmissionType.MANUAL,
    isPrimaryVehicle: true,
    color: 'Red',
  },
];

const demoBreakdowns: DemoBreakdownSeed[] = [
  {
    seedKey: 'BR-001',
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    providerEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.FLAT_TIRE,
    issueDescription:
      'Front left tyre punctured on Western Express Highway. Unable to drive safely.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.8777, 19.076] },
    hoursAgoRequested: 48,
    trackingEnabled: false,
    estimatedArrivalTime: 25,
    estimatedDistance: 4.2,
    serviceCost: 850,
  },
  {
    seedKey: 'BR-002',
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    providerEmail: `arjun.singh${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.BATTERY_FAILURE,
    issueDescription: 'Car will not start. Dashboard lights flicker — suspected dead battery.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.ON_THE_WAY,
    location: { type: 'Point', coordinates: [72.865, 19.082] },
    hoursAgoRequested: 2,
    trackingEnabled: true,
    estimatedArrivalTime: 18,
    estimatedDistance: 3.1,
  },
  {
    seedKey: 'BR-003',
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    providerEmail: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.FUEL_EMPTY,
    issueDescription: 'Ran out of diesel near Pune ring road. Need emergency fuel delivery.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.PROVIDER_ASSIGNED,
    location: { type: 'Point', coordinates: [73.8567, 18.5204] },
    hoursAgoRequested: 1,
    trackingEnabled: true,
    estimatedArrivalTime: 22,
    estimatedDistance: 5.4,
  },
  {
    seedKey: 'BR-004',
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    providerEmail: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.ENGINE_FAILURE,
    issueDescription:
      'Engine overheating warning on EV trip. Vehicle stopped near Navi Mumbai toll plaza.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.PROVIDER_ASSIGNED,
    location: { type: 'Point', coordinates: [73.0297, 19.033] },
    hoursAgoRequested: 3,
    trackingEnabled: true,
    estimatedArrivalTime: 35,
    estimatedDistance: 8.5,
  },
  {
    seedKey: 'BR-005',
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    providerEmail: `rohan.verma${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.EV_BATTERY_LOW,
    issueDescription: 'EV range at 2%. Need mobile charging assist at office parking.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.IN_PROGRESS,
    location: { type: 'Point', coordinates: [72.91, 19.05] },
    hoursAgoRequested: 5,
    trackingEnabled: true,
    estimatedArrivalTime: 12,
    estimatedDistance: 2.0,
  },
  {
    seedKey: 'BR-006',
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    issueType: IssueType.ACCIDENT,
    issueDescription:
      'Minor rear collision on Thane highway. Airbags did not deploy but vehicle not drivable.',
    priority: RequestPriority.EMERGENCY,
    status: BreakdownStatus.CANCELLED,
    location: { type: 'Point', coordinates: [72.978, 19.218] },
    hoursAgoRequested: 24,
    trackingEnabled: false,
    cancellationReason: 'Customer resolved via insurance tow before provider arrival.',
  },
  {
    seedKey: 'BR-007',
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    providerEmail: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.BRAKE_FAILURE,
    issueDescription: 'Brake pedal feels soft after long drive. Requesting inspection before continuing.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.ARRIVED,
    location: { type: 'Point', coordinates: [73.84, 18.53] },
    hoursAgoRequested: 4,
    trackingEnabled: true,
    estimatedArrivalTime: 0,
    estimatedDistance: 0.3,
  },
  // --- Provider job history & active queue (assignedProviderId) ---
  {
    seedKey: 'BR-008',
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    providerEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.LOCKOUT,
    issueDescription: 'Keys locked inside vehicle at Thane mall parking.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.978, 19.218] },
    hoursAgoRequested: 72,
    trackingEnabled: false,
    serviceCost: 650,
  },
  {
    seedKey: 'BR-009',
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    providerEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.OVERHEATING,
    issueDescription: 'Temperature gauge in red zone after uphill climb.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [73.85, 18.52] },
    hoursAgoRequested: 96,
    trackingEnabled: false,
    serviceCost: 1200,
  },
  {
    seedKey: 'BR-010',
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    providerEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.FLAT_TIRE,
    issueDescription: 'Rear tyre burst near Bandra — need roadside tyre change.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.PROVIDER_ASSIGNED,
    location: { type: 'Point', coordinates: [72.834, 19.06] },
    hoursAgoRequested: 1,
    trackingEnabled: true,
    estimatedArrivalTime: 28,
    estimatedDistance: 6.2,
  },
  {
    seedKey: 'BR-011',
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    providerEmail: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.ENGINE_FAILURE,
    issueDescription: 'Vehicle towed from highway after engine seized.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.97, 19.21] },
    hoursAgoRequested: 100,
    trackingEnabled: false,
    serviceCost: 3500,
  },
  {
    seedKey: 'BR-012',
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    providerEmail: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.ACCIDENT,
    issueDescription: 'Minor fender bender — tow to nearest authorised garage.',
    priority: RequestPriority.EMERGENCY,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.87, 19.08] },
    hoursAgoRequested: 80,
    trackingEnabled: false,
    serviceCost: 2800,
  },
  {
    seedKey: 'BR-013',
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    providerEmail: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.ENGINE_FAILURE,
    issueDescription: 'Strange knocking sound from engine — customer requests tow to workshop.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.ON_THE_WAY,
    location: { type: 'Point', coordinates: [73.86, 18.51] },
    hoursAgoRequested: 3,
    trackingEnabled: true,
    estimatedArrivalTime: 20,
    estimatedDistance: 7.1,
  },
  {
    seedKey: 'BR-014',
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    providerEmail: `arjun.singh${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.BATTERY_FAILURE,
    issueDescription: 'Battery replaced after overnight parking drain.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.98, 19.22] },
    hoursAgoRequested: 50,
    trackingEnabled: false,
    serviceCost: 4200,
  },
  {
    seedKey: 'BR-015',
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    providerEmail: `arjun.singh${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.BATTERY_FAILURE,
    issueDescription: '12V auxiliary battery low on Nexon EV — jump start completed.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [73.02, 19.04] },
    hoursAgoRequested: 40,
    trackingEnabled: false,
    serviceCost: 950,
  },
  {
    seedKey: 'BR-016',
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    providerEmail: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.FUEL_EMPTY,
    issueDescription: '5L petrol delivered after customer misjudged fuel range.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.88, 19.07] },
    hoursAgoRequested: 60,
    trackingEnabled: false,
    serviceCost: 550,
  },
  {
    seedKey: 'BR-017',
    customerEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-RM001',
    providerEmail: `rohan.verma${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.EV_BATTERY_LOW,
    issueDescription: 'Portable charger deployed — customer continued journey.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [73.855, 18.525] },
    hoursAgoRequested: 55,
    trackingEnabled: false,
    serviceCost: 1100,
  },
  {
    seedKey: 'BR-018',
    customerEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-PR001',
    providerEmail: `rohan.verma${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.EV_BATTERY_LOW,
    issueDescription: 'Hybrid SUV requested charge assist at home driveway.',
    priority: RequestPriority.MEDIUM,
    status: BreakdownStatus.ARRIVED,
    location: { type: 'Point', coordinates: [72.872, 19.074] },
    hoursAgoRequested: 6,
    trackingEnabled: true,
    estimatedArrivalTime: 0,
    estimatedDistance: 0.2,
  },
  {
    seedKey: 'BR-019',
    customerEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-KI001',
    providerEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.BRAKE_FAILURE,
    issueDescription: 'Grinding noise from front brakes — pads replaced on-site.',
    priority: RequestPriority.HIGH,
    status: BreakdownStatus.IN_PROGRESS,
    location: { type: 'Point', coordinates: [72.975, 19.215] },
    hoursAgoRequested: 5,
    trackingEnabled: true,
    estimatedArrivalTime: 0,
    estimatedDistance: 0.1,
  },
  {
    seedKey: 'BR-020',
    customerEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    registrationNumber: 'DEMO-MH-AD001',
    providerEmail: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    issueType: IssueType.FUEL_EMPTY,
    issueDescription: 'Diesel top-up for fleet van at BKC business district.',
    priority: RequestPriority.LOW,
    status: BreakdownStatus.COMPLETED,
    location: { type: 'Point', coordinates: [72.87, 19.065] },
    hoursAgoRequested: 120,
    trackingEnabled: false,
    serviceCost: 480,
  },
];

const demoNotifications: DemoNotificationSeed[] = [
  {
    seedKey: 'NT-001',
    userEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    title: 'Provider assigned',
    message: 'Vikram Patil (Patil Roadside Mechanics) is handling your flat tyre request.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.MEDIUM,
    read: true,
    breakdownSeedKey: 'BR-001',
  },
  {
    seedKey: 'NT-002',
    userEmail: `priya.sharma${DEMO_EMAIL_DOMAIN}`,
    title: 'Provider on the way',
    message: 'Arjun Singh is en route for your battery failure request. ETA ~18 minutes.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.HIGH,
    read: false,
    breakdownSeedKey: 'BR-002',
  },
  {
    seedKey: 'NT-003',
    userEmail: `rahul.mehta${DEMO_EMAIL_DOMAIN}`,
    title: 'Provider assigned',
    message: 'Meera Joshi (Joshi Fuel On-Demand) will deliver fuel to your location.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.HIGH,
    read: false,
    breakdownSeedKey: 'BR-003',
  },
  {
    seedKey: 'NT-007',
    userEmail: `vikram.patil${DEMO_EMAIL_DOMAIN}`,
    title: 'New job assigned',
    message: 'Flat tyre request near Bandra — status: provider assigned.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.MEDIUM,
    read: false,
    breakdownSeedKey: 'BR-010',
  },
  {
    seedKey: 'NT-008',
    userEmail: `sneha.kulkarni${DEMO_EMAIL_DOMAIN}`,
    title: 'En route reminder',
    message: 'Engine failure tow for Rahul Mehta — you are marked on the way.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.HIGH,
    read: false,
    breakdownSeedKey: 'BR-013',
  },
  {
    seedKey: 'NT-009',
    userEmail: `meera.joshi${DEMO_EMAIL_DOMAIN}`,
    title: 'Job completed',
    message: 'Fuel delivery for Priya Sharma marked completed.',
    type: NotificationType.REQUEST_COMPLETED,
    priority: NotificationPriority.LOW,
    read: true,
    breakdownSeedKey: 'BR-016',
  },
  {
    seedKey: 'NT-004',
    userEmail: `ananya.desai${DEMO_EMAIL_DOMAIN}`,
    title: 'Tow truck assigned',
    message: 'Kulkarni Tow & Rescue has accepted your engine failure request.',
    type: NotificationType.PROVIDER_ASSIGNED,
    priority: NotificationPriority.MEDIUM,
    read: false,
    breakdownSeedKey: 'BR-004',
  },
  {
    seedKey: 'NT-005',
    userEmail: `karan.iyer${DEMO_EMAIL_DOMAIN}`,
    title: 'Request cancelled',
    message: 'Your emergency accident request was cancelled per your update.',
    type: NotificationType.REQUEST_CANCELLED,
    priority: NotificationPriority.HIGH,
    read: true,
    breakdownSeedKey: 'BR-006',
  },
  {
    seedKey: 'NT-006',
    userEmail: `admin${DEMO_EMAIL_DOMAIN}`,
    title: 'Pilot dashboard',
    message: '20 demo breakdown requests seeded for Road Guard pilot review.',
    type: NotificationType.SYSTEM_NOTIFICATION,
    priority: NotificationPriority.LOW,
    read: false,
  },
];

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

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function breakdownTimestamps(
  status: BreakdownStatus,
  requestedAt: Date,
): {
  assignedAt: Date | null;
  arrivedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
} {
  const plus = (mins: number) => new Date(requestedAt.getTime() + mins * 60 * 1000);
  const assignedAt =
    status !== BreakdownStatus.CREATED &&
    status !== BreakdownStatus.SEARCHING_PROVIDER &&
    status !== BreakdownStatus.CANCELLED
      ? plus(15)
      : null;
  const arrivedAt =
    status === BreakdownStatus.ARRIVED ||
    status === BreakdownStatus.IN_PROGRESS ||
    status === BreakdownStatus.COMPLETED
      ? plus(45)
      : null;
  const completedAt = status === BreakdownStatus.COMPLETED ? plus(90) : null;
  const cancelledAt = status === BreakdownStatus.CANCELLED ? plus(30) : null;
  return { assignedAt, arrivedAt, completedAt, cancelledAt };
}

async function clearDemoData(): Promise<void> {
  const demoUsers = await UserModel.find({
    email: { $regex: /@roadguard\.demo$/i },
  }).select('_id email');

  const userIds = demoUsers.map((u) => u._id);
  if (userIds.length > 0) {
    await NotificationModel.deleteMany({ userId: { $in: userIds } });
    await BreakdownRequestModel.deleteMany({ customerId: { $in: userIds } });
    await VehicleModel.deleteMany({ ownerId: { $in: userIds } });
    await ProviderModel.deleteMany({ userId: { $in: userIds } });
    await UserModel.deleteMany({ _id: { $in: userIds } });
  }

  await NotificationModel.deleteMany({ 'metadata.demoSeedKey': { $exists: true } });
  await BreakdownRequestModel.deleteMany({ notes: { $regex: /^DEMO_SEED:/ } });

  console.log(
    `Removed ${demoUsers.length} demo user(s), vehicles, breakdown requests, and notifications.`,
  );
}

async function loadDemoIdMaps(): Promise<{
  userIds: Map<string, Types.ObjectId>;
  providerIds: Map<string, Types.ObjectId>;
  vehicleIds: Map<string, Types.ObjectId>;
}> {
  const userIds = new Map<string, Types.ObjectId>();
  const providerIds = new Map<string, Types.ObjectId>();
  const vehicleIds = new Map<string, Types.ObjectId>();

  const emails = [
    ...demoCustomers.map((c) => c.email),
    ...demoProviders.map((p) => p.email),
    demoAdmin.email,
  ];

  const users = await UserModel.find({ email: { $in: emails.map((e) => e.toLowerCase()) } }).select(
    '_id email',
  );
  for (const u of users) {
    userIds.set(u.email, u._id);
  }

  const providers = await ProviderModel.find({
    email: { $in: demoProviders.map((p) => p.email.toLowerCase()) },
  }).select('_id email');
  for (const p of providers) {
    providerIds.set(p.email, p._id);
  }

  const vehicles = await VehicleModel.find({
    registrationNumber: { $in: demoVehicles.map((v) => v.registrationNumber) },
  }).select('_id registrationNumber');
  for (const v of vehicles) {
    vehicleIds.set(v.registrationNumber, v._id);
  }

  return { userIds, providerIds, vehicleIds };
}

async function seedDemoVehicles(
  userIds: Map<string, Types.ObjectId>,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const v of demoVehicles) {
    const ownerId = userIds.get(v.customerEmail.toLowerCase());
    if (!ownerId) {
      console.warn(`  (skip vehicle) no user for ${v.customerEmail}`);
      skipped += 1;
      continue;
    }

    const exists = await VehicleModel.findOne({ registrationNumber: v.registrationNumber });
    if (exists) {
      skipped += 1;
      continue;
    }

    await VehicleModel.create({
      ownerId,
      vehicleType: v.vehicleType,
      brand: v.brand,
      vehicleModel: v.vehicleModel,
      year: v.year,
      registrationNumber: v.registrationNumber,
      fuelType: v.fuelType,
      transmissionType: v.transmissionType,
      color: v.color ?? null,
      isPrimaryVehicle: v.isPrimaryVehicle,
      insuranceExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      pollutionExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    created += 1;
  }

  return { created, skipped };
}

async function seedDemoBreakdowns(
  userIds: Map<string, Types.ObjectId>,
  providerIds: Map<string, Types.ObjectId>,
  vehicleIds: Map<string, Types.ObjectId>,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const b of demoBreakdowns) {
    const notes = `${DEMO_SEED_PREFIX}${b.seedKey}`;
    const exists = await BreakdownRequestModel.findOne({ notes });
    if (exists) {
      skipped += 1;
      continue;
    }

    const customerId = userIds.get(b.customerEmail.toLowerCase());
    const vehicleId = vehicleIds.get(b.registrationNumber);
    if (!customerId || !vehicleId) {
      console.warn(`  (skip breakdown ${b.seedKey}) missing customer or vehicle`);
      skipped += 1;
      continue;
    }

    const assignedProviderId = b.providerEmail
      ? (providerIds.get(b.providerEmail.toLowerCase()) ?? null)
      : null;

    const requestedAt = hoursAgo(b.hoursAgoRequested);
    const timestamps = breakdownTimestamps(b.status, requestedAt);

    await BreakdownRequestModel.create({
      customerId,
      vehicleId,
      assignedProviderId,
      issueType: b.issueType,
      issueDescription: b.issueDescription,
      priority: b.priority,
      status: b.status,
      location: b.location,
      requestedAt,
      assignedAt: timestamps.assignedAt,
      arrivedAt: timestamps.arrivedAt,
      completedAt: timestamps.completedAt,
      cancelledAt: timestamps.cancelledAt,
      estimatedArrivalTime: b.estimatedArrivalTime ?? null,
      estimatedDistance: b.estimatedDistance ?? null,
      serviceCost: b.serviceCost ?? null,
      cancellationReason: b.cancellationReason ?? null,
      trackingEnabled: b.trackingEnabled ?? b.status === BreakdownStatus.ON_THE_WAY,
      notes,
    });
    created += 1;
  }

  return { created, skipped };
}

async function seedDemoNotifications(
  userIds: Map<string, Types.ObjectId>,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  const breakdownsByKey = new Map<string, Types.ObjectId>();
  const seededBreakdowns = await BreakdownRequestModel.find({
    notes: { $regex: /^DEMO_SEED:BR-/ },
  }).select('_id notes');
  for (const doc of seededBreakdowns) {
    if (doc.notes) breakdownsByKey.set(doc.notes.replace(DEMO_SEED_PREFIX, ''), doc._id);
  }

  for (const n of demoNotifications) {
    const exists = await NotificationModel.findOne({ 'metadata.demoSeedKey': n.seedKey });
    if (exists) {
      skipped += 1;
      continue;
    }

    const userId = userIds.get(n.userEmail.toLowerCase());
    if (!userId) {
      skipped += 1;
      continue;
    }

    const requestId = n.breakdownSeedKey
      ? breakdownsByKey.get(n.breakdownSeedKey)
      : undefined;

    await NotificationModel.create({
      userId,
      title: n.title,
      message: n.message,
      type: n.type,
      channels: [NotificationChannel.IN_APP],
      status: n.read ? NotificationStatus.READ : NotificationStatus.DELIVERED,
      priority: n.priority,
      readAt: n.read ? hoursAgo(2) : null,
      deliveredAt: hoursAgo(1),
      metadata: {
        demoSeedKey: n.seedKey,
        ...(requestId ? { requestId: requestId.toString() } : {}),
      },
    });
    created += 1;
  }

  return { created, skipped };
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

  console.log('\nSeeding vehicles, breakdown requests, and notifications…');
  const { userIds } = await loadDemoIdMaps();

  const vehicles = await seedDemoVehicles(userIds);
  summary.push(`✓ Vehicles: ${vehicles.created} created, ${vehicles.skipped} skipped`);

  const refreshedMaps = await loadDemoIdMaps();
  const breakdowns = await seedDemoBreakdowns(
    refreshedMaps.userIds,
    refreshedMaps.providerIds,
    refreshedMaps.vehicleIds,
  );
  summary.push(
    `✓ Breakdown requests: ${breakdowns.created} created, ${breakdowns.skipped} skipped`,
  );

  const notifications = await seedDemoNotifications(refreshedMaps.userIds);
  summary.push(
    `✓ Notifications: ${notifications.created} created, ${notifications.skipped} skipped`,
  );

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

Sample data (MongoDB collections):
  • vehicles — 1 per customer (registration DEMO-MH-*)
  • breakdownrequests — 20 requests (customer + provider-assigned jobs)
  • notifications — 9 in-app alerts

Provider dashboards (login as provider → Requests):
  • Each provider has completed jobs + active jobs (assigned / on the way / arrived / in progress)

Re-run with --reset to wipe all @roadguard.demo data and re-seed.
`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
