import { BlurView } from 'expo-blur';
import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, radius } from '../theme';

type GlassBackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

// The back control for auth screens (design.md section 3g): a frosted glass pill, not a bare
// icon. 44pt square, the minimum touch target.
export function GlassBackButton({ onPress, accessibilityLabel = 'Go back' }: GlassBackButtonProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      {/* Wrapped in a View so it stacks above the blur layer on web; a bare SVG would not. */}
      <View>
        <ArrowLeft color={colors.text.primary} size={20} strokeWidth={1.5} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: colors.surface.glass,
  },
});
