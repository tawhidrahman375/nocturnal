import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Button } from './Button';
import { TextField } from './TextField';
import { colors, radius, spacing, typography } from '../theme';

type NewDreamSheetProps = {
  visible: boolean;
  // Pre-fills "What happened?" (a voice recording's transcript). Read once when the sheet
  // mounts, so the caller remounts it with a new `key` to hand it a different one.
  initialContent?: string;
  onClose: () => void;
  onSubmit: (dream: {
    title: string;
    content: string;
    is_lucid: boolean;
    tags: string[];
  }) => Promise<void>;
};

function parseTags(input: string) {
  return [...new Set(input.split(',').map((tag) => tag.trim()).filter(Boolean))];
}

export function NewDreamSheet({ visible, initialContent, onClose, onSubmit }: NewDreamSheetProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent ?? '');
  const [tagsInput, setTagsInput] = useState('');
  const [isLucid, setIsLucid] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setIsLucid(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSubmit({
      title: title.trim() || 'Untitled dream',
      content: content.trim(),
      is_lucid: isLucid,
      tags: parseTags(tagsInput),
    });
    setSaving(false);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={[typography.heading, styles.headerTitle]}>Log a dream</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color={colors.text.secondary} size={22} strokeWidth={1.5} />
            </Pressable>
          </View>

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
            <Button label="Save dream" onPress={handleSave} loading={saving} style={styles.saveButton} />
          </View>
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
  // Full width; buttons otherwise hug their label.
  saveButton: {
    alignSelf: 'stretch',
  },
});
