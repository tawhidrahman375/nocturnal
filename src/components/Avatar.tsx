import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

type AvatarProps = {
  url: string | null;
  label: string;
  size?: number;
};

function initialsFor(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Circular avatar — a Supabase Storage image when one is set, otherwise initials derived
// from the display name (or email, for accounts without one) on the same accent-muted
// fill used elsewhere for icon badges (e.g. InsightsScreen's coachIconWrap).
export function Avatar({ url, label, size = 72 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={dimension} />;
  }

  return (
    <View style={[dimension, styles.fallback]}>
      <Text style={[typography.heading, styles.initials, { fontSize: size * 0.36 }]}>
        {initialsFor(label)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.accent.primary,
  },
});
