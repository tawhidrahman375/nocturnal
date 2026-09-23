import { LogOut } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.displayMd, styles.title]}>You</Text>
      </View>

      <Card style={styles.card}>
        <Text style={[typography.label, styles.label]}>Signed in as</Text>
        <Text style={[typography.bodyMedium, styles.email]}>{user?.email}</Text>
      </Card>

      <Pressable style={styles.signOutRow} onPress={signOut}>
        <LogOut color="#F87171" size={18} strokeWidth={1.5} />
        <Text style={[typography.bodyMedium, styles.signOutText]}>Sign out</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
  },
  card: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.tertiary,
  },
  email: {
    color: colors.text.primary,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  signOutText: {
    color: '#F87171',
  },
});
