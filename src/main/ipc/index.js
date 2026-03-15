import { registerMedicineIpcHandlers } from './medicine.ipc.js';
import { registerBatchIpcHandlers } from './batch.ipc.js';
import { registerSaleIpcHandlers } from './sale.ipc.js';
import { registerReturnIpcHandlers } from './return.ipc.js';
import { registerCustomerIpcHandlers } from './customer.ipc.js';
import { registerPaymentIpcHandlers } from './payment.ipc.js';
import { registerReportIpcHandlers } from './report.ipc.js';
import { registerAuthIpcHandlers } from './auth.ipc.js';

import { registerBrandIpcHandlers } from './brand.ipc.js';
import { registerUserIpcHandlers } from './user.ipc.js';

export function registerIpcHandlers() {
  registerMedicineIpcHandlers();
  registerBatchIpcHandlers();
  registerSaleIpcHandlers();
  registerReturnIpcHandlers();
  registerCustomerIpcHandlers();
  registerPaymentIpcHandlers();
  registerReportIpcHandlers();
  registerAuthIpcHandlers();
  registerBrandIpcHandlers();
  registerUserIpcHandlers();
  
  console.log('IPC handlers registered for all domains.');
}
