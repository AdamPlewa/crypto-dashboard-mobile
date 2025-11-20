// src/context/SubscriptionContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToUserSubscription } from '../services/subscription';
import type { SubscriptionData, SubscriptionPlanId } from '../../constants/subscription';
import { DEFAULT_SUBSCRIPTION } from '../../constants/subscription';

type SubscriptionCtxValue = {
  subscription: SubscriptionData;
  isLoading: boolean;
  isActive: boolean;
  hasPlan: (minPlan: SubscriptionPlanId) => boolean;
};

const SubscriptionCtx = createContext<SubscriptionCtxValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>(DEFAULT_SUBSCRIPTION);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setSubscription(DEFAULT_SUBSCRIPTION);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToUserSubscription(user.uid, (sub) => {
      setSubscription(sub);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  const value = useMemo<SubscriptionCtxValue>(() => {
    const order: SubscriptionPlanId[] = ['free', 'pro', 'enterprise'];

    const hasPlan = (minPlan: SubscriptionPlanId) => {
      const currentIdx = order.indexOf(subscription.plan);
      const requiredIdx = order.indexOf(minPlan);
      if (currentIdx === -1 || requiredIdx === -1) return false;
      return currentIdx >= requiredIdx;
    };

    return {
      subscription,
      isLoading,
      isActive: subscription.status === 'active',
      hasPlan,
    };
  }, [subscription, isLoading]);

  return <SubscriptionCtx.Provider value={value}>{children}</SubscriptionCtx.Provider>;
}

export function useSubscriptionContext(): SubscriptionCtxValue {
  const ctx = useContext(SubscriptionCtx);
  if (!ctx) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return ctx;
}
