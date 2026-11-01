import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Check, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { PurchasesPackage } from 'react-native-purchases';
import { ActivityIndicator, BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { Arrive } from '../../components/Arrive';
import { Button } from '../../components/Button';
import { NightSky } from '../../components/NightSky';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAuth } from '../../hooks/useAuth';
import { PaywallPlan, PaywallVariant, track } from '../../lib/analytics';
import { loadStarterPlan, StarterPlan } from '../../lib/onboarding';
import {
  clearPaywallPending,
  DEFAULT_PLAN,
  formatChargeDate,
  PlanOption,
  planOfPackage,
  planOptionsFrom,
  PREVIEW_PLAN_OPTIONS,
  trialDaysOf,
  trialEndDate,
} from '../../lib/paywall';
import {
  getPaywallOfferings,
  hasProEntitlement,
  PaywallOfferings,
  purchasePlan,
  purchasesSupported,
  restorePurchases,
  variantOf,
} from '../../lib/purchases';
import { AppStackParamList } from '../../navigation/types';
import { colors, fontFamily, radius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Paywall'>;

// The store-required minimum height for the primary action is 44; this paywall goes taller
// on purpose, since this is the one button the whole screen exists for.
const CTA_HEIGHT = 56;

const BENEFITS = [
  'AI dream sign detection from your journal',
  'Pattern analysis across your dreams and sleep',
  'Personalised technique recommendations',
];

type Stage = 'main' | 'fallback';
type Load =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; offerings: PaywallOfferings; variant: PaywallVariant; preview: boolean };

