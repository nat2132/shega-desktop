import { z } from 'zod';

const optionalString = z.union([z.string(), z.null()]).optional().nullable();
const optionalNumber = z.union([z.number(), z.null()]).optional().nullable();

export const saleSchema = z.object({
  itemId: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: z.string().max(50).optional(),
  unitType: z.string().max(20).optional(),
  discount: z.number().nonnegative().optional(),
  vat: z.number().nonnegative().optional(),
  taxType: z.string().max(20).optional(),
  totalPrice: z.number().nonnegative(),
  paymentMethod: z.string().max(50).optional(),
  paymentStatus: z.string().max(20).optional(),
  customerName: optionalString,
  customerPhone: optionalString,
  packId: optionalNumber,
  dueDate: optionalString,
  paidAmount: z.number().nonnegative().optional(),
  notes: optionalString,
  batchId: optionalString,
  orderNumber: optionalString,
});

export const saleBatchSchema = z.array(saleSchema);

export const saleUpdateSchema = z.object({
  itemId: z.number().int().positive().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().max(50).optional(),
  unitType: z.string().max(20).optional(),
  discount: z.number().nonnegative().optional(),
  vat: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
  paymentMethod: z.string().max(50).optional(),
  paymentStatus: z.string().max(20).optional(),
  customerName: optionalString,
  customerPhone: optionalString,
  dueDate: optionalString,
  paidAmount: z.number().nonnegative().optional(),
});

export const payDebtSchema = z.object({
  saleId: z.number().int().positive(),
  amount: z.number().positive(),
  type: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
});

export const orderConversionSchema = z.object({
  orderId: z.number().int().positive(),
  paymentMethod: z.string().max(50).optional(),
  discount: z.number().nonnegative().optional(),
  vat: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || 'value'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid ${label}: ${issues}`);
  }
  return result.data;
}