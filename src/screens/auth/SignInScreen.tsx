import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Moon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Arrive } from '../../components/Arrive';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/Button';
import { PasswordField } from '../../components/PasswordField';
import { TextField } from '../../components/TextField';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    // The button stays solid blue rather than greying out while the form is empty, so an
    // empty tap says what is missing instead.
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    const { error: signInError } = await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (signInError) setError(signInError);
  };

  return (
    <AuthLayout onBack={() => navigation.navigate('Welcome')} backLabel="Back to welcome">
      <Moon color={colors.text.secondary} size={32} strokeWidth={1.5} />
      <View style={styles.header}>
        <Text style={[typography.heroTitle, styles.title]}>Welcome back</Text>
        <Text style={[typography.body, styles.subtitle]}>Sign in to pick up your dream journal.</Text>
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
        <PasswordField
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Password"
        />
      </View>

      {error ? (
        <Arrive from="down">
          <Text style={[typography.label, styles.error]}>{error}</Text>
        </Arrive>
      ) : null}

      <Button
        label="Sign in"
        labelColor={colors.text.primary}
        onPress={handleSignIn}
        loading={loading}
        style={styles.button}
      />

      <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.footer}>
        <Text style={[typography.body, styles.footerText]}>
          New here? <Text style={styles.footerLink}>Create an account</Text>
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
