import { useState } from 'react';
import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { HubHeader } from '@/src/hub/HubHeader';
import { FloatingHubNav } from '@/src/nav/FloatingHubNav';
import { ProfileSheet } from '@/src/hub/ProfileSheet';
import { colors } from '@/src/theme/tokens';

export default function HubLayout() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <View style={styles.root}>
      <HubHeader onProfilePress={() => setProfileOpen(true)} />
      <View style={styles.body}>
        <Slot />
      </View>
      <FloatingHubNav />
      <ProfileSheet visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
  },
});
