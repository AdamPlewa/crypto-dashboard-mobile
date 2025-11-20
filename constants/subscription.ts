// constants/subscription.ts
export type SubscriptionPlanId = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export type SubscriptionData = {
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  currentPeriodEnd?: number | null;
};

export const DEFAULT_SUBSCRIPTION: SubscriptionData = {
  plan: 'free',
  status: 'none',
};

export type FeatureKey = 'basic_dashboard' | 'advanced_charts' | 'watchlist';

export const PLAN_FEATURES: Record<SubscriptionPlanId, FeatureKey[]> = {
  free: ['basic_dashboard'],
  pro: ['basic_dashboard', 'advanced_charts', 'watchlist'],
  enterprise: ['basic_dashboard', 'advanced_charts', 'watchlist'],
};
