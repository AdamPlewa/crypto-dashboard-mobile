// src/services/subscription.ts
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SubscriptionData } from '../../constants/subscription';
import { DEFAULT_SUBSCRIPTION } from '../../constants/subscription';

/**
 * Subskrybuje dokument users/{uid} w Firestore i zwraca aktualne dane subskrypcji.
 * Zwracana funkcja `unsubscribe` powinna być wywołana w cleanup useEffect.
 */
export function subscribeToUserSubscription(
  uid: string,
  callback: (sub: SubscriptionData) => void
) {
  const ref = doc(db, 'users', uid);

  return onSnapshot(ref, async (snap) => {
    if (!snap.exists()) {
      // jeśli dokument nie istnieje — ustaw domyślną subskrypcję "free"
      await setDoc(
        ref,
        {
          plan: DEFAULT_SUBSCRIPTION.plan,
          subscriptionStatus: DEFAULT_SUBSCRIPTION.status,
        },
        { merge: true }
      );
      callback(DEFAULT_SUBSCRIPTION);
      return;
    }

    const data = snap.data() as any;

    const sub: SubscriptionData = {
      plan: (data.plan as SubscriptionData['plan']) ?? DEFAULT_SUBSCRIPTION.plan,
      status:
        (data.subscriptionStatus as SubscriptionData['status']) ??
        (data.status as SubscriptionData['status']) ??
        DEFAULT_SUBSCRIPTION.status,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    };

    callback(sub);
  });
}
