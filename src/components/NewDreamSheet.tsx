import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CircleCheck, X } from 'lucide-react-native';
import { Button } from './Button';
import { TextField } from './TextField';
import { PopIn } from './PopIn';
import { MIN_DREAMS_FOR_INSIGHT } from '../lib/aiInsight';
import { colors, radius, spacing, typography } from '../theme';

type NewDreamSheetProps = {
  visible: boolean;
  // Pre-fills "What happened?" (a voice recording's transcript). Read once when the sheet
  // mounts, so the caller remounts it with a new `key` to hand it a different one.
  initialContent?: string;
  // How many dreams the journal holds right now, so the success view can say what is next.
  dreamCount: number;
  onClose: () => void;
  onSeeInsights: () => void;
  // Resolves with an error message when the save failed, so the sheet can stay open with
  // the entry still in it instead of closing over a lost dream.
  onSubmit: (dream: {
    title: string;
    content: string;
    is_lucid: boolean;
    tags: string[];
  }) => Promise<{ error: string | null }>;
};

function parseTags(input: string) {
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

export function NewDreamSheet({
  visible,
  initialContent,
  dreamCount,
  onClose,
  onSeeInsights,
  onSubmit,
}: NewDreamSheetProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent ?? '');
  const [tagsInput, setTagsInput] = useState('');
  const [isLucid, setIsLucid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedWasLucid, setSavedWasLucid] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setIsLucid(false);
    setSaved(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const { error } = await onSubmit({
      title: title.trim() || 'Untitled dream',
      content: content.trim(),
      is_lucid: isLucid,
      tags: parseTags(tagsInput),
    });
    setSaving(false);
    if (error) {
      setSaveError("Couldn't save this dream. Check your connection and try again. Your entry is still here.");
      return;
    }
    setSavedWasLucid(isLucid);
    setSaved(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const remaining = Math.max(0, MIN_DREAMS_FOR_INSIGHT - dreamCount);
  const showInsightsAction = remaining === 0 && !savedWasLucid;
  const nextLine = savedWasLucid
    ? 'Marked as lucid in your journal. Note what let you realise, it is the trigger to repeat.'
    : remaining > 0
      ? `${remaining} more ${remaining === 1 ? 'dream' : 'dreams'} and Cleo can start finding patterns across them.`
      : 'Cleo is reading it for patterns now. Your insights update as you go.';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[typography.heading, styles.headerTitle]}>{saved ? 'Dream saved' : 'Log a dream'}</Text>
            <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <X color={colors.text.secondary} size={22} strokeWidth={1.5} />
            </Pressable>
          </View>

          {saved ? (
            <View style={styles.success}>
              <PopIn>
                <CircleCheck color={colors.status.lucid} size={40} strokeWidth={1.5} />
              </PopIn>
              <Text style={[typography.subheading, styles.successTitle]}>Saved to your journal</Text>
              <Text style={[typography.body, styles.successBody]}>{nextLine}</Text>
              {showInsightsAction ? (
                <Button
                  label="See your insights"
                  onPress={() => {
                    handleClose();
                    onSeeInsights();
                  }}
                  style={styles.saveButton}
                />
              ) : null}
              <Button
                label="Done"
                variant={showInsightsAction ? 'ghost' : 'primary'}
                onPress={handleClose}
                style={styles.saveButton}
              />
            </View>
          ) : (
          <View style={styles.form}>
            <TextField
              variant="glass"
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="A brief title"
            />
            <TextField
              variant="glass"
              label="What happened?"
              value={content}
              onChangeText={setContent}
              placeholder="Write what you remember..."
              multiline
              numberOfLines={5}
              style={styles.textArea}
            />
            <TextField
              variant="glass"
              label="Dream signs"
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="flying, teeth falling out, being chased"
            />
            <Pressable
              style={[styles.lucidToggle, isLucid && styles.lucidToggleActive]}
              onPress={() => setIsLucid((v) => !v)}
            >
              <Text style={[typography.bodyMedium, isLucid ? styles.lucidTextActive : styles.lucidText]}>
                This was a lucid dream
              </Text>
            </Pressable>
            {saveError ? <Text style={[typography.label, styles.errorText]}>{saveError}</Text> : null}
            <Button label="Save dream" onPress={handleSave} loading={saving} style={styles.saveButton} />
          </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 6, 12, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: colors.text.primary,
  },
  form: {
    gap: spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  // A glass pill, not an outlined one: it fills with the accent when on.
  lucidToggle: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.surface.glassSoft,
  },
  lucidToggleActive: {
    backgroundColor: colors.accent.primary,
  },
  lucidText: {
    color: colors.text.primary,
  },
  lucidTextActive: {
    color: '#FFFFFF',
  },
  success: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  successTitle: {
    color: colors.text.primary,
  },
  successBody: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.status.danger,
  },
  // Full width; buttons otherwise hug their label.
  saveButton: {
    alignSelf: 'stretch',
  },
});
