import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers'; // computeStateDisplay,
import registerTemplates from 'ha-template';
import localize from './localize';
import styles from './styles';
import defaultImage from './landroid.svg';
import { version } from '../package.json';
import './landroid-card-editor';
import { isObject, wifiStrengthToQuality } from './helpers';
import * as consts from './constants';
import { DEFAULT_LANG, defaultConfig } from './defaults';
import LandroidCardEditor from './landroid-card-editor';
import './elements/lc-linear-progress';
import './elements/lc-toolbar';
import './elements/lc-stats';

const editorName = 'landroid-card-editor';
const ALLOWED_LANGS = [
  'en',
  'de',
  'ru',
  'fr',
  'es',
  'nl',
  'pl',
  'it',
  'hu',
  'cs',
  'da',
  'sv',
  'et',
  'sl',
];

customElements.define(editorName, LandroidCardEditor);

registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version}`,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;',
);

class LandroidCard extends LitElement {
  _huiCardCache = new Map();

  /**
   * Properties of the LandroidCard element
   *
   * @prop {Object} hass - The Home Assistant instance
   * @prop {Object} config - The user configuration for the card
   * @prop {Boolean} requestInProgress - If a request to the API is currently in progress
   * @prop {Boolean} showSettingsCard - If the card should display a configuration button at the top
   */
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      showSettingsCard: Boolean,
      _entityIds: Array,
      _activeCard: String,
    };
  }

  /**
   * The styles for the LandroidCard element
   *
   * @return {CSSResult} The styles for the LandroidCard element
   */
  static get styles() {
    return styles;
  }

  /**
   * Returns a custom element for editing the user configuration.
   * Home Assistant will display this element in the card editor in the dashboard.
   *
   * @return {Element} Custom element for editing the user configuration
   */
  static async getConfigElement() {
    return document.createElement(editorName);
  }

  /**
   * Returns a default card configuration (without the type: parameter)
   * in json form for use by the card type picker in the dashboard.
   *
   * @param {object} hass - The Home Assistant instance.
   * @param {array} entities - The list of entities.
   * @return {object} The default card configuration configuration object with the entity and image properties.
   */
  static getStubConfig(hass, entities) {
    const lawnMowerEntities = entities.filter(
      (entity_id) => entity_id.split('.')[0] === 'lawn_mower',
    );

    const defaultConfig = {
      entity: lawnMowerEntities[0] || '',
      image: 'default',
    };

    return defaultConfig;
  }

  /**
   * Returns the entity object from the Home Assistant state based on the provided configuration entity.
   *
   * @return {object|undefined} The entity object from the Home Assistant state, or undefined if the entity does not exist.
   */
  get entity() {
    return this.hass?.states[this.config.entity] || undefined;
  }

  /**
   * Returns the user's selected language code as a string.
   *
   * @return {string} The user's selected language code as a string.
   * @example 'en' for English, 'nl' for Dutch, etc.
   */
  get lang() {
    const storedLanguage = localStorage.getItem('selectedLanguage');
    const rawLang = (
      this.hass?.locale?.language ||
      storedLanguage ||
      DEFAULT_LANG
    )
      .split('-')[0]
      .toLowerCase();

    return ALLOWED_LANGS.includes(rawLang) ? rawLang : DEFAULT_LANG;
  }

  /**
   * Returns 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   *
   * @return {string} 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   */
  get RTL() {
    const langTranslations =
      this.hass.translationMetadata.translations[this.lang];
    return langTranslations?.isRTL ? 'rtl' : 'ltr';
  }

  /**
   * The state of the camera entity specified in the config, or undefined if no camera is specified.
   *
   * @return {import('home-assistant').State | undefined} The state of the camera entity specified in the config, or undefined if no camera is specified.
   */
  get camera() {
    return this.hass?.states[this.config.camera];
  }

  /**
   * Returns the URL of the image to display on the card.
   * If the user has specified an image in the config, that image is returned.
   * Otherwise, the default image is returned.
   *
   * @return {string} The URL of the image to display on the card.
   */
  get image() {
    const { image = 'default' } = this.config;
    return image === 'default' ? defaultImage : image;
  }

  /**
   * Returns the size of the image in pixels.
   * The image size is determined by the 'image_size' option in the config,
   * and defaults to 200 pixels if not specified.
   *
   * @return {number} The size of the image in pixels.
   */
  get imageSize() {
    const { image_size: imageSize = 4 } = this.config;
    return imageSize * 50;
  }

  /**
   * Returns a CSS style string to position the image on the left or not.
   * If the user has specified 'image_left: true' in the config, this function returns 'float: left;',
   * otherwise, an empty string is returned.
   *
   * @return {string} A CSS style string to position the image on the left or not.
   */
  get imageLeft() {
    return this.config.image_left ? 'float: left;' : '';
  }

  /**
   * Returns whether or not to show the animation on the card.
   * If the user has not specified the 'show_animation' option in the config,
   * this function returns true (i.e. the animation is shown).
   * Otherwise, this function returns the value of the 'show_animation' option.
   *
   * @return {boolean} Whether or not to show the animation on the card.
   */
  get showAnimation() {
    return this.config?.show_animation ?? true;
  }

  /**
   * Returns whether or not the card should be in compact view mode.
   * If the user has specified 'compact_view: true' in the config, this function returns true.
   * Otherwise, this function returns false.
   *
   * @return {boolean} Whether or not the card should be in compact view mode.
   */
  get compactView() {
    return this.config?.compact_view ?? false;
  }

  /**
   * Returns whether or not to show the name of the Landroid on the card.
   * If the user has not specified the 'show_name' option in the config,
   * this function returns false (i.e. the name is not shown).
   * Otherwise, this function returns the value of the 'show_name' option.
   *
   * @return {boolean} Whether or not to show the name of the Landroid on the card.
   */
  get showName() {
    return this.config?.show_name ?? false;
  }

  /**
   * Returns whether or not to show the status of the Landroid on the card.
   * If the user has not specified the 'show_status' option in the config,
   * this function returns true (i.e. the status is shown).
   * Otherwise, this function returns the value of the 'show_status' option.
   *
   * @return {boolean} Whether or not to show the status of the Landroid on the card.
   */
  get showStatus() {
    return this.config?.show_status ?? true;
  }

  /**
   * Returns whether or not to show the edgecut button on the card.
   * If the user has not specified the 'show_edgecut' option in the config,
   * this function returns true (i.e. the edgecut button is shown).
   * Otherwise, this function returns the value of the 'show_edgecut' option.
   *
   * @return {boolean} Whether or not to show the edgecut button on the card.
   */
  get showEdgecut() {
    return this.config?.show_edgecut ?? true;
  }

  /**
   * Returns whether or not to show the toolbar on the card.
   * If the user has not specified the 'show_toolbar' option in the config,
   * this function returns true (i.e. the toolbar is shown).
   * Otherwise, this function returns the value of the 'show_toolbar' option.
   *
   * @return {boolean} Whether or not to show the toolbar on the card.
   */
  get showToolbar() {
    return this.config?.show_toolbar ?? true;
  }

  /**
   * Returns the list of entities to be displayed as settings in the card.
   * If the user has not specified the 'settings_card' option in the config,
   * this function returns an empty array.
   *
   * @return {string[]} The list of entities to be displayed as settings in the card.
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
              this.hass.states[e.entity_id].state !== consts.UNAVAILABLE,
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
   * Returns the list of entities to be displayed on the card.
   * If the user has not specified the 'entities' option in the config,
   * this function returns an empty object.
   *
   * @return {Object} The list of entities to be displayed on the card.
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
          entities = configured.filter(
            (id) =>
              this.hass.states[id] &&
              this.hass.states[id].state !== consts.UNAVAILABLE,
          );
        } else {
          entities = this.findEntitiesByTranslationKeys(card.translationKeys);
          if (entities.length === 0) {
            entities = this.findEntitiesByDeviceClass(
              consts.DEVICE_CLASS_MAP[cardType] ?? [],
            );
          }
        }
        return [cardType, { entities, labelPosition: card.labelPosition }];
      }),
    );

    this.__cardEntitiesCache = { hass: this.hass, config: this.config, result };
    return result;
  }

  /**
   * Returns a list of entities associated with the device of the given lawn_mower entity.
   * The list is cached for performance reasons.
   * @return {array} A list of entities associated with the device of the given lawn_mower entity.
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
   * Sets the configuration for the component.
   *
   * @param {Object} config - The configuration object to be set.
   * @throws {Error} If the configuration does not contain an 'entity' key.
   * @throws {Error} If the configuration contains an 'actions' key with an array value.
   *                  The 'actions' key should be an object, not an array.
   * @return {void} This function does not return anything.
   */
  setConfig(config) {
    if (!config.entity) {
      throw new Error(localize('error.missing_entity'));
    }

    const actions = config.actions;
    if (actions && Array.isArray(actions)) {
      console.warn(localize('warning.actions_array'));
    }

    this.config = {
      ...defaultConfig,
      ...config,
    };
    // Инициализируем все карточки как скрытые
    this._activeCard = null;

    this._huiCardCache = new Map(); // сброс кеша при новом конфиге
  }

  /**
   * Returns the size of the card in number of columns.
   * The size depends on the compactView property.
   *
   * @return {number} The size of the card.
   */
  getCardSize() {
    return this.compactView ? 3 : 7;
  }

  /**
   * Indicates if the component should update.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {boolean} True if the component should update, false otherwise.
   */
  shouldUpdate(changedProps) {
    if (
      changedProps.has('config') ||
      changedProps.has('_activeCard') ||
      changedProps.has('showSettingsCard') ||
      changedProps.has('requestInProgress')
    ) {
      return true;
    }

    if (!changedProps.has('hass')) return false;

    const oldHass = changedProps.get('hass');
    if (!oldHass) return true;

    if (
      oldHass.states[this.config.entity] !==
      this.hass.states[this.config.entity]
    ) {
      return true;
    }

    if (
      this._entityIds?.some(
        (id) => oldHass.states[id]?.state !== this.hass.states[id]?.state,
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Lifecycle method to update the component when its properties change.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {void} This function does not return anything.
   */
  updated(changedProps) {
    const oldHass = changedProps.get('hass');
    const oldEntityState = oldHass?.states[this.config.entity]?.state;
    const newEntityState = this.hass.states[this.config.entity]?.state;

    if (
      oldHass &&
      (oldEntityState !== newEntityState ||
        this.settingsCardEntitiesChanged(changedProps))
    ) {
      this.requestInProgress = false;
    }

    // Обновляем кеш при смене config или первом рендере
    if (changedProps.has('config') || !this._entityIds) {
      this._entityIds = [
        ...(this.settingsCardEntities || []),
        ...Object.values(this.cardEntities).flatMap((card) => card.entities),
      ];
    }
  }

  /**
   * Checks if any of the entities specified in the settings card have changed.
   * This is used to determine if the component should update when its properties change.
   *
   * @param {Map} changedProperties - Map of changed properties.
   * @return {boolean} True if any of the entities specified in the settings card have changed, false otherwise.
   */
  settingsCardEntitiesChanged(changedProperties) {
    const oldHass = changedProperties.get('hass');
    if (!oldHass || !this._entityIds) return false;

    return this._entityIds.some(
      (entityId) =>
        oldHass.states[entityId]?.state !== this.hass.states[entityId]?.state,
    );
  }

  /**
   * Lifecycle method to update the component when it is connected to the DOM.
   *
   * If the card is not in compact view and a camera entity is specified, the
   * component will request an update every 5 seconds (or as specified by the
   * `camera_refresh` configuration option). This is done to update the camera
   * thumbnail.
   *
   * @return {void} This function does not return anything.
   */
  connectedCallback() {
    super.connectedCallback();
    if (!this.compactView && this.camera) {
      this.requestUpdate();
      this.thumbUpdater = setInterval(
        () => this.requestUpdate(),
        (this.config.camera_refresh || 5) * 1000,
      );
    }
  }

  /**
   * Lifecycle method to clean up when the component is disconnected from the DOM.
   *
   * If the card is not in compact view and a camera entity is specified, the
   * component will clear the interval that is used to request updates every 5
   * seconds (or as specified by the `camera_refresh` configuration option). This
   * is done to prevent the component from continuing to request updates when it
   * is not visible.
   *
   * @return {void} This function does not return anything.
   */
  disconnectedCallback() {
    if (this.camera) {
      clearInterval(this.thumbUpdater);
    }
    super.disconnectedCallback();
  }

  /**
   * Fires a `hass-more-info` event on the component with the entity ID of the
   * Landroid as the detail of the event. This is used to open the more info
   * dialog for the Landroid.
   *
   * @param {string} [entityId=this.entity?.entity_id] - The entity ID of the
   * Landroid. If not specified, the entity ID of the Landroid is used.
   * @return {void} This function does not return anything.
   */
  handleMore(entityId = this.entity?.entity_id) {
    if (!entityId) {
      console.error('handleMore: entityId is null or undefined');
      return;
    }
    fireEvent(
      this,
      'hass-more-info',
      { entityId },
      { bubbles: false, composed: true },
    );
  }

  /**
   * Calls a HA service and handles errors gracefully.
   *
   * @param {Event} e
   * @param {string} service - e.g. 'lawn_mower.start_mowing'
   * @param {Object} serviceData
   */
  async callService(e, service, serviceData = {}) {
    const [domain, name] = service.split('.');
    const { isRequest = false, ...service_data } = serviceData;

    try {
      await this.hass.callService(domain, name, service_data);
    } catch (err) {
      console.error(
        `%c LANDROID-CARD %c ${version} `,
        'color: white; background: #ec6a36; font-weight: 700;',
        'color: #ec6a36; background: white; font-weight: 700;',
        `Service call ${service} failed:`,
        err,
      );
      this.requestInProgress = false;
      return;
    }

    if (isRequest) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  /**
   * Calls a service based on the action parameter and the actions config object.
   *
   * @param {string} action - The action to call, e.g. `start_mowing`, `edgecut`, `pause`, `dock`.
   * @param {Object} [params] - An object of options.
   * @param {string} [params.defaultService] - The service to call if the action is not found in the actions config object.
   * @return {Function} The function to call to trigger the action.
   */
  handleAction(e, action, params = {}) {
    const actions = this.config.actions || {};
    const { defaultService = action, ...service_data } = params;
    delete service_data.action;

    actions[action]
      ? this.callAction(actions[action])
      : this.callService(e, defaultService, service_data);
  }

  /**
   * Calls a service based on the action parameter.
   *
   * @param {Object} action - An object containing information about the action to call.
   * @param {string} action.action - The type of action to call, e.g. `perform-action`, `navigate`, `url`, `more-info`.
   * @param {string} [action.perform_action] - The service to call if `action.action` is `perform-action`.
   * @param {Object} [action.data] - Data to pass to the service if `action.action` is `perform-action`.
   * @param {string} [action.target] - Target to pass to the service if `action.action` is `perform-action`.
   * @param {string} [action.navigation_path] - The path to navigate to if `action.action` is `navigate`.
   * @param {string} [action.url_path] - The URL to open if `action.action` is `url`.
   * @param {string} [action.url_target] - The target to open the URL in if `action.action` is `url`.
   * @param {string} [action.entity] - The entity to open the more info dialog for if `action.action` is `more-info`.
   * @return {void} This function does not return anything.
   */
  async callAction(action) {
    if (!action?.action) return;

    switch (action.action) {
      case 'perform-action': {
        if (!action.perform_action) return;
        const [domain, service] = action.perform_action.split('.');
        try {
          await this.hass.callService(
            domain,
            service,
            action.data ?? {},
            action.target,
          );
        } catch (err) {
          console.error(
            `LANDROID-CARD: perform-action ${action.perform_action} failed:`,
            err,
          );
        }
        break;
      }

      case 'navigate':
        window.history.pushState(null, '', action.navigation_path);
        fireEvent(window, 'location-changed');
        break;

      case 'url':
        window.open(action.url_path, action.url_target ?? '_blank');
        break;

      case 'more-info':
        this.handleMore(action.entity);
        break;

      default:
        console.warn(`LANDROID-CARD: Unknown action type: ${action.action}`);
    }
  }

  /**
   * Retrieves the friendly name of an entity, stripping the device name from it.
   * If the entity is not found or does not have a friendly name, returns an empty string.
   *
   * @param {string} entityId - The entity ID to retrieve the friendly name for.
   * @return {string} The friendly name of the entity, stripped of the device name if present.
   */
  getEntityName(entityId) {
    const entity = this.hass.states[entityId];
    if (!isObject(entity)) return '';

    const deviceName = this.entity?.attributes?.friendly_name ?? '';
    const entityName = entity.attributes?.friendly_name ?? '';

    return entityName.replace(`${deviceName} `, '');
  }

  /**
   * Retrieves an entity object from the Home Assistant state object that matches the given translation key.
   * If no entity is found, returns undefined.
   * Only returns entities that are not 'unavailable'.
   *
   * @param {string} translationKey - The translation key to search for.
   * @return {object|undefined} The entity object from the Home Assistant state object, or undefined if not found.
   */
  getEntityByTranslationKey(translationKey) {
    const found = this._deviceEntities.find(
      (e) => e.translation_key === translationKey,
    );
    return found ? this.hass.states[found.entity_id] : undefined;
  }

  /**
   * Finds entities in the Home Assistant state object that match the given translation keys.
   * Returns an array of entity IDs that match the given translation keys.
   * Only returns entities that are not 'unavailable'.
   * @param {string[]} translationKeys - The translation keys to search for.
   * @return {string[]} An array of entity IDs that match the given translation keys.
   */
  findEntitiesByTranslationKeys(translationKeys) {
    const deviceEntities = this._deviceEntities;
    return translationKeys.reduce((result, key) => {
      const found = deviceEntities.find((e) => e.translation_key === key);
      if (!found) return result;
      const stateObj = this.hass.states[found.entity_id];
      if (stateObj && stateObj.state !== consts.UNAVAILABLE) {
        result.push(found.entity_id);
      }
      return result;
    }, []);
  }

  /**
   * Finds entities associated with the device that match the given device classes.
   * Used as a fallback when translation_key lookup returns no results —
   * typically for non-Landroid integrations (e.g. Mammotion, Husqvarna Automower).
   *
   * The device_class is resolved in the following priority order:
   * 1. `state_obj.attributes.device_class` (runtime state)
   * 2. `entity_registry.device_class` (user override)
   * 3. `entity_registry.original_device_class` (integration default)
   *
   * @param {string[]} deviceClasses - List of device class strings to match against,
   *   e.g. `['battery', 'voltage']`. Returns an empty array if the list is empty.
   * @return {string[]} Array of entity IDs whose device_class matches one of the
   *   provided values. Excludes unavailable entities.
   */
  findEntitiesByDeviceClass(deviceClasses) {
    if (!deviceClasses.length) return [];
    const deviceEntities = this._deviceEntities;
    return deviceEntities.reduce((result, e) => {
      const stateObj = this.hass.states[e.entity_id];
      if (!stateObj || stateObj.state === consts.UNAVAILABLE) return result;

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
   * Toggles the visibility of the given card type and updates the component to reflect the change.
   *
   * @param {string} cardType - The type of card to toggle.
   * @param {string} card - The type of card to toggle.
   * @return {void} This function does not return anything.
   */
  toggleCardVisibility(cardType) {
    this._activeCard = this._activeCard === cardType ? null : cardType;
  }

  /**
   * Retrieves the attributes for the given entity.
   *
   * @param {Object} [entityObject=this.entity] - The entity to retrieve the attributes from.
   * @return {Object} - An object containing the attributes of the entity.
   */
  getAttributes(entityObject = this.entity) {
    if (!isObject(entityObject)) {
      return {};
    }

    const { attributes: entityAttributes, state: entityState } = entityObject;

    return {
      status: entityAttributes.status || entityState || '-',
      state: entityAttributes.state || entityState || '-',
      ...entityAttributes,
    };
  }

  /**
   * Returns a patched version of the state object for the given entity ID.
   * If the state object has not changed since the last call, returns the cached patched version.
   * Otherwise, returns a new patched version with the icon and device class attributes set to the values from the registry object if available.
   * @param {string} entityId - The entity ID to retrieve the patched state object for.
   * @return {Object|undefined} The patched state object, or undefined if the entity ID is not found in the Home Assistant state object.
   */
  getPatchedStateObj(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj) return undefined;

    // Если stateObj не изменился — возвращаем кэш
    if (this.__patchedCache?.get(entityId)?.stateObj === stateObj) {
      return this.__patchedCache.get(entityId).patched;
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

    if (!this.__patchedCache) this.__patchedCache = new Map();
    this.__patchedCache.set(entityId, { stateObj, patched });
    return patched;
  }

  /**
   * Renders a tip button for a given card.
   * label = 0; // none: 0, left: 1 or right: 2
   *
   * @param {string} cardType - The card type.
   * @return {TemplateResult|nothing} The rendered tip button or nothing if the card type is not valid.
   */
  renderTipButton(cardType) {
    const card = this.cardEntities[cardType];
    if (!card) {
      return nothing;
    }

    const entityId = card.entities?.[0];
    if (!entityId) {
      return nothing;
    }

    const entity = this.getPatchedStateObj(entityId);
    if (!entity) {
      return nothing;
    }

    const title = this.getEntityName(entityId);

    const translationKey = this.hass.entities?.[entityId]?.translation_key;
    const state =
      translationKey === consts.TK_SENSOR_WIFI
        ? wifiStrengthToQuality(entity.state)
        : this.hass.formatEntityState(entity);

    const labelContent = html`<div .title="${title}: ${state}">${state}</div>`;

    return html`
      <div class="tip" @click=${() => this.toggleCardVisibility(cardType)}>
        ${card.labelPosition === 1 ? labelContent : ''}
        <state-badge
          .hass=${this.hass}
          .stateObj=${entity}
          .title=${`${title}: ${state}`}
          .stateColor=${true}
        ></state-badge>
        ${card.labelPosition === 2 ? labelContent : ''}
      </div>
    `;
  }

  /**
   * Renders the camera or image based on the provided state.
   *
   * @param {string} state - The state used as a CSS class.
   * @return {TemplateResult|nothing} The rendered camera or image as a lit-html TemplateResult or nothing.
   */
  renderCameraOrImage(state) {
    if (this.compactView) {
      return nothing;
    }

    const cameraEntity = this.hass?.states[this.config.camera];
    if (cameraEntity && cameraEntity.attributes?.entity_picture) {
      return html`
        <img
          style="height: ${this.imageSize}px; ${this.imageLeft}"
          class="camera"
          src="${cameraEntity.attributes.entity_picture}&v=${Date.now()}"
          @click=${() => this.handleMore(this.config.camera)}
        />
      `;
    }

    if (this.image) {
      return html`
        <img
          style="height: ${this.imageSize}px; ${this.imageLeft}"
          class="landroid ${this.showAnimation ? state : ''}"
          src="${this.image}"
          @click="${() => this.handleMore()}"
        />
      `;
    }

    return nothing;
  }

  /**
   * Renders the name of the mower.
   *
   * @return {TemplateResult} The rendered name as a lit-html TemplateResult or nothing.
   */
  renderName() {
    const { friendly_name: name } = this.getAttributes();

    return this.showName
      ? html`<div class="landroid-name" title=${name} @click=${this.handleMore}>
          ${name}
        </div>`
      : nothing;
  }

  /**
   * Renders the status of the mower.
   *
   * @return {TemplateResult} The rendered status as a lit-html TemplateResult or nothing.
   */
  renderStatus() {
    if (!this.showStatus) return nothing;

    const mowerState =
      this.entity?.state || this.entity?.attributes?.state || '-';

    // Все опциональные сущности — если нет, просто undefined
    const zoneSensor = this.getEntityByTranslationKey(consts.TK_SELECT_ZONE);
    const partyMode = this.getEntityByTranslationKey(consts.TK_SWITCH_PARTY);
    const lockMode = this.getEntityByTranslationKey(consts.TK_SWITCH_LOCK);
    const errorSensor = this.getEntityByTranslationKey(consts.TK_SENSOR_ERROR);

    const hasError =
      isObject(errorSensor) &&
      errorSensor.state !== 'no_error' &&
      errorSensor.state !== consts.UNAVAILABLE;

    let localizedStatus = this.hass.formatEntityState(this.entity) || 'Unknown';

    // rain delay — только если есть сенсор дождя
    if (mowerState === consts.STATE_RAINDELAY) {
      const rainSensor = this.getEntityByTranslationKey(
        consts.TK_SENSOR_RAINDELAY,
      );
      if (isObject(rainSensor)) {
        localizedStatus += ` (${this.hass.formatEntityState(rainSensor)})`;
      }
    }

    // зона — только если есть сенсор зоны
    if (mowerState === consts.STATE_MOWING && isObject(zoneSensor)) {
      localizedStatus += ` - ${localize('attr.zone')} ${zoneSensor.state}`;
    }

    // расписание — только если есть next_schedule И party mode выключен (или отсутствует)
    if (
      (mowerState === consts.STATE_DOCKED ||
        mowerState === consts.STATE_IDLE) &&
      partyMode?.state !== 'on'
    ) {
      const nextScheduledStart = this.getEntityByTranslationKey(
        consts.TK_SENSOR_NEXT_SCHEDULE,
      );
      if (isObject(nextScheduledStart)) {
        const nextDate = new Date(nextScheduledStart.state);
        if (!isNaN(nextDate.getTime()) && Date.now() < nextDate.getTime()) {
          localizedStatus += ` - ${this.getEntityName(
            nextScheduledStart.entity_id,
          )} ${this.hass.formatEntityState(nextScheduledStart)}`;
        }
      }
    }

    // party mode и lock — только если сущность есть и включена
    if (partyMode?.state === 'on') {
      localizedStatus += ` - ${this.getEntityName(partyMode.entity_id)}`;
    }
    if (lockMode?.state === 'on') {
      localizedStatus += ` - ${this.getEntityName(lockMode.entity_id)}`;
    }

    // ошибка — только если есть сенсор ошибки
    if (hasError && mowerState !== consts.STATE_RAINDELAY) {
      localizedStatus += ` - ${this.hass.formatEntityState(errorSensor)}`;
    }

    return html`
      <div
        class="status"
        @click=${() => this.handleMore()}
        title=${localizedStatus}
      >
        <span class="status-text ${hasError ? 'status-error' : ''}"
          >${localizedStatus}</span
        >
        <ha-circular-progress
          .indeterminate=${this.requestInProgress}
          size="small"
        ></ha-circular-progress>
      </div>
    `;
  }

  /**
   * Renders a HUI entities card based on the given entities and configuration.
   *
   * @param {Array<string>} entities - The entities to be rendered.
   * @param {boolean} [showCard=false] - Whether to show the card or not.
   * @return {TemplateResult} The rendered HUI entities card component.
   */
  renderEntitiesCard(entities, showCard = false) {
    if (!this.config || !entities || !showCard) return nothing;

    const entitiesCardConfig = {
      type: 'entities',
      entities: entities.map((entity) => ({
        entity: entity,
        name: this.getEntityName(entity),
      })),
    };

    return this.createHuiCardElement(entitiesCardConfig);
  }

  /**
   * Returns a cached or newly created hui-entities-card element.
   * Re-uses existing elements to avoid DOM thrashing on every render.
   *
   * @param {Object} config - The configuration for the HUI entities card.
   * @return {HuiEntitiesCardElement} The hui-entities-card element.
   */
  createHuiCardElement(config) {
    const key = JSON.stringify(config.entities.map((e) => e.entity));

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

  /**
   * Renders the HTML template for the component.
   *
   * @return {TemplateResult} The rendered HTML template.
   */
  render() {
    if (!this.entity || this.entity.state === consts.UNAVAILABLE) {
      return html`
        <ha-card>
          <div class="preview not-available">
            <div class="metadata">
              <div class="not-available">
                ${localize('common.not_available')}
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    const state = this.entity?.attributes?.state || this.entity?.state || '-';

    return html`
      <ha-card>
        <div class="tips">
          ${this.renderTipButton(consts.INFOCARD)}
          ${this.renderTipButton(consts.STATISTICSCARD)}
          ${this.renderTipButton(consts.BATTERYCARD)}
        </div>
        ${Object.entries(this.cardEntities).map(([cardType, card]) =>
          this.renderEntitiesCard(card.entities, this._activeCard === cardType),
        )}
        <div class="preview">
          ${this.renderCameraOrImage(state)}
          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>
          <lc-stats
            style="display: contents;"
            .hass="${this.hass}"
            .stats="${this.config.stats?.[state] ||
            this.config.stats?.default ||
            []}"
            .entityObj="${this.entity}"
            @lc-more-info="${(e) => this.handleMore(e.detail.entityId)}"
          ></lc-stats>
          <lc-toolbar
            .hass="${this.hass}"
            state="${state}"
            .entityId="${this.entity?.entity_id}"
            .showEdgecut="${this.showEdgecut}"
            .edgecutEntityId="${this.getEntityByTranslationKey(
              consts.TK_BUTTON_EDGECUT,
            )?.entity_id}"
            .showToolbar="${this.showToolbar}"
            .settingsEntity="${this.settingsCardEntities}"
            .showSettingsCard="${this.showSettingsCard}"
            .shortcuts="${this.config.shortcuts ?? []}"
            .dailyProgress="${this.getEntityByTranslationKey(
              consts.TK_SENSOR_DAILY_PROGRESS,
            ) || null}"
            @lc-action="${(e) =>
              this.handleAction(e, e.detail.action, e.detail)}"
            @lc-shortcut="${(e) => this.callAction(e.detail.action)}"
            @lc-toggle-config="${() =>
              (this.showSettingsCard = !this.showSettingsCard)}"
          ></lc-toolbar>
        </div>
        ${this.renderEntitiesCard(
          this.settingsCardEntities,
          this.showSettingsCard,
        )}
      </ha-card>
    `;
  }
}

customElements.define('landroid-card', LandroidCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'landroid-card',
  name: localize('common.name'),
  preview: true,
  description: localize('common.description'),
  documentationURL: 'https://github.com/Barma-lej/landroid-card',
});
