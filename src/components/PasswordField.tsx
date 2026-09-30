import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInputProps } from 'react-native';
import { TextField } from './TextField';
import { colors } from '../theme';

type PasswordFieldProps = Omit<TextInputProps, 'secureTextEntry'>;

// A glass password field with a show/hide toggle on its right: just the icon, no border or
// background. The eye means "tap to show"; the crossed-out eye means "tap to hide".
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      variant="glass"
      secureTextEntry={!visible}
      accessory={
        <Pressable
          onPress={() => setVisible((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          style={styles.toggle}
        >
          <Icon color={colors.text.secondary} size={20} strokeWidth={1.5} />
        </Pressable>
      }
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  // A 44pt square touch target around the bare icon.
  toggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
