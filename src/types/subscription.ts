export type SubscriptionTier = 'bronze' | 'silver' | 'gold';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  points: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  benefits: {
    discountPercentage: number;
    freeShipping: boolean;
    exclusiveDeals: boolean;
    birthdayBonus: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PointsHistory {
  id: string;
  userId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
} as const;

export const TIER_BENEFITS = {
  bronze: {
    discountPercentage: 0,
    freeShipping: false,
    exclusiveDeals: false,
    birthdayBonus: 50,
  },
  silver: {
    discountPercentage: 5,
    freeShipping: true,
    exclusiveDeals: true,
    birthdayBonus: 100,
  },
  gold: {
    discountPercentage: 10,
    freeShipping: true,
    exclusiveDeals: true,
    birthdayBonus: 200,
  },
} as const;