export function PaywallScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { source } = route.params;

  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [stage, setStage] = useState<Stage>('main');
  const [selected, setSelected] = useState<PaywallPlan>(DEFAULT_PLAN);
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The plan the quiz just built for them, so the ask reads as keeping something already theirs.
  const [starterPlan, setStarterPlan] = useState<StarterPlan | null>(null);
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    loadStarterPlan(user.id).then((plan) => {
      if (!ignore) setStarterPlan(plan);
    });
    return () => {
      ignore = true;
    };
  }, [user]);

  const shownRef = useRef<Stage | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!purchasesSupported) {
        // Browsers have no store. In development show fixed prices so the layout can be
        // checked; in a real web build there is nothing to sell.
        if (!ignore) {
          setLoad(
            __DEV__
              ? { kind: 'ready', offerings: { main: null, fallback: null }, variant: 'unknown', preview: true }
              : { kind: 'error', message: 'Subscriptions are only available in the iOS and Android apps.' }
          );
        }
        return;
      }
      try {
        const offerings = await getPaywallOfferings();
        if (ignore) return;
        if (!offerings.main || planOptionsFrom(offerings.main).length === 0) {
          setLoad({ kind: 'error', message: "We couldn't load the plans. Check your connection and try again." });
          return;
        }
        setLoad({ kind: 'ready', offerings, variant: variantOf(offerings.main), preview: false });
      } catch {
        if (!ignore) {
          setLoad({ kind: 'error', message: "We couldn't load the plans. Check your connection and try again." });
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const options: PlanOption[] =
    load.kind !== 'ready'
      ? []
      : load.preview
        ? PREVIEW_PLAN_OPTIONS
        : load.offerings.main
          ? planOptionsFrom(load.offerings.main)
          : [];
  const selectedOption = options.find((o) => o.plan === selected) ?? options[options.length - 1] ?? null;

  // The fallback is one package: the offering's annual if it has one, else its first.
  const fallbackPkg =
    load.kind === 'ready' && load.offerings.fallback
      ? (load.offerings.fallback.annual ?? load.offerings.fallback.availablePackages[0] ?? null)
      : null;
  const fallbackPlan: PaywallPlan = (fallbackPkg && planOfPackage(fallbackPkg)) ?? 'annual';

  const variant = load.kind === 'ready' ? load.variant : 'unknown';
  const planForEvents: PaywallPlan = stage === 'fallback' ? fallbackPlan : (selectedOption?.plan ?? selected);

  // One "shown" event per stage, the first time that stage has something on screen.
  useEffect(() => {
    if (load.kind !== 'ready' || shownRef.current === stage) return;
    shownRef.current = stage;
    track(stage === 'main' ? 'paywall_shown' : 'fallback_shown', {
      plan: planForEvents,
      variant,
      source,
    });
  }, [load.kind, stage, planForEvents, variant, source]);

  const finish = async () => {
    if (source === 'onboarding') {
      if (user) await clearPaywallPending(user.id);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } else {
      navigation.goBack();
    }
  };

  const dismiss = () => {
    if (stage === 'fallback') {
      finish();
      return;
    }
    // Only a paywall that actually showed plans counts as dismissed (not a load error), and
    // only one with an offer to follow it has anywhere to go.
    if (load.kind === 'ready') {
      track('paywall_dismissed', { plan: planForEvents, variant, source });
      if (fallbackPkg) {
        setError(null);
        setStage('fallback');
        return;
      }
    }
    finish();
  };

  // The Android back button takes the same path as the close button, so it cannot skip the
  // fallback offer or the dismissed event. No dependency list on purpose: `dismiss` closes
  // over the current stage and plan, so the listener is re-bound each render to stay current.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => subscription.remove();
  });

  const handlePurchase = async () => {
    const pkg = stage === 'fallback' ? fallbackPkg : selectedOption?.pkg;
    if (!pkg || busy) return;
    setError(null);
    setBusy('purchase');
    try {
      const result = await purchasePlan(pkg);
      if (result.status === 'purchased') {
        track(stage === 'fallback' ? 'fallback_converted' : 'paywall_converted', {
          plan: planForEvents,
          variant,
          source,
        });
        await finish();
        return;
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  };

  const handleRestore = async () => {
    if (busy) return;
    setError(null);
    setBusy('restore');
    try {
      const info = await restorePurchases();
      // A restore is an existing subscriber getting access back, not a conversion.
      if (hasProEntitlement(info)) {
        await finish();
        return;
      }
      setError('No active subscription was found for this account.');
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  };

  const openLegal = (doc: 'privacy' | 'terms') => navigation.navigate('LegalDocument', { doc });

  return (
    <ScreenContainer edges={['top', 'bottom']} edgeToEdge>
      <NightSky intensity="subtle" style={styles.sky}>
        <View style={styles.closeRow}>
          <AnimatedPressable
            onPress={dismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X color={colors.text.secondary} size={24} strokeWidth={1.5} />
          </AnimatedPressable>
        </View>

        {load.kind === 'loading' ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent.primary} />
          </View>
        ) : load.kind === 'error' ? (
          <View style={styles.center}>
            <Text style={[typography.body, styles.centerText]}>{load.message}</Text>
            {purchasesSupported ? (
              <Button
                label="Try again"
                variant="secondary"
                onPress={() => {
                  setLoad({ kind: 'loading' });
                  setAttempt((a) => a + 1);
                }}
              />
            ) : null}
          </View>
        ) : stage === 'main' ? (
          <MainOffer
            options={options}
            selected={selectedOption}
            onSelect={setSelected}
            onPurchase={handlePurchase}
            onRestore={handleRestore}
            onOpenLegal={openLegal}
            busy={busy}
            error={error}
            preview={load.preview}
            plan={starterPlan}
          />
        ) : (
          <FallbackOffer
            pkg={fallbackPkg}
            comparePrice={options.find((o) => o.plan === 'annual')?.priceString ?? null}
            onPurchase={handlePurchase}
            onDecline={finish}
            busy={busy}
            error={error}
          />
        )}
      </NightSky>
    </ScreenContainer>
  );
}

type MainOfferProps = {
  options: PlanOption[];
  selected: PlanOption | null;
  onSelect: (plan: PaywallPlan) => void;
  onPurchase: () => void;
  onRestore: () => void;
  onOpenLegal: (doc: 'privacy' | 'terms') => void;
  busy: 'purchase' | 'restore' | null;
  error: string | null;
  preview: boolean;
  plan: StarterPlan | null;
};

function MainOffer({
  options,
  selected,
  onSelect,
  onPurchase,
  onRestore,
  onOpenLegal,
  busy,
  error,
  preview,
  plan,
}: MainOfferProps) {
  const trialDays = selected?.trialDays ?? null;
  const price = selected ? `${selected.priceString} / ${selected.periodUnit}` : '';

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Arrive>
          <Text style={[typography.displayMd, styles.title]}>Unlock Nocturnal Pro</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Understand your dreams, and learn to control them.
          </Text>
        </Arrive>

        {plan ? (
          <Arrive delay={30} style={styles.planStrip}>
            <Text style={[typography.overline, styles.planStripLabel]}>Your plan is ready</Text>
            <Text style={[typography.subheading, styles.planStripValue]}>
              {plan.dreamType} · starts with {plan.technique}
            </Text>
          </Arrive>
        ) : null}

        <Arrive delay={60} style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Check color={colors.status.lucid} size={18} strokeWidth={2} />
              <Text style={[typography.body, styles.benefitText]}>{benefit}</Text>
            </View>
          ))}
        </Arrive>

        <Arrive delay={120} style={styles.plans}>
          {options.map((option) => (
            <PlanCard
              key={option.plan}
              option={option}
              selected={option.plan === selected?.plan}
              onPress={() => onSelect(option.plan)}
            />
          ))}
        </Arrive>
      </ScrollView>

      <View style={styles.footer}>
        {error ? <Text style={[typography.label, styles.errorText]}>{error}</Text> : null}
        {preview ? (
          <Text style={[typography.label, styles.footnote]}>Preview prices. Purchases are disabled on web.</Text>
        ) : null}
        <Text style={[typography.label, styles.footnote]}>
          {trialDays
            ? `No payment due now. Your free trial ends ${formatChargeDate(trialEndDate(trialDays))}, then ${price}. Cancel anytime before then.`
            : `${price}. Cancel anytime.`}
        </Text>
        <Button
          label={trialDays ? `Start ${trialDays}-day free trial` : 'Continue'}
          onPress={onPurchase}
          loading={busy === 'purchase'}
          disabled={preview || !selected?.pkg || busy === 'restore'}
          style={styles.cta}
        />
        <Text style={[typography.label, styles.footnote]}>No commitment, cancel anytime</Text>
        <View style={styles.links}>
          <FooterLink label="Restore" onPress={onRestore} disabled={preview || busy !== null} />
          <FooterLink label="Terms" onPress={() => onOpenLegal('terms')} />
          <FooterLink label="Privacy" onPress={() => onOpenLegal('privacy')} />
        </View>
      </View>
    </>
  );
}

