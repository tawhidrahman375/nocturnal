export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalDoc = {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  contactEmail: string;
};

const CONTACT_EMAIL = 'nocturnalappsupport@gmail.com';

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Privacy Policy',
  lastUpdated: '29 September 2026',
  contactEmail: CONTACT_EMAIL,
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        `Nocturnal is a lucid dreaming app developed and operated as an independent app. For any privacy-related questions, contact us at ${CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: 'What data we collect',
      bullets: [
        'Email address and password (for your account)',
        'Dream journal entries and related content you write',
        'App usage data (streaks, techniques used, session activity)',
        'Device information (operating system, app version)',
        'Sleep insights generated from your Apple Health or Health Connect sleep data, if you choose to connect it (see Health and sleep data below)',
        'Voice recordings of your dreams, only if you choose to record one (see Voice recordings below)',
      ],
    },
    {
      heading: 'Health and sleep data',
      paragraphs: [
        'If you choose to connect Apple Health (iPhone) or Health Connect (Android), Nocturnal reads your sleep records for the last 30 days: when you fell asleep, when you woke up, and how long you slept. Nocturnal asks for read-only permission and never writes to Apple Health or Health Connect. You can say no, and the rest of the app works the same.',
        'Your sleep records stay on your device. Nocturnal compares them with your dream journal on your phone and works out summary numbers, such as your average sleep before lucid dreams and the hour you most often wake on those nights. Only those summary numbers, never your sleep records, are sent to our servers and to Anthropic (the Claude API) to write your Sleep and dreams insight. We store the written insight so it does not need to be regenerated, and it is deleted when you delete your account.',
        'We do not sell your health data, and we do not use it for advertising, marketing or profiling. It is used only to show you your own sleep insight.',
        "You can stop at any time. On iPhone, turn off Sleep for Nocturnal in the Health app under Sharing, then Apps. On Android, remove Nocturnal's sleep permission in Health Connect. Nocturnal will then stop reading your sleep.",
        'Sleep insights are for information and interest only. They are not medical advice.',
      ],
    },
    {
      heading: 'Voice recordings',
      paragraphs: [
        'You can record a dream by voice. Nocturnal only uses your microphone while you are recording, and only after you tap the record button. You can decline microphone access and type your dreams instead.',
        'A recording is saved on your device. When you next open the app, it is uploaded to our storage and sent to OpenAI, which turns the speech into text. We delete the uploaded audio as soon as it has been transcribed, and in any case within 24 hours. The text is offered to you to edit and save as a journal entry.',
        'The recording stays on your device until you save the entry to your journal or discard it, and is then deleted. If transcription is unavailable, nothing is sent and you can type the dream in yourself. We do not use your recordings for advertising or marketing.',
      ],
    },
    {
      heading: 'Why we collect it',
      bullets: [
        'To provide and personalise the app experience',
        'To power AI features (dream sign detection, insights, coach chat) using your journal data',
        'To show how your sleep relates to your lucid dreams, if you connect Apple Health or Health Connect',
        'To turn your voice recordings into text, if you record a dream by voice',
        'To process your subscription via RevenueCat',
      ],
    },
    {
      heading: 'Who we share it with',
      bullets: [
        'Supabase (database and file storage)',
        'Anthropic (AI features — your journal data is sent to the Claude API to generate insights and coach responses. If you use sleep insights, summary numbers about your sleep are sent too, never your sleep records)',
        'OpenAI (speech-to-text: your voice recordings are sent to OpenAI to be transcribed, if you record a dream by voice)',
        'RevenueCat (subscription management)',
        'PostHog (anonymous usage analytics)',
      ],
      paragraphs: ['We do not sell your data. Ever.'],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'We keep your data for as long as your account is active. You can delete your account at any time from the Profile screen, which permanently deletes all your data. We do not store your sleep records, only the written sleep insight, which is deleted with your account. Voice recordings are deleted from our servers within 24 hours of upload, and from your device once you save or discard them.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        `You have the right to access, correct, or delete your personal data. Email us at ${CONTACT_EMAIL} to make a request. If you are in the UK or EU, you also have the right to lodge a complaint with the ICO (ico.org.uk).`,
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Nocturnal is not intended for users under 13. We do not knowingly collect data from children under 13.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: ['We may update this policy. We will notify you of significant changes via the app.'],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDoc = {
  title: 'Terms of Service',
  lastUpdated: '29 September 2026',
  contactEmail: CONTACT_EMAIL,
  sections: [
    {
      heading: 'What Nocturnal is',
      paragraphs: [
        'Nocturnal is a lucid dreaming app that provides dream journaling, technique guidance, AI-powered insights, and a coaching feature. By using the app you agree to these terms.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You are responsible for keeping your account credentials secure. You must be at least 13 years old to use Nocturnal.',
      ],
    },
    {
      heading: 'Subscriptions',
      paragraphs: [
        "Nocturnal offers a Pro subscription billed monthly. Payment is processed through the App Store or Google Play. Your subscription renews automatically unless cancelled at least 24 hours before the end of the billing period. You can manage or cancel your subscription in your device's subscription settings at any time.",
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        `Refunds are handled by Apple or Google depending on where you purchased. We do not process refunds directly. If you have an issue, contact us at ${CONTACT_EMAIL} and we will do our best to help.`,
      ],
    },
    {
      heading: 'AI features',
      paragraphs: [
        'Nocturnal uses AI to generate personalised insights, mantras, technique recommendations, and coach responses. These are for informational and entertainment purposes only. They are not medical or therapeutic advice. If you have a sleep disorder or mental health concern, speak to a qualified professional.',
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        'You may not misuse the app, attempt to reverse engineer it, or use it in any way that violates applicable law.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: ['We reserve the right to suspend or terminate accounts that violate these terms.'],
    },
    {
      heading: 'Disclaimer',
      paragraphs: [
        'Nocturnal is provided as-is. We make no guarantees about the accuracy of AI-generated content or that using the app will result in lucid dreams.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: ['These terms are governed by the laws of England and Wales.'],
    },
  ],
};
