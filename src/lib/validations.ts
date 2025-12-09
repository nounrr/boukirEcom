import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z
    .string({ message: 'البريد الإلكتروني مطلوب' })
    .min(1, { message: 'البريد الإلكتروني مطلوب' })
    .email({ message: 'عنوان البريد الإلكتروني غير صالح' })
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'كلمة المرور مطلوبة' })
    .min(1, { message: 'كلمة المرور مطلوبة' })
    .min(8, { message: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل' })
    .max(100, { message: 'كلمة المرور طويلة جداً' }),
});

export const registerSchema = z.object({
  name: z
    .string({ message: 'الاسم الكامل مطلوب' })
    .min(1, { message: 'الاسم الكامل مطلوب' })
    .min(3, { message: 'يجب أن يحتوي الاسم على 3 أحرف على الأقل' })
    .max(100, { message: 'الاسم طويل جداً' })
    .regex(/^[a-zA-ZÀ-ÿ\s\u0600-\u06FF]+$/, { message: 'الاسم يمكن أن يحتوي على أحرف فقط' })
    .trim(),
  email: z
    .string({ message: 'البريد الإلكتروني مطلوب' })
    .min(1, { message: 'البريد الإلكتروني مطلوب' })
    .email({ message: 'عنوان البريد الإلكتروني غير صالح' })
    .toLowerCase()
    .trim(),
  phone: z
    .string({ message: 'رقم الهاتف مطلوب' })
    .min(1, { message: 'رقم الهاتف مطلوب' })
    .regex(/^(\+212|0)[5-7]\d{8}$/, {
      message: 'صيغة غير صحيحة. مثال: 0612345678 أو +212612345678'
    })
    .trim(),
  password: z
    .string({ message: 'كلمة المرور مطلوبة' })
    .min(1, { message: 'كلمة المرور مطلوبة' })
    .min(8, { message: 'على الأقل 8 أحرف' })
    .max(100, { message: 'كلمة المرور طويلة جداً' })
    .regex(/[A-Z]/, { message: 'يجب أن تحتوي على حرف كبير واحد على الأقل' })
    .regex(/[a-z]/, { message: 'يجب أن تحتوي على حرف صغير واحد على الأقل' })
    .regex(/[0-9]/, { message: 'يجب أن تحتوي على رقم واحد على الأقل' }),
  confirmPassword: z
    .string({ message: 'التأكيد مطلوب' })
    .min(1, { message: 'يرجى تأكيد كلمة المرور' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

// Address validation
export const addressSchema = z.object({
  firstName: z.string().min(2, { message: 'Le prénom est requis' }),
  lastName: z.string().min(2, { message: 'Le nom est requis' }),
  phone: z.string().regex(/^(\+212|0)[5-7]\d{8}$/, { message: 'Numéro de téléphone invalide' }),
  address: z.string().min(10, { message: 'L\'adresse doit contenir au moins 10 caractères' }),
  city: z.string().min(2, { message: 'La ville est requise' }),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// Checkout validation
export const checkoutSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer']),
  notes: z.string().max(500).optional(),
  pointsToRedeem: z.number().min(0).optional(),
});

// Product review validation
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(5, { message: 'Le titre doit contenir au moins 5 caractères' }),
  comment: z.string().min(20, { message: 'Le commentaire doit contenir au moins 20 caractères' }),
});

// Contact form validation
export const contactSchema = z.object({
  name: z.string().min(2, { message: 'Le nom est requis' }),
  email: z.string().email({ message: 'Email invalide' }),
  phone: z.string().regex(/^(\+212|0)[5-7]\d{8}$/, { message: 'Numéro de téléphone invalide' }).optional(),
  subject: z.string().min(5, { message: 'Le sujet est requis' }),
  message: z.string().min(20, { message: 'Le message doit contenir au moins 20 caractères' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
