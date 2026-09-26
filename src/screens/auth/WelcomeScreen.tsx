import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Arrive style={styles.hero}>
          <Text style={[typography.displayLg, styles.title]}>Nocturnal</Text>
          <Text style={[typography.subheading, styles.tagline]}>Control Your Dreams</Text>
        </Arrive>

        <Arrive delay={80} style={styles.actions}>
          <Button label="Sign in" onPress={() => navigation.navigate('SignIn')} />
          <Button
            label="Create account"
            variant="secondary"
            onPress={() => navigation.navigate('Preview')}
          />
        </Arrive>
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
