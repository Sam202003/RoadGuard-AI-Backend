import { AdminService } from './services/admin.service.js';

let adminService: AdminService | null = null;

export function initAdminModule(): void {
  adminService = new AdminService();
}

export function getAdminService(): AdminService {
  if (!adminService) {
    throw new Error('Admin module not initialized');
  }
  return adminService;
}

export { adminRouter } from './routes/admin.routes.js';
