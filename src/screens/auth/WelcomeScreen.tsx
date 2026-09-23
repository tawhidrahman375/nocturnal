import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={[typography.displayLg, styles.title]}>Nocturnal</Text>
          <Text style={[typography.subheading, styles.tagline]}>Control Your Dreams</Text>
        </View>

        <View style={styles.actions}>
          <Button label="Sign in" onPress={() => navigation.navigate('SignIn')} />
          <Button
            label="Create account"
            variant="secondary"
            onPress={() => navigation.navigate('SignUp')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text.primary,
  },
  tagline: {
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
});
