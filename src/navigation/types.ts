import { NavigatorScreenParams } from '@react-navigation/native';
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
  Journal: { newDream?: { key: string; content: string; recordingName: string } } | undefined;
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
  MildPrompt: undefined;
  CoachChat: undefined;
  NotificationSettings: undefined;
  WbtbDefaults: undefined;
  LegalDocument: { doc: 'privacy' | 'terms' };
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required by React Navigation's typing pattern
    interface RootParamList extends AppStackParamList {}
  }
}
