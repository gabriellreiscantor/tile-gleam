// Consent state management

const CONSENT_KEY = 'blockblast_consent';

export interface ConsentState {
  acceptedTerms: boolean;
  acceptedAt: string | null;
}

const DEFAULT_CONSENT: ConsentState = {
  acceptedTerms: false,
  acceptedAt: null,
};

export function loadConsent(): ConsentState {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved) {
      return { ...DEFAULT_CONSENT, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load consent:', e);
  }
  return { ...DEFAULT_CONSENT };
}

export function saveConsent(consent: ConsentState): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch (e) {
    console.error('Failed to save consent:', e);
  }
}

export function acceptTerms(): ConsentState {
  const consent: ConsentState = {
    acceptedTerms: true,
    acceptedAt: new Date().toISOString(),
  };
  saveConsent(consent);
  return consent;
}

export function hasAcceptedTerms(): boolean {
  return loadConsent().acceptedTerms;
}
