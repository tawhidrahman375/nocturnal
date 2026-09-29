import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { ScreenContainer } from '../../components/ScreenContainer';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../lib/legalContent';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LegalDocument'>;

export function LegalDocumentScreen({ navigation, route }: Props) {
  const doc = route.params.doc === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[typography.label, styles.eyebrow]}>Legal</Text>
          <Text style={[typography.displayMd, styles.title]}>{doc.title}</Text>
        </View>
        <AnimatedPressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Arrive>
          <Text style={[typography.label, styles.updated]}>Last updated {doc.lastUpdated}</Text>
        </Arrive>

        {doc.sections.map((section, index) => (
          <Arrive key={section.heading} delay={Math.min(40 + index * 20, 300)}>
            <View style={styles.section}>
              <Text style={[typography.subheading, styles.sectionHeading]}>
                {index + 1}. {section.heading}
              </Text>
              {section.bullets ? (
                <View style={styles.bulletList}>
                  {section.bullets.map((bullet, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={[typography.body, styles.bulletText]}>{bullet}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {section.paragraphs?.map((paragraph, i) => (
                <Text key={i} style={[typography.body, styles.paragraph]}>
                  {paragraph}
                </Text>
              ))}
            </View>
          </Arrive>
        ))}

        <Arrive delay={340}>
          <AnimatedPressable
            onPress={() => Linking.openURL(`mailto:${doc.contactEmail}`)}
            hitSlop={8}
            style={styles.contactWrap}
          >
            <Text style={[typography.label, styles.contactLabel]}>Contact</Text>
            <Text style={[typography.label, styles.contactLink]}>{doc.contactEmail}</Text>
          </AnimatedPressable>
        </Arrive>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerText: {
    gap: spacing.xs / 2,
  },
  eyebrow: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text.primary,
  },
  scroll: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  updated: {
    color: colors.text.tertiary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeading: {
    color: colors.text.primary,
  },
  paragraph: {
    color: colors.text.secondary,
  },
  bulletList: {
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: colors.text.tertiary,
  },
  bulletText: {
    flex: 1,
    color: colors.text.secondary,
  },
  contactWrap: {
    gap: spacing.xs / 2,
    paddingTop: spacing.sm,
  },
  contactLabel: {
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactLink: {
    color: colors.accent.primary,
  },
});
