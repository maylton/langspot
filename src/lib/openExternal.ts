/** True inside the Tauri desktop app, whose webview does not open target="_blank" links. */
export const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Opens an external page in the default browser on desktop, or in a new tab on the web.
 * Use as the onClick of an <a href target="_blank">: on the web the link works by itself.
 */
export function openExternalFromLink(event: { preventDefault: () => void }, url: string): void {
  if (!isTauri()) return;
  event.preventDefault();
  void import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl(url)).catch(() => window.open(url, '_blank', 'noopener'));
}
