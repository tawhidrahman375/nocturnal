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
  Journal: undefined;
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
  BeginnerTrack: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required by React Navigation's typing pattern
    interface RootParamList extends AppStackParamList {}
  }
}
