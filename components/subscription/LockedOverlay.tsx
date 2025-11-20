// components/subscription/LockedOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  children: React.ReactNode;
  message?: string;
};

export default function LockedOverlay({ children, message }: Props) {
  return (
    <View style={styles.wrapper}>
      {children}
      <View style={styles.overlay}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.text}>{message ?? 'Dostępne w planie PRO'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  lockIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
