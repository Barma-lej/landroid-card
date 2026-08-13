import { describe, expect, it } from 'vitest';

import { HA_STATE_IMAGE_TAGS } from '../src/constants';
import { resolveHaStateImageTag, resolveImageMode } from '../src/helpers';

describe('resolveImageMode', () => {
  it('defaults to the HA status image when `image` is not configured', () => {
    expect(resolveImageMode(undefined)).toBe('ha');
  });

  it("maps 'ha' to the HA status image mode", () => {
    expect(resolveImageMode('ha')).toBe('ha');
  });

  it("maps 'default' to the bundled SVG mode", () => {
    expect(resolveImageMode('default')).toBe('bundled');
  });

  it('maps plain URLs to the user image mode', () => {
    expect(resolveImageMode('/local/robot.svg')).toBe('url');
  });

  it('maps media-source links to the user image mode', () => {
    expect(resolveImageMode('media-source://image/abc')).toBe('url');
  });
});

describe('resolveHaStateImageTag', () => {
  it('selects the vacuum status element for vacuum entities', () => {
    expect(resolveHaStateImageTag('vacuum.roborock_s7')).toBe(
      HA_STATE_IMAGE_TAGS.vacuum,
    );
  });

  it('selects the lawn mower status element for lawn_mower entities', () => {
    expect(resolveHaStateImageTag('lawn_mower.landroid')).toBe(
      HA_STATE_IMAGE_TAGS.lawn_mower,
    );
  });

  it('falls back to the lawn mower status element for unknown domains', () => {
    expect(resolveHaStateImageTag('select.something')).toBe(
      HA_STATE_IMAGE_TAGS.lawn_mower,
    );
    expect(resolveHaStateImageTag(undefined)).toBe(
      HA_STATE_IMAGE_TAGS.lawn_mower,
    );
  });
});
