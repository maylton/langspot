/** Minimum characters added by one input event, without paste or drop, to count as inserted text. */
export const BULK_INSERT_THRESHOLD = 40;

/**
 * Text added to a field by a single input event that is not typing, paste (already tracked) or
 * drop (tracked separately): autocomplete, text replacement, browser extensions writing into the field.
 */
export function bulkInsertion(previousLength: number, nextLength: number, inputType: string | undefined): number | null {
  const added = nextLength - previousLength;
  if (added < BULK_INSERT_THRESHOLD) return null;
  if (inputType === 'insertFromPaste' || inputType === 'insertFromDrop' || inputType === 'insertFromPasteAsQuotation') return null;
  return added;
}

/** Desktop browsers and the desktop app; phones and the Android app have no useful fullscreen. */
export function canUseAssessmentFullscreen(): boolean {
  if (typeof document === 'undefined' || !document.fullscreenEnabled) return false;
  const native = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ?? false;
  return !native && window.matchMedia('(pointer: fine)').matches;
}

/** Must run inside a click handler (browsers require a user gesture). Resolves false when refused. */
export async function requestAssessmentFullscreen(): Promise<boolean> {
  if (!canUseAssessmentFullscreen()) return false;
  if (document.fullscreenElement) return true;
  try { await document.documentElement.requestFullscreen(); return true; } catch { return false; }
}

/** Phones and small touch tablets, including the Android app. */
export function isPhoneLikeDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const native = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() ?? false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return native || (coarse && Math.min(window.screen.width, window.screen.height) < 768);
}
