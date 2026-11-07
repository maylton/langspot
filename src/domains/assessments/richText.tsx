import { Fragment, type ReactNode } from 'react';

/**
 * Renders task text written in the Pilot Bank's light markdown: **bold** spans become <strong>.
 * Line breaks are kept by the `assessment-rich-text` class (white-space: pre-line).
 */
export function richText(text: string | null | undefined): ReactNode {
  if (!text) return null;
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') && part.length > 4
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : <Fragment key={index}>{part}</Fragment>);
}