function PlanCard({
  option,
  selected,
  onPress,
}: {
  option: PlanOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.title}, ${option.displayPrice} per ${option.displayUnit}${option.subtext ? `, ${option.subtext}` : ''}`}
      style={styles.planCard}
    >
      {selected ? <View style={[StyleSheet.absoluteFill, styles.planTint]} /> : null}
      <View style={styles.planText}>
        <View style={styles.planTitleRow}>
          <Text style={[typography.bodyMedium, styles.planTitle]}>{option.title}</Text>
          {option.badge ? (
            <View style={styles.badge}>
              <Text style={[typography.caption, styles.badgeText]}>{option.badge}</Text>
            </View>
          ) : null}
        </View>
        {option.subtext ? <Text style={[typography.caption, styles.planSub]}>{option.subtext}</Text> : null}
      </View>
      <Text style={[typography.bodyMedium, styles.planPrice]}>
        {option.displayPrice} / {option.displayUnit}
      </Text>
      <View style={[styles.indicator, selected && styles.indicatorSelected]}>
        {selected ? (
          <View>
            <Check color={colors.text.primary} size={14} strokeWidth={1.75} />
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function FooterLink({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="link"
      style={disabled ? styles.linkDisabled : undefined}
    >
      <Text style={[typography.label, styles.link]}>{label}</Text>
    </AnimatedPressable>
  );
}

type FallbackOfferProps = {
  pkg: PurchasesPackage | null;
  comparePrice: string | null;
  onPurchase: () => void;
  onDecline: () => void;
  busy: 'purchase' | 'restore' | null;
  error: string | null;
};

// Shown straight after the main paywall is closed. Everything on it comes from the fallback
// offering configured in RevenueCat, so the discount or longer trial can change without an
// app release; the copy adapts to whichever of the two the offering carries.
function FallbackOffer({ pkg, comparePrice, onPurchase, onDecline, busy, error }: FallbackOfferProps) {
  if (!pkg) return null;

  const plan = planOfPackage(pkg) ?? 'annual';
  const unit = plan === 'weekly' ? 'week' : plan === 'monthly' ? 'month' : 'year';
  const price = pkg.product.priceString;
  const trialDays = trialDaysOf(pkg);
  const discounted = comparePrice !== null && comparePrice !== price;

  return (
    <>
      <View style={styles.fallbackBody}>
        <Arrive>
          <Text style={[typography.overline, styles.eyebrow]}>One-time offer</Text>
          <Text style={[typography.displayMd, styles.title]}>
            {trialDays ? `Try Pro free for ${trialDays} days` : 'Wait, a better price for you'}
          </Text>
          <Text style={[typography.body, styles.subtitle]}>
            This offer is only available right now.
          </Text>
        </Arrive>
        <Arrive delay={80} style={styles.fallbackPrice}>
          <View style={styles.fallbackPriceRow}>
            {discounted && !trialDays ? (
              <Text style={[typography.body, styles.struck]}>{comparePrice}</Text>
            ) : null}
            <Text style={[typography.displayLg, styles.title]}>{price}</Text>
            <Text style={[typography.body, styles.subtitle]}>/ {unit}</Text>
          </View>
          <Text style={[typography.label, styles.footnote]}>
            {trialDays
              ? `No payment due now. Your free trial ends ${formatChargeDate(trialEndDate(trialDays))}, then ${price} / ${unit}. Cancel anytime before then.`
              : `Billed ${unit}ly. Cancel anytime.`}
          </Text>
        </Arrive>
      </View>

      <View style={styles.footer}>
        {error ? <Text style={[typography.label, styles.errorText]}>{error}</Text> : null}
        <Button
          label={trialDays ? `Start ${trialDays}-day free trial` : 'Claim this offer'}
          onPress={onPurchase}
          loading={busy === 'purchase'}
          style={styles.cta}
        />
        <Button label="No thanks" variant="ghost" onPress={onDecline} disabled={busy !== null} style={styles.cta} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sky: { flex: 1 },
  closeRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  centerText: { color: colors.text.secondary, textAlign: 'center' },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  eyebrow: { color: colors.accent.primary, marginBottom: spacing.xs },
  title: { color: colors.text.primary },
  subtitle: { color: colors.text.secondary, marginTop: spacing.xs },
  planStrip: {
    gap: 2,
    padding: spacing.cardPadding,
    borderRadius: radius.card,
    backgroundColor: colors.surface.glassSoft,
  },
  planStripLabel: { color: colors.text.tertiary },
  planStripValue: { color: colors.text.primary },
  benefits: { gap: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  benefitText: { flex: 1, color: colors.text.primary },
  plans: { gap: spacing.sm },
  // Same glass-with-accent-wash treatment as OptionCard: no border, overflow clips the tint.
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    overflow: 'hidden',
    borderRadius: radius.glass,
    backgroundColor: colors.surface.glass,
    padding: spacing.md,
  },
  planTint: { backgroundColor: colors.surface.selectedTint, pointerEvents: 'none' },
  planText: { flex: 1, gap: spacing.xs / 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planTitle: { color: colors.text.primary },
  planSub: { fontFamily: fontFamily.regular, color: colors.text.secondary },
  planPrice: { color: colors.text.primary },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: colors.status.lucidMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { color: colors.status.lucid },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.indicator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorSelected: { backgroundColor: colors.accent.primary },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  cta: { alignSelf: 'stretch', height: CTA_HEIGHT },
  footnote: { color: colors.text.secondary, textAlign: 'center' },
  errorText: { color: colors.status.danger, textAlign: 'center' },
  links: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  link: { color: colors.text.secondary },
  linkDisabled: { opacity: 0.4 },
  fallbackBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.xl,
  },
  fallbackPrice: { gap: spacing.sm },
  fallbackPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  struck: { color: colors.text.tertiary, textDecorationLine: 'line-through' },
});
