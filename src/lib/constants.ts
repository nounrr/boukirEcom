export const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Fès',
  'Marrakech',
  'Agadir',
  'Tanger',
  'Meknès',
  'Oujda',
  'Kénitra',
  'Tétouan',
  'Safi',
  'Temara',
  'Mohammedia',
  'El Jadida',
  'Khouribga',
  'Béni Mellal',
  'Nador',
  'Settat',
  'Khémisset',
  'Inezgane',
  'Berkane',
  'Taza',
  'Ksar El Kebir',
  'Larache',
  'Guelmim',
  'Berrechid',
  'Oued Zem',
  'Fquih Ben Salah',
  'Errachidia',
  'Sidi Slimane',
] as const;

export const SHIPPING_RATES = {
  'Casablanca': 0,
  'Rabat': 20,
  'Fès': 35,
  'Marrakech': 35,
  'Agadir': 50,
  'Tanger': 40,
  'default': 45,
} as const;

export const PAYMENT_METHODS = [
  { value: 'cash_on_delivery', label: 'Paiement à la livraison', labelAr: 'الدفع عند الاستلام' },
  { value: 'credit_card', label: 'Carte bancaire', labelAr: 'بطاقة بنكية' },
  { value: 'bank_transfer', label: 'Virement bancaire', labelAr: 'تحويل بنكي' },
] as const;

export const ORDER_STATUSES = {
  pending: { label: 'En attente', labelAr: 'في الانتظار', color: 'yellow' },
  confirmed: { label: 'Confirmée', labelAr: 'مؤكدة', color: 'blue' },
  processing: { label: 'En préparation', labelAr: 'قيد التحضير', color: 'orange' },
  shipped: { label: 'Expédiée', labelAr: 'تم الشحن', color: 'purple' },
  delivered: { label: 'Livrée', labelAr: 'تم التسليم', color: 'green' },
  cancelled: { label: 'Annulée', labelAr: 'ملغاة', color: 'red' },
} as const;

export const PHONE_REGEX = /^(\+212|0)[5-7]\d{8}$/;

export const POINTS_PER_DIRHAM = 1;
export const DIRHAMS_PER_POINT = 0.01; // 100 points = 1 MAD

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_CART_QUANTITY = 99;
