import { NavigatorScreenParams } from '@react-navigation/native';
import { PaywallSource } from '../lib/analytics';
import { TechniqueId } from '../lib/techniqueLibrary';
import { WbtbTechnique } from '../lib/wbtb';

export type AuthStackParamList = {
  Welcome: undefined;
  Preview: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  // `newDream` opens the new-entry sheet pre-filled, from the voice-recording review sheet.
  // `recordingName` ties the entry to its audio so the recording is removed once it is saved.
  // `compose` opens the new-entry sheet empty, from the morning recall and come-back notifications.
  Journal: { newDream?: { key: string; content: string; recordingName: string }; compose?: boolean } | undefined;
  Insights: undefined;
  Profile: undefined;
};

export type WbtbPlan = {
  sleepAt: string;
  sleepMinutes: number;
  wakeWindowMinutes: number;
  technique: WbtbTechnique;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList>;
  WbtbSetup: { plan?: WbtbPlan } | undefined;
  WbtbSession: { sessionId: string };
  RealityCheckSetup: undefined;
  RecordDream: undefined;
  BeginnerTrack: undefined;
  Recap: undefined;
  MildPrompt: undefined;
  CoachChat: undefined;
  NotificationSettings: undefined;
  WbtbDefaults: undefined;
  LegalDocument: { doc: 'privacy' | 'terms' };
  // `onboarding` is the hard paywall right after the quiz and leaves to Tabs when done; the
  // other sources are opened from inside the app and just close back to where they came from.
  Paywall: { source: PaywallSource };
  TechniqueLibrary: undefined;
  TechniqueDetail: { technique: TechniqueId };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required by React Navigation's typing pattern
    interface RootParamList extends AppStackParamList {}
  }
}
