// Поиск и подготовка сущностей устройства: translation_key, device_class,
// батарея-фоллбэк, кеши, построение hui-entities-card.
// Миксин: `this` — экземпляр карты (LitElement).

import { nothing } from 'lit';
import * as consts from '../constants';
import { isObject } from '../helpers';
import localize from '../localize';

export const DiscoveryMixin = (superClass) =>
  class extends superClass {
    _huiCardCache = new Map();
    __patchedCache = new WeakMap();

    /**
     * Entities of the device's `config` category for the settings card,
     * or the user-configured `settings_card` list. Cached per hass/config.
     *
     * @return {string[]|null}
     */
    get settingsCardEntities() {
      if (
        this.__settingsCache?.hass === this.hass &&
        this.__settingsCache?.config === this.config
      ) {
        return this.__settingsCache.result;
      }

      const configured = this.config?.settings_card || this.config?.settings;
      let result = null;

      if (configured?.length) {
        result = configured;
      } else {
        const deviceId = this.hass?.entities?.[this.config.entity]?.device_id;
        if (deviceId && this.hass?.entities) {
          const entities = this._deviceEntities
            .filter(
              (e) =>
                e.entity_category === 'config' &&
                this.hass.states[e.entity_id] &&
                this.hass.states[e.entity_id].state !==
                  consts.STATE_UNAVAILABLE,
            )
            .map((e) => e.entity_id)
            .sort();
          result = entities.length ? entities : null;
        }
      }

      this.__settingsCache = { hass: this.hass, config: this.config, result };
      return result;
    }

    /**
     * Entities for each tip card (battery/info/statistics):
     * user config → translation_key → device_class fallback.
     * Для battery добавляется attribute-row основной сущности, если нужно.
     *
     * @return {Object} Map cardType → { entities, labelPosition }.
     */
    get cardEntities() {
      if (
        this.__cardEntitiesCache?.hass === this.hass &&
        this.__cardEntitiesCache?.config === this.config
      ) {
        return this.__cardEntitiesCache.result;
      }

      const result = Object.fromEntries(
        Object.entries(consts.CARD_MAP).map(([cardType, card]) => {
          const configured = this.config?.[cardType + '_card'];
          let entities;
          if (configured?.length) {
            entities = configured.filter((row) => {
              // поддержка объектных строк и в пользовательском конфиге тоже
              const eid = typeof row === 'string' ? row : row?.entity;
              return (
                this.hass.states[eid] &&
                this.hass.states[eid].state !== consts.STATE_UNAVAILABLE
              );
            });
          } else {
            entities = this.findEntitiesByTranslationKeys(
              card.translationKeys,
            );
            if (entities.length === 0) {
              entities = this.findEntitiesByDeviceClass(
                consts.DEVICE_CLASS_MAP[cardType] ?? [],
              );
            }
          }

          // Батарея — независимо от автодетекта и ручного конфига
          if (cardType === consts.BATTERYCARD) {
            entities = this._withBatteryRow(entities);
          }

          return [cardType, { entities, labelPosition: card.labelPosition }];
        }),
      );

      this.__cardEntitiesCache = { hass: this.hass, config: this.config, result };
      return result;
    }

    /**
     * Добавляет attribute-row батареи в начало списка, если батареи там нет.
     * Доменно-нейтрально: срабатывает для любой основной сущности с атрибутом
     * battery_level (vacuum, часть lawn_mower-интеграций вроде Gardena/Husqvarna).
     *
     * @param {Array} entities - Текущий список строк карточки.
     * @return {Array} Список с battery-row первым элементом или исходный список.
     */
    _withBatteryRow(entities) {
      if (this.entity?.attributes?.battery_level == null) {
        return entities;
      }

      const hasBattery = entities.some((row) => {
        if (row?.type === 'attribute' && row?.attribute === 'battery_level') {
          return true;
        }
        const eid = typeof row === 'string' ? row : row?.entity;
        return this.hass.states[eid]?.attributes?.device_class === 'battery';
      });
      if (hasBattery) return entities;

      return [
        {
          type: 'attribute',
          entity: this.config.entity,
          attribute: 'battery_level',
          name: localize('attr.battery') || 'Battery',
          suffix: '%',
          icon: 'mdi:battery',
        },
        ...entities,
      ];
    }

    /**
     * Entities associated with the device of the configured entity.
     * Cached per deviceId/hass.
     *
     * @return {array}
     * @private
     */
    get _deviceEntities() {
      const deviceId = this.hass?.entities?.[this.config.entity]?.device_id;
      if (!deviceId) return [];

      if (
        this.__deviceEntitiesCache?.deviceId === deviceId &&
        this.__deviceEntitiesCache?.hass === this.hass
      ) {
        return this.__deviceEntitiesCache.list;
      }

      const list = Object.values(this.hass.entities).filter(
        (e) => e.device_id === deviceId,
      );
      this.__deviceEntitiesCache = { deviceId, hass: this.hass, list };
      return list;
    }

    /**
     * Friendly name of an entity, stripped of the main device name.
     *
     * @param {string} entityId
     * @return {string}
     */
    getEntityName(entityId) {
      const entity = this.hass.states[entityId];
      if (!isObject(entity)) return '';

      const deviceName = this.entity?.attributes?.friendly_name ?? '';
      const entityName = entity.attributes?.friendly_name ?? '';

      return entityName.replace(`${deviceName} `, '');
    }

    /**
     * State object of the device entity matching the given translation key.
     *
     * @param {string} translationKey
     * @return {object|undefined}
     */
    getEntityByTranslationKey(translationKey) {
      const found = this._deviceEntities.find(
        (e) => e.translation_key === translationKey,
      );
      return found ? this.hass.states[found.entity_id] : undefined;
    }

    /**
     * Entity IDs of the device matching the given translation keys.
     * Excludes unavailable entities.
     *
     * @param {string[]} translationKeys
     * @return {string[]}
     */
    findEntitiesByTranslationKeys(translationKeys) {
      const deviceEntities = this._deviceEntities;
      return translationKeys.reduce((result, key) => {
        const found = deviceEntities.find((e) => e.translation_key === key);
        if (!found) return result;
        const stateObj = this.hass.states[found.entity_id];
        if (stateObj && stateObj.state !== consts.STATE_UNAVAILABLE) {
          result.push(found.entity_id);
        }
        return result;
      }, []);
    }

    /**
     * Entity IDs of the device matching the given device classes.
     * Fallback for integrations without Landroid Cloud translation keys.
     * device_class priority: state attributes → registry override → original.
     *
     * @param {string[]} deviceClasses
     * @return {string[]}
     */
    findEntitiesByDeviceClass(deviceClasses) {
      if (!deviceClasses.length) return [];
      const deviceEntities = this._deviceEntities;
      return deviceEntities.reduce((result, e) => {
        const stateObj = this.hass.states[e.entity_id];
        if (!stateObj || stateObj.state === consts.STATE_UNAVAILABLE) {
          return result;
        }

        const dc =
          stateObj.attributes.device_class ??
          e.device_class ??
          e.original_device_class;

        if (dc && deviceClasses.includes(dc)) {
          result.push(e.entity_id);
        }
        return result;
      }, []);
    }

    /**
     * State object patched with icon/device_class from the entity registry.
     * Cached per state object (WeakMap).
     *
     * @param {string} entityId
     * @return {Object|undefined}
     */
    getPatchedStateObj(entityId) {
      const stateObj = this.hass.states[entityId];
      if (!stateObj) return undefined;

      if (this.__patchedCache.has(stateObj)) {
        return this.__patchedCache.get(stateObj);
      }

      const registryObj = this.hass.entities[entityId];
      const patched = {
        ...stateObj,
        attributes: {
          ...stateObj.attributes,
          icon:
            stateObj.attributes.icon ??
            registryObj?.icon ??
            registryObj?.original_icon,
          device_class:
            stateObj.attributes.device_class ??
            registryObj?.device_class ??
            registryObj?.original_device_class,
        },
      };

      this.__patchedCache.set(stateObj, patched);
      return patched;
    }

    /**
     * Renders a HUI entities card based on the given entities and configuration.
     * Объектные строки (type: 'attribute' и т.п.) пропускаем как есть —
     * оборачиваем в { entity, name } только строковые entity_id.
     *
     * @param {Array<string|object>} entities
     * @param {boolean} showCard
     * @return {TemplateResult|nothing}
     */
    renderEntitiesCard(entities, showCard = false) {
      if (!this.config || !entities || !showCard) {
        return nothing;
      }

      const entitiesCardConfig = {
        type: 'entities',
        entities: entities.map((row) =>
          typeof row === 'string'
            ? { entity: row, name: this.getEntityName(row) }
            : row,
        ),
      };

      return this.createHuiCardElement(entitiesCardConfig);
    }

    /**
     * Returns a cached or newly created hui-entities-card element.
     * Re-uses existing elements to avoid DOM thrashing on every render.
     *
     * @param {Object} config - The configuration for the HUI entities card.
     * @return {HuiEntitiesCardElement}
     */
    createHuiCardElement(config) {
      if (this._huiCardCache.size > 10) {
        const firstKey = this._huiCardCache.keys().next().value;
        this._huiCardCache.delete(firstKey);
      }

      const key = JSON.stringify(
        config.entities.map((e) => (typeof e === 'string' ? e : e.entity)),
      );

      if (this._huiCardCache.has(key)) {
        const cached = this._huiCardCache.get(key);
        cached.hass = this.hass; // hass всегда обновляем
        return cached;
      }

      const element = document.createElement('hui-entities-card');
      element.setConfig(config);
      element.hass = this.hass;
      this._huiCardCache.set(key, element);
      return element;
    }
  };
