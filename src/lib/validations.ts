import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'Email invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' }),
  confirmPassword: z.string(),
  firstName: z.string().min(2, { message: 'Le prénom est requis' }),
  lastName: z.string().min(2, { message: 'Le nom est requis' }),
  phone: z.string().regex(/^(\+212|0)[5-7]\d{8}$/, { message: 'Numéro de téléphone invalide' }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
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
