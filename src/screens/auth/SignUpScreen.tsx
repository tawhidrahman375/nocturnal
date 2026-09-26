import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    const { error: signUpError } = await signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (signUpError) {
      setError(signUpError);
    } else {
      setConfirmationSent(true);
    }
  };

  if (confirmationSent) {
    return (
      <ScreenContainer glow>
        <Arrive style={styles.content}>
          <View style={styles.header}>
            <Text style={[typography.displayMd, styles.title]}>Check your email</Text>
            <Text style={[typography.body, styles.subtitle]}>
              We sent a confirmation link to {email}. Verify to start logging your dreams.
            </Text>
          </View>
          <Button label="Back to sign in" onPress={() => navigation.navigate('SignIn')} />
        </Arrive>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer glow>
      <Arrive style={styles.content}>
        <View style={styles.header}>
          <Text style={[typography.displayMd, styles.title]}>Create account</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Start building your dream journal and streak.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            placeholder="At least 6 characters"
          />
          {error ? (
            <Arrive from="down">
              <Text style={[typography.label, styles.error]}>{error}</Text>
            </Arrive>
          ) : null}
          <Button
            label="Create account"
            onPress={handleSignUp}
            loading={loading}
            disabled={!email || password.length < 6}
          />
        </View>

        <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footer}>
          <Text style={[typography.body, styles.footerText]}>
            Already have an account? <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </Pressable>
      </Arrive>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: '#F87171',
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  footerText: {
    color: colors.text.secondary,
  },
  footerLink: {
    color: colors.accent.primary,
  },
});
