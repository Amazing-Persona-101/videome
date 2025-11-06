// getDefaultAppIcon.test.ts
import { describe, it, expect } from 'vitest';
import { getDefaultAppIcon } from './getDefaultAppIcon';

describe('getDefaultAppIcon', () => {
  it('should return a data URL string', () => {
    const result = getDefaultAppIcon();
    expect(result).toMatch(/^data:image\/svg\+xml,/);
  });

  it('should contain encoded SVG content', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('<svg');
    expect(decodedSvg).toContain('</svg>');
  });

  it('should include the correct title and description', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('<title id="title">videome.video — default group icon</title>');
    expect(decodedSvg).toContain('<desc id="desc">Rounded tile with play emblem and the label “videome.video”, themed by the site accent color.</desc>');
  });

  it('should include CSS variables for theming', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('--accent: oklch(0.696 0.17 162.48)');
    expect(decodedSvg).toContain('--bg1: color-mix(in oklch, var(--accent) 85%, white)');
    expect(decodedSvg).toContain('--bg2: color-mix(in oklch, var(--accent) 70%, black)');
  });

  it('should include a media query for dark mode', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('@media (prefers-color-scheme: dark)');
  });

  it('should include the videome.video label', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('>videome.video</text>');
  });

  it('should include a play button emblem', () => {
    const result = getDefaultAppIcon();
    const decodedSvg = decodeURIComponent(result.split(',')[1]);
    expect(decodedSvg).toContain('<path d="M118 95 L146 112 L118 129 Z"');
  });
});