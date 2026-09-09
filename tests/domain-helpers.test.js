// Тесты доменного слоя src/helpers.js
// Запуск: npm test (vitest). Стиль и импорты — как в tests/image-mode.test.js.

import { describe, expect, it } from 'vitest';

import {
  getEntityDomain,
  isSupportedEntity,
  resolveService,
  supportsFeature,
} from '../src/helpers';

describe('getEntityDomain', () => {
  it('extracts the domain from an entity id', () => {
    expect(getEntityDomain('vacuum.roborock')).toBe('vacuum');
    expect(getEntityDomain('lawn_mower.mower')).toBe('lawn_mower');
    expect(getEntityDomain('sensor.battery')).toBe('sensor');
  });

  it('returns an empty string for empty input', () => {
    expect(getEntityDomain('')).toBe('');
    expect(getEntityDomain(undefined)).toBe('');
  });
});

describe('isSupportedEntity', () => {
  it('accepts lawn_mower and vacuum', () => {
    expect(isSupportedEntity('lawn_mower.mower')).toBe(true);
    expect(isSupportedEntity('vacuum.roborock')).toBe(true);
  });

  it('rejects other domains and empty input', () => {
    expect(isSupportedEntity('sensor.battery')).toBe(false);
    expect(isSupportedEntity(undefined)).toBe(false);
  });
});

describe('resolveService', () => {
  it('keeps canonical names for lawn_mower', () => {
    expect(resolveService('lawn_mower', 'start_mowing')).toBe('start_mowing');
    expect(resolveService('lawn_mower', 'pause')).toBe('pause');
    expect(resolveService('lawn_mower', 'dock')).toBe('dock');
  });

  it('maps canonical actions to vacuum services', () => {
    expect(resolveService('vacuum', 'start_mowing')).toBe('start');
    expect(resolveService('vacuum', 'pause')).toBe('pause');
    expect(resolveService('vacuum', 'dock')).toBe('return_to_base');
    expect(resolveService('vacuum', 'stop')).toBe('stop');
    expect(resolveService('vacuum', 'locate')).toBe('locate');
    expect(resolveService('vacuum', 'clean_spot')).toBe('clean_spot');
    expect(resolveService('vacuum', 'set_fan_speed')).toBe('set_fan_speed');
  });

  it('falls through for unknown actions or domains', () => {
    expect(resolveService('vacuum', 'edgecut')).toBe('edgecut');
    expect(resolveService('unknown_domain', 'pause')).toBe('pause');
  });
});

describe('supportsFeature', () => {
  it('keeps buttons visible without a bitmask (legacy integrations)', () => {
    expect(supportsFeature('vacuum', 0, 'PAUSE')).toBe(true);
    expect(supportsFeature('vacuum', undefined, 'PAUSE')).toBe(true);
    expect(supportsFeature('lawn_mower', null, 'DOCK')).toBe(true);
  });

  it('keeps buttons visible for unknown domains', () => {
    expect(supportsFeature('media_player', 4, 'PAUSE')).toBe(true);
  });

  it('hides features that do not exist in the domain model', () => {
    // У lawn_mower нет LOCATE/CLEAN_SPOT/STOP — кнопки скрываются
    expect(supportsFeature('lawn_mower', 7, 'LOCATE')).toBe(false);
    expect(supportsFeature('lawn_mower', 7, 'CLEAN_SPOT')).toBe(false);
    expect(supportsFeature('lawn_mower', 7, 'STOP')).toBe(false);
  });

  it('checks lawn_mower bits (START=1, PAUSE=2, DOCK=4)', () => {
    expect(supportsFeature('lawn_mower', 7, 'START')).toBe(true);
    expect(supportsFeature('lawn_mower', 7, 'PAUSE')).toBe(true);
    expect(supportsFeature('lawn_mower', 7, 'DOCK')).toBe(true);
    expect(supportsFeature('lawn_mower', 1, 'PAUSE')).toBe(false);
    expect(supportsFeature('lawn_mower', 5, 'PAUSE')).toBe(false);
  });

  it('checks vacuum bits (modern VacuumEntityFeature)', () => {
    const features = 4 | 8 | 16 | 1024; // PAUSE + STOP + DOCK + LOCATE
    expect(supportsFeature('vacuum', features, 'PAUSE')).toBe(true);
    expect(supportsFeature('vacuum', features, 'STOP')).toBe(true);
    expect(supportsFeature('vacuum', features, 'DOCK')).toBe(true);
    expect(supportsFeature('vacuum', features, 'LOCATE')).toBe(true);
    expect(supportsFeature('vacuum', features, 'START')).toBe(false); // 8192 не выставлен
    expect(supportsFeature('vacuum', features, 'FAN_SPEED')).toBe(false); // 32 не выставлен
    expect(supportsFeature('vacuum', features, 'CLEAN_SPOT')).toBe(false); // 512 не выставлен
  });

  it('distinguishes START (8192) from TURN_ON (1) on vacuums', () => {
    const legacy = 1 | 2;
    expect(supportsFeature('vacuum', legacy, 'START')).toBe(false);
    expect(supportsFeature('vacuum', legacy, 'TURN_ON')).toBe(true);
  });
});
