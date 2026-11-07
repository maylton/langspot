import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { richText } from './richText';

describe('richText', () => {
  it('turns **bold** into <strong> and keeps the rest as text', () => {
    expect(renderToStaticMarkup(<p>{richText('Read **this notice** carefully.\n- one')}</p>)).toBe('<p>Read <strong>this notice</strong> carefully.\n- one</p>');
  });
  it('leaves lone asterisks and empty values alone', () => {
    expect(renderToStaticMarkup(<p>{richText('5 * 3 = 15')}</p>)).toBe('<p>5 * 3 = 15</p>');
    expect(richText(null)).toBeNull();
  });
});
