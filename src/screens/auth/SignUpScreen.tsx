import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Moon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/Button';
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
    // The button stays solid blue rather than greying out while the form is incomplete, so
    // an early tap says what is missing instead.
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }
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
      <AuthLayout onBack={() => navigation.navigate('Welcome')} backLabel="Back to welcome">
        <Moon color={colors.text.secondary} size={32} strokeWidth={1.5} />
        <View style={styles.header}>
          <Text style={[typography.heroTitle, styles.title]}>Check your email</Text>
          <Text style={[typography.body, styles.subtitle]}>
            We sent a confirmation link to {email}. Verify to start logging your dreams.
          </Text>
        </View>
        <Button
          label="Back to sign in"
          labelColor={colors.text.primary}
          onPress={() => navigation.navigate('SignIn')}
          style={styles.button}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={() => navigation.navigate('Welcome')} backLabel="Back to welcome">
      <Moon color={colors.text.secondary} size={32} strokeWidth={1.5} />
      <View style={styles.header}>
        <Text style={[typography.heroTitle, styles.title]}>Create your account</Text>
        <Text style={[typography.body, styles.subtitle]}>Start your journey tonight.</Text>
      </View>

      <View style={styles.form}>
        <TextField
          variant="glass"
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
        />
        <TextField
          variant="glass"
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="Password (at least 6 characters)"
        />
      </View>

      {error ? (
        <Arrive from="down">
          <Text style={[typography.label, styles.error]}>{error}</Text>
        </Arrive>
      ) : null}

      <Button
        label="Create account"
        labelColor={colors.text.primary}
        onPress={handleSignUp}
        loading={loading}
        style={styles.button}
      />

      <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footer}>
        <Text style={[typography.body, styles.footerText]}>
          Already have an account? <Text style={styles.footerLink}>Sign in</Text>
        </Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text.primary,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.status.danger,
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: 'stretch',
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
