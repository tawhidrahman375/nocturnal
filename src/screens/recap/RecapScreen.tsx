import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarRange, Share2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { GlassBackButton } from '../../components/GlassBackButton';
import { LoadingView } from '../../components/LoadingView';
import { NightSky } from '../../components/NightSky';
import { useAuth } from '../../hooks/useAuth';
import { useDreams } from '../../hooks/useDreams';
import { useProfile } from '../../hooks/useProfile';
import { computeMonthlyRecap, inviteCodeFor, inviteUrlFor, recapShareMessage } from '../../lib/recap';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Recap'>;

// "This month" is a rolling 30 days against the 30 before it. The lucid line is the one that
// can go quiet: a month without one says so plainly, and says what brings it back.
function lucidLine(lucid: number, previous: number) {
  if (lucid === 0 && previous === 0) return 'No lucid dreams yet. Every practice night moves you closer.';
  if (lucid === 0) return `No lucid dreams this month, after ${previous} last month. The practice is what brings them back.`;
  if (lucid > previous) return `${lucid} lucid this month, up from ${previous}.`;
  if (lucid === previous) return `${lucid} lucid this month, level with last month.`;
  return `${lucid} lucid this month, ${previous} last month. Plenty of room to beat it.`;
}

export function RecapScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { dreams, isLoading, error, refresh } = useDreams();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const [shareError, setShareError] = useState<string | null>(null);

  const recap = useMemo(
    () => computeMonthlyRecap(dreams, profile?.longest_streak ?? 0),
    [dreams, profile?.longest_streak]
  );

  const handleShare = async () => {
    if (!user) return;
    setShareError(null);
    try {
      await Share.share({ message: recapShareMessage(recap, inviteUrlFor(user.id)) });
    } catch {
      setShareError("Couldn't open sharing. Try again in a moment.");
    }
  };

  return (
    <View style={styles.root}>
      <NightSky intensity="full" style={styles.sky}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.lg }]}>
          <GlassBackButton onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        </View>

        {isLoading && dreams.length === 0 ? (
          <LoadingView label="Gathering your month" />
        ) : error && dreams.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              icon={CalendarRange}
              title="Couldn't load your recap"
              message="Check your connection and try again."
              action={{ label: 'Try again', onPress: refresh }}
            />
          </View>
        ) : recap.dreams === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              icon={CalendarRange}
              title="Your recap starts with one dream"
              message="Log what you remember and your month in dreams will fill in here, ready to share."
              action={{
                label: 'Log a dream',
                onPress: () => navigation.navigate('Tabs', { screen: 'Journal', params: { compose: true } }),
              }}
            />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xxl + insets.bottom }]}
            showsVerticalScrollIndicator={false}
          >
            <Arrive>
              <Text style={[typography.overline, styles.eyebrow]}>Your month in dreams</Text>
              <Text style={[typography.caption, styles.period]}>{recap.periodLabel}</Text>
            </Arrive>

            <Arrive delay={40} style={styles.identity}>
              <Text style={[typography.heroTitle, styles.identityLabel]}>{recap.identity.label}</Text>
              <Text style={[typography.body, styles.identityTagline]}>{recap.identity.tagline}</Text>
            </Arrive>

            <Arrive delay={80} style={styles.statsRow}>
              <BigStat value={recap.dreams} label="Dreams" />
              <BigStat value={recap.lucid} label="Lucid" tint={colors.status.lucid} />
              <BigStat value={recap.activeNights} label="Nights" />
            </Arrive>

            <Arrive delay={120}>
              <Text style={[typography.body, styles.lucidLine]}>{lucidLine(recap.lucid, recap.previousLucid)}</Text>
            </Arrive>

            {recap.topSign || recap.topCategory ? (
              <Arrive delay={160} style={styles.facts}>
                {recap.topSign ? <Fact label="Most common dream sign" value={recap.topSign} /> : null}
                {recap.topCategory ? <Fact label="Most common kind of dream" value={recap.topCategory} /> : null}
              </Arrive>
            ) : null}

            <Arrive delay={200} style={styles.shareBlock}>
              {shareError ? <Text style={[typography.label, styles.errorText]}>{shareError}</Text> : null}
              <Button label="Share my month" icon={Share2} onPress={handleShare} style={styles.shareButton} />
              {user ? (
                <Text style={[typography.footnote, styles.invite]}>
                  Your invite code is {inviteCodeFor(user.id)}. It travels with every recap you share.
                </Text>
              ) : null}
            </Arrive>
          </ScrollView>
        )}
      </NightSky>
    </View>
  );
}

function BigStat({ value, label, tint }: { value: number; label: string; tint?: string }) {
  return (
    <View style={styles.bigStat}>
      <Text style={[typography.stat, { color: tint ?? colors.text.primary }]}>{value}</Text>
      <Text style={[typography.caption, styles.bigStatLabel]}>{label}</Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={[typography.overline, styles.factLabel]}>{label}</Text>
      <Text style={[typography.subheading, styles.factValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  sky: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.lg,
  },
  eyebrow: {
    color: colors.text.secondary,
  },
  period: {
    color: colors.text.tertiary,
    marginTop: 2,
  },
  identity: {
    gap: spacing.sm,
  },
  identityLabel: {
    color: colors.text.primary,
  },
  identityTagline: {
    color: colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glassSoft,
  },
  bigStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bigStatLabel: {
    color: colors.text.secondary,
  },
  lucidLine: {
    color: colors.text.primary,
  },
  facts: {
    gap: spacing.sm,
  },
  fact: {
    gap: 2,
    padding: spacing.cardPadding,
    borderRadius: radius.card,
    backgroundColor: colors.surface.glassSoft,
  },
  factLabel: {
    color: colors.text.tertiary,
  },
  factValue: {
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  shareBlock: {
    gap: spacing.sm,
  },
  shareButton: {
    alignSelf: 'stretch',
  },
  invite: {
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorText: {
    color: colors.status.danger,
  },
});
