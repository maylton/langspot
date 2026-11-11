import { ExternalLink } from 'lucide-react';
import { CLASSPLAY_URL } from '../config/env';
import { openExternalFromLink } from '../lib/openExternal';

/** ClassPlay's brand mark: a dark rounded square with a white C. */
export function ClassPlayMark({ size = 22 }: { size?: number }) {
  return <span className="classplay-mark" style={{ width: size, height: size, fontSize: Math.round(size * 0.55) }} aria-hidden="true">C</span>;
}

/**
 * Shortcut to ClassPlay, the companion activity platform. `area` picks the teacher dashboard or the
 * student area; `variant` is the top-bar button or the sidebar footer link.
 */
export function ClassPlayLink({ area, variant }: { area: 'teacher' | 'student'; variant: 'topbar' | 'footer' }) {
  const url = `${CLASSPLAY_URL}${area === 'teacher' ? '/dashboard' : '/student'}`;
  const label = 'Ir para o ClassPlay';
  return <a className={`classplay-link classplay-link--${variant}`} href={url} target="_blank" rel="noopener noreferrer" title={`${label} (abre em outra janela)`} aria-label={label}
    onClick={(event) => openExternalFromLink(event, url)}>
    <ClassPlayMark size={variant === 'topbar' ? 22 : 20} />
    <span>{variant === 'topbar' ? 'ClassPlay' : label}</span>
    <ExternalLink size={13} className="classplay-link-arrow" aria-hidden="true" />
  </a>;
}
