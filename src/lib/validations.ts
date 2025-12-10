import { z } from 'zod';

// Helper type for translation function
type TranslateFn = (key: string, values?: Record<string, any>) => string;

// Dynamic Auth validations
export const createLoginSchema = (t: TranslateFn) => z.object({
  email: z
    .string({ message: t('validation.emailRequired') })
    .min(1, { message: t('validation.emailRequired') })
    .email({ message: t('validation.invalidEmail') })
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: t('validation.passwordRequired') })
    .min(1, { message: t('validation.passwordRequired') })
    .min(8, { message: t('validation.passwordMinLength') })
    .max(100, { message: t('validation.passwordTooLong') }),
});

export const createRegisterSchema = (t: TranslateFn) => z.object({
  name: z
    .string({ message: t('validation.required') })
    .min(1, { message: t('validation.required') })
    .min(3, { message: t('validation.minLength', { min: 3 }) })
    .max(100, { message: t('validation.maxLength', { max: 100 }) })
    .regex(/^[a-zA-ZÀ-ÿ\s\u0600-\u06FF]+$/, { message: t('validation.nameLettersOnly') })
    .trim(),
  email: z
    .string({ message: t('validation.emailRequired') })
    .min(1, { message: t('validation.emailRequired') })
    .email({ message: t('validation.invalidEmail') })
    .toLowerCase()
    .trim(),
  phone: z
    .string({ message: t('validation.phoneRequired') })
    .min(1, { message: t('validation.phoneRequired') })
    .regex(/^(\+212|0)[5-7]\d{8}$/, {
      message: t('validation.phoneFormat')
    })
    .trim(),
  password: z
    .string({ message: t('validation.passwordRequired') })
    .min(1, { message: t('validation.passwordRequired') })
    .min(8, { message: t('validation.minLength', { min: 8 }) })
    .max(100, { message: t('validation.passwordTooLong') })
    .regex(/[A-Z]/, { message: t('validation.passwordUppercase') })
    .regex(/[a-z]/, { message: t('validation.passwordLowercase') })
    .regex(/[0-9]/, { message: t('validation.passwordNumber') }),
  confirmPassword: z
    .string({ message: t('validation.confirmPasswordRequired') })
    .min(1, { message: t('validation.confirmPasswordRequired') }),
  role: z
    .enum(['client', 'artisan-promoter'], {
      message: t('validation.roleRequired')
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('validation.passwordsNotMatch'),
  path: ['confirmPassword'],
});

// Static schemas (legacy - for backward compatibility)
export const loginSchema = z.object({
  email: z
    .string({ message: 'L\'email est requis' })
    .min(1, { message: 'L\'email est requis' })
    .email({ message: 'Adresse email invalide' })
    .toLowerCase()
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est requis' })
    .min(1, { message: 'Le mot de passe est requis' })
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .max(100, { message: 'Le mot de passe est trop long' }),
});

export const registerSchema = z.object({
  name: z
    .string({ message: 'Le nom complet est requis' })
    .min(1, { message: 'Le nom complet est requis' })
    .min(3, { message: 'Le nom doit contenir au moins 3 caractères' })
    .max(100, { message: 'Le nom est trop long' })
    .regex(/^[a-zA-ZÀ-ÿ\s\u0600-\u06FF]+$/, { message: 'Le nom ne peut contenir que des lettres' })
    .trim(),
  email: z
    .string({ message: 'L\'email est requis' })
    .min(1, { message: 'L\'email est requis' })
    .email({ message: 'Adresse email invalide' })
    .toLowerCase()
    .trim(),
  phone: z
    .string({ message: 'Le numéro de téléphone est requis' })
    .min(1, { message: 'Le numéro de téléphone est requis' })
    .regex(/^(\+212|0)[5-7]\d{8}$/, {
      message: 'Format invalide. Ex: 0612345678 ou +212612345678'
    })
    .trim(),
  password: z
    .string({ message: 'Le mot de passe est requis' })
    .min(1, { message: 'Le mot de passe est requis' })
    .min(8, { message: 'Minimum 8 caractères' })
    .max(100, { message: 'Le mot de passe est trop long' })
    .regex(/[A-Z]/, { message: 'Doit contenir au moins une majuscule' })
    .regex(/[a-z]/, { message: 'Doit contenir au moins une minuscule' })
    .regex(/[0-9]/, { message: 'Doit contenir au moins un chiffre' }),
  confirmPassword: z
    .string({ message: 'La confirmation est requise' })
    .min(1, { message: 'Veuillez confirmer votre mot de passe' }),
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
