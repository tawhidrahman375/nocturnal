import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { TextField } from '../../../components/TextField';
import { colors, spacing, typography } from '../../../theme';

type RecallStageProps = {
  onSave: (recall: string) => void;
  onSkip: () => void;
};

export function RecallStage({ onSave, onSkip }: RecallStageProps) {
  const [recall, setRecall] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.copy}>
          <Text style={[typography.displayMd, styles.title]}>What were you dreaming?</Text>
          <Text style={[typography.body, styles.body]}>
            Keep your eyes soft and replay the last scene before it fades. Where were you? Who was
            there? How did it feel?
          </Text>
        </View>
        <TextField
          value={recall}
          onChangeText={setRecall}
          placeholder="Fragments are fine..."
          multiline
          style={styles.input}
        />
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label="Save to journal"
          onPress={() => onSave(recall.trim())}
          disabled={!recall.trim()}
        />
        <Button label="Nothing comes to mind" variant="secondary" onPress={onSkip} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text.primary,
  },
  body: {
    color: colors.text.secondary,
  },
  input: {
    height: 180,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  actions: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
});
