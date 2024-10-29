import { LitElement, html, nothing } from 'lit';
import {
  fireEvent,
  hasConfigOrEntityChanged,
  stateIcon,
} from 'custom-card-helpers'; // computeStateDisplay,
import registerTemplates from 'ha-template';
import get from 'lodash.get';
import localize from './localize';
import styles from './styles';
import defaultImage from './landroid.svg';
import { version } from '../package.json';
import './landroid-card-editor';
import { isObject, wifiStrenghtToQuality } from './helpers';
import * as consts from './constants';
import { DEFAULT_LANG, defaultConfig } from './defaults';
import LandroidCardEditor from './landroid-card-editor';
import './elements/lc-linear-progress';

const editorName = 'landroid-card-editor';

customElements.define(editorName, LandroidCardEditor);

registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version}`,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;',
);

class LandroidCard extends LitElement {
  /**
   * Properties of the LandroidCard element
   *
   * @prop {Object} hass - The Home Assistant instance
   * @prop {Object} config - The user configuration for the card
   * @prop {Boolean} requestInProgress - If a request to the API is currently in progress
   * @prop {Boolean} showConfigCard - If the card should display a configuration button at the top
   */
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      showConfigCard: Boolean,
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
   * Returns an object containing the entities associated with the device_id of the configured entity.
   * If the configured entity does not have a device_id or if the device_id is only associated with the configured entity,
   * an empty object is returned.
   *
   * @return {Object} An object containing the entities associated with the device_id of the configured entity.
   */
  get associatedEntities() {
    const { device_id } = this.hass.entities[this.config.entity];
    if (!device_id) {
      console.warn(
        `%c LANDROID-CARD %c ${version} `,
        `Entity ${this.entity.entity_id} doesn't have a device_id attribute or only the entity in device.`,
      );
      return {};
    }

    const entitiesForDevice = Object.values(this.hass.entities)
      .filter((entity) => entity.device_id === device_id)
      .map((entity) => entity.entity_id);

    return entitiesForDevice.reduce(
      (acc, entity_id) => {
        acc[entity_id] = this.hass.states[entity_id];
        return acc;
      },
      {},
    );
  }

  /**
   * Returns the language code for the user's selected language, or the default language if none is selected.
   *
   * @return {string} The language code for the user's selected language, or the default language if none is selected.
   */
  get lang() {
    const storedLanguage = localStorage.getItem('selectedLanguage');

    return (this.hass?.locale?.language || storedLanguage || DEFAULT_LANG)
      .replace(/['"]+/g, '')
      .replace('_', '-');
  }

  /**
   * Returns 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   *
   * @return {string} 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   */
  get RTL() {
    const langTranslations = this.hass.translationMetadata.translations[this.lang];
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
   * If the user has not specified the 'settings' option in the config,
   * this function returns an empty array.
   *
   * @return {string[]} The list of entities to be displayed as settings in the card.
   */
  get settingsEntity() {
    return this.config?.settings ?? [];
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
    return this.settingsEntityChanged(changedProps) || hasConfigOrEntityChanged(this, changedProps);
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
    if (oldHass && (oldEntityState !== newEntityState || this.settingsEntityChanged(changedProps))) {
      this.requestInProgress = false;
    }
  }


  /**
   * Indicates if any of the settings entities have changed.
   *
   * @param {Map} changedProperties - Map of changed properties.
   * @return {boolean} True if any of the settings entities have changed, false otherwise.
   */
  settingsEntityChanged(changedProperties) {
    for (const entityId of this.settingsEntity) {
      const previousState = changedProperties.get('hass')?.states[entityId]?.state;
      const currentState = this.hass.states[entityId]?.state;
      if (previousState !== currentState) {
        return true;
      }
    }
    return false;
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
    fireEvent(this, 'hass-more-info', { entityId }, { bubbles: false, composed: true });
  }

  /**
   * Calls a service based on the service parameter and the serviceData options.
   *
   * @param {Event} e - The event object representing the event that triggered the service call.
   * @param {string} service - The service to call, e.g. `button.press`.
   * @param {Object} [serviceData] - Options for the service call.
   * @param {boolean} [serviceData.isRequest=false] - Whether to trigger a request update after the service call.
   * @return {void} This function does not return anything.
   */
  callService(e, service, serviceData = {}) {

    const [domain, name] = service.split('.');
    const {
      isRequest = false,
      ...service_data
    } = serviceData;

    this.hass.callService(domain, name, service_data);

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
    const {defaultService = action, ...service_data} = params;
    return () => {
      if (!actions[action]) {
        this.callService(e, defaultService, service_data);
        return;
      }

      this.callAction(actions[action]);
    };
  }

  /**
   * Calls the specified action by splitting the service string and calling the corresponding Home Assistant service.
   *
   * @param {Object} action - The action object containing the service and service_data.
   * @param {string} action.service - The service to call in the format "domain.service".
   * @param {Object} action.service_data - The data to pass to the service.
   * @return {void}
   */
  callAction(action) {
    const {service, service_data} = action;
    const [domain, name] = service.split('.');

    this.hass.callService(domain, name, service_data);
  }

  /**
   * Returns the friendly name of the given entity without the device name prefix.
   *
   * @param {string} entityId - The ID of the entity to get the friendly name for.
   * @return {string} The friendly name of the entity.
   */
  getEntityName(entityId) {
    const entity = this.hass.states[entityId];
    if (!isObject(entity))
      return '';

    const { friendly_name: deviceName } = this.getAttributes();
    const { friendly_name: entityName } = entity.attributes;

    return entityName.replace(`${deviceName} `, '');
  }

  /**
   * Retrieves an entity object from the associatedEntities object by matching the given suffix
   * against the entity IDs.
   *
   * @param {string} entitySuffix - The suffix to match against the entity IDs.
   * @return {Object|undefined} The matching entity object, or undefined if no match is found.
   */
  getEntityObject(suffix) {
    if (typeof suffix !== 'string') {
      throw new Error('getEntityObject: suffix must be a string');
    }
  
    const entities = Object.values(this.associatedEntities);

    if (!Array.isArray(entities)) {
      throw new Error('getEntityObject: associatedEntities must be an object');
    }

    return entities.find((entity) =>
        entity.entity_id && entity.entity_id.endsWith(suffix),  
    );
  }

  /**
   * Retrieves an object with entity objects from the associatedEntities object by matching the given suffixes
   * against the entity IDs. The resulting object will only contain entities that have a state other than 'unavailable'.
   *
   * @param {string[]} suffixes - The suffixes to match against the entity IDs.
   * @return {Object} An object with the matching entity objects, where the keys are the entity IDs.
   */
  findEntitiesBySuffixes(suffixes) {
    return suffixes.reduce((result, suffix) => {
      const entitiesWithSuffix = Object.values(this.associatedEntities).filter(
        (entity) => entity && entity.state !== 'unavailable' && entity.entity_id.endsWith(suffix)
      );
      return result.concat(entitiesWithSuffix);
    }, []);
  }

  /**
   * Retrieves an object with entity objects from the associatedEntities object by matching the given suffixes
   * against the entity IDs. The resulting object will only contain entities that have a state other than 'unavailable'.
   *
   * @param {string[]} suffixes - The suffixes to match against the entity IDs.
   * @return {string[]} An array of matching entity IDs.
   */
  findEntitiesIdBySuffixes(suffixes) {
    return suffixes.reduce((entityIds, suffix) => {
      const filteredEntities = Object.values(this.associatedEntities).filter(
        (entity) => entity && entity.state !== 'unavailable' && entity.entity_id.endsWith(suffix)
      );
      return entityIds.concat(filteredEntities.map(entity => entity.entity_id));
    }, []);
    // return this.findEntitiesBySuffixes(suffixes).map(entity => entity.entity_id);
  }

  /**
   * Toggles the visibility of the given card type and updates the component to reflect the change.
   *
   * @param {string} cardType - The type of card to toggle.
   * @param {string} card - The type of card to toggle.
   * @return {void} This function does not return anything.
   */
  toggleCardVisibility(cardType) {
    Object.entries(consts.CARD_MAP).forEach(([key, card]) => {
      card.visibility = key === cardType ? !card.visibility : false;
    });
    this.requestUpdate();
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
   * Renders a tip button for a given card.
   * label = 0; // none: 0, left: 1 or right: 2
   *
   * @param {string} cardType - The card type.
   * @return {TemplateResult|nothing} The rendered tip button or nothing if the card type is not valid.
   */
  renderTipButton(cardType) {
    const card = consts.CARD_MAP[cardType];
    if (!card) {
      return nothing;
    }

    const entity = this.findEntitiesBySuffixes(card.entities)[0];
    if (!entity) {
      return nothing;
    }

    const title = this.getEntityName(entity.entity_id);
    const state = entity.entity_id.includes('rssi')
      ? wifiStrenghtToQuality(entity.state)
      : this.hass.formatEntityState(entity);
    const icon = entity.attributes.icon || stateIcon(entity);
    const labelContent = html`<div .title="${title}: ${state}">${state}</div>`;

    return html`
      <div class="tip" @click=${() => this.toggleCardVisibility(cardType)}>
        ${card.labelPosition === 1 ? labelContent : ''}
        <state-badge
          .stateObj=${entity}
          .title="${title}: ${state}"
          .overrideIcon=${icon}
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
      ? html`<div class="landroid-name" title=${name} @click=${this.handleMore}>${name}</div>`
      : nothing;
  }

  /**
   * Renders the status of the mower.
   *
   * @return {TemplateResult} The rendered status as a lit-html TemplateResult or nothing.
   */
  renderStatus() {
    if (!this.showStatus) return nothing;

    const { state: mowerState } = this.getAttributes();
    const { state: zone } = this.getAttributes(
      this.getEntityObject(consts.SELECT_CURRENT_ZONE_SUFFIX),
    );
    const { state: partyMode } = this.getAttributes(
      this.getEntityObject(consts.SWITCH_PARTY_SUFFIX),
    );

    const { state: locked } = this.getAttributes(
      this.getEntityObject(consts.SWITCH_LOCK_SUFFIX),
    );

    let localizedStatus = localize(`status.${mowerState}`) || mowerState;

    switch (mowerState) {
      case consts.STATE_RAINDELAY: {
        const rainSensor = this.getEntityObject(
          consts.SENSOR_RAINSENSOR_REMAINING_SUFFIX,
        );
        localizedStatus += isObject(rainSensor)
          ? ` (${this.hass.formatEntityState(rainSensor) || ''})`
          : '';
        break;
      }

      case consts.STATE_MOWING:
        localizedStatus += ` - ${localize('attr.zone') || ''} ${zone}`;
        break;

      case consts.STATE_DOCKED:
      case consts.STATE_IDLE: {
        if (partyMode === 'off') {
          const nextScheduledStart = this.getEntityObject(
            consts.SENSOR_NEXT_SCHEDULED_START_SUFFIX,
          );
          if (
            isObject(nextScheduledStart) &&
            Date.parse(new Date()) < Date.parse(nextScheduledStart.state)
          ) {
            localizedStatus += ` - ${
              localize('attr.next_scheduled_start') || ''
            } ${this.hass.formatEntityState(nextScheduledStart)}`;
          }
        }
        break;
      }

      case consts.STATE_OFFLINE:
      default:
        break;
    }

    localizedStatus += partyMode === 'on' ? ` - ${localize('attr.party_mode') || ''}` : '';
    localizedStatus += locked === 'on' ? ` - ${localize('status.locked') || ''}` : '';

return html`
      <div
        class="status"
        @click=${() => this.handleMore()}
        title=${localizedStatus}
      >
        <span class="status-text">${localizedStatus}</span>
        <ha-circular-progress
          .indeterminate=${this.requestInProgress}
          size="small"
        ></ha-circular-progress>
      </div>
    `;
  }

  /**
   * Renders the statistics for a given state.
   *
   * @param {string} state - The state used as a CSS class.
   * @return {Array<TemplateResult>} An array of template results representing the statistics.
   */
  renderStats(state) {
    const statsList = this.config.stats?.[state] || this.config.stats?.default || [];

    return statsList.map(({ entity_id, attribute, value_template, unit, subtitle }) => {
      if (!entity_id && !attribute && !value_template) {
        return nothing;
      }

      try {
        const value = entity_id
          ? this.hass.states[entity_id].state
          : get(this.entity.attributes, attribute);

        return html`
          <div
            class="stats-block"
            title="${subtitle}"
            @click="${() => this.handleMore(entity_id)}"
          >
            <span class="stats-value">
              <ha-template
                hass=${this.hass}
                template=${value_template}
                value=${value}
                .variables=${{ value }}
              ></ha-template>
            </span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      } catch (e) {
        console.warn(e);
        return nothing;
      }
    });
  }

  /**
 * Renders the toolbar component based on the current state.
 *
 * @param {string} state - The current state of the component.
 * @return {TemplateResult} The rendered toolbar component.
 */
  renderToolbar(state) {
    if (!this.showToolbar) {
      return nothing;
    }

    const dailyProgress = this.getEntityObject(
      consts.SENSOR_DAILY_PROGRESS_SUFFIX,
    );

    return html`
      <div class="toolbar">
        ${this.renderButtonsForState(state)}
        <div class="fill-gap"></div>
        ${this.renderShortcuts()}
        ${this.config.settings
          ? html`
            <ha-icon-button
              label="${localize('action.config')}"
              @click="${() => (this.showConfigCard = !this.showConfigCard)}"
            >
              <ha-icon icon="mdi:tools"></ha-icon>
            </ha-icon-button>
          `
          : nothing
        }
        ${dailyProgress
          ? html`
              <lc-linear-progress
                title="${dailyProgress.attributes
                  .friendly_name}: ${this.hass.formatEntityState(
                  dailyProgress,
                )}"
                aria-hidden="true"
                role="progressbar"
                progress="${dailyProgress.state || 0}"
              >
              </lc-linear-progress>
            `
          : nothing}
      </div>
    `;
  }

  /**
   * Renders the buttons based on the state of the lawn mower.
   *
   * @param {string} state - The current state of the lawn mower.
   * @return {TemplateResult} The rendered buttons.
   */
  renderButtonsForState(state) {
    switch (state) {
      case consts.STATE_EDGECUT:
      case consts.STATE_INITIALIZING:
      case consts.STATE_MOWING:
      case consts.STATE_SEARCHING_ZONE:
      case consts.STATE_STARTING:
      case consts.STATE_ZONING:
        return html`
          ${this.renderButton(consts.ACTION_PAUSE, { label: true })}
          ${this.renderButton(consts.ACTION_DOCK, { label: true })}
        `;

      case consts.STATE_PAUSED:
        return html`
          ${this.renderButton(consts.ACTION_MOWING, { label: true })}
          ${this.renderButton(consts.ACTION_EDGECUT, { label: true })}
          ${this.renderButton(consts.ACTION_DOCK, { label: true })}
        `;

      case consts.STATE_RETURNING:
        return html`
          ${this.renderButton(consts.ACTION_MOWING)}
          ${this.renderButton(consts.ACTION_PAUSE)}
        `;

      case consts.STATE_ERROR:
      case consts.STATE_DOCKED:
      case consts.STATE_OFFLINE:
      case consts.STATE_RAINDELAY:
      default:
        return html`
          ${this.renderButton(consts.ACTION_MOWING)}
          ${this.renderButton(consts.ACTION_EDGECUT)}
          ${state === 'idle' ? this.renderButton(consts.ACTION_DOCK) : nothing}
        `;
    }
  }

  /**
   * Renders a button based on the given action and parameters.
   *
   * @param {string} action - The action to be performed when the button is clicked.
   * @param {Object} [params] - Optional parameters for rendering the button.
   * @param {boolean} [params.asIcon=false] - Whether to render the button as an icon or a toolbar button.
   * @param {boolean} [params.label=false] - Whether to include a title for the button.
   * @param {string} [params.defaultService] - The default service.
   * @param {boolean} [params.isRequest=true] - Requests an update which is processed asynchronously by default.
   * @return {TemplateResult} The rendered button component.
   */
  renderButton(action, params = {}) {
    if (!action) return nothing;

    const {
      asIcon = false,
      label = false,
      defaultService = consts.ACION_BUTTONS[action].action,
      isRequest = true,
      ...serviceData
    } = params;

    const icon = consts.ACION_BUTTONS[action].icon;
    const title = localize(`action.${action}`);
    const entity_id = action === consts.ACTION_EDGECUT
      ? this.getEntityObject(consts.BUTTON_EDGECUT_SUFFIX)?.entity_id || this.entity.entity_id
      : this.entity.entity_id;

    const service_data = {
      defaultService,
      entity_id,
      isRequest,
      ...serviceData,
    };

    if (asIcon) {
      return html`
        <div
          class="tip"
          title="${title}"
          @click="${(e) => this.handleAction(e, action, service_data)}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return label
        ? html`
            <ha-button
              @click="${(e) => this.handleAction(e, action, service_data)}"
              title="${title}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${title}
            </ha-button>
          `
        : html`
            <ha-icon-button
              label="${title}"
              @click="${(e) => this.handleAction(e, action, service_data)}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `;
    }
  }

  /**
 * Renders the shortcuts based on the current configuration.
 *
 * @return {TemplateResult} The rendered shortcuts component.
 */
  renderShortcuts() {
    const { shortcuts = [] } = this.config;
    return html`
      ${shortcuts.map(({ name, service, icon, service_data }) => {
        const execute = () => this.callAction({ service, service_data });
        return html`
          <ha-icon-button label="${name}" @click="${execute}">
            <ha-icon icon="${icon}"></ha-icon>
          </ha-icon-button>
        `;
      })}
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
      entities: entities.map(entity => ({
        entity: entity,
        name: this.getEntityName(entity),
      }))
    };

    return this.createHuiCardElement(entitiesCardConfig);
  }

  /**
   * Creates a HUI entities card element with the given configuration.
   *
   * @param {Object} config - The configuration for the HUI entities card.
   * @return {HuiEntitiesCardElement} The created HUI entities card element.
   */
  createHuiCardElement(config) {
    const element = document.createElement('hui-entities-card');
    element.setConfig(config);
    element.hass = this.hass;
    return element;
  }

  /**
   * Renders the HTML template for the component.
   *
   * @return {TemplateResult} The rendered HTML template.
   */
  render() {
    if (!this.entity) {
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

    const { state } = this.getAttributes();

    return html`
      <ha-card>
        <div class="tips">
          ${this.renderTipButton(consts.INFOCARD)}
          ${this.renderTipButton(consts.STATISTICSCARD)}
          ${this.renderTipButton(consts.BATTERYCARD)}
        </div>
        <div class="preview">
        </div>
        ${Object.values(consts.CARD_MAP).map((card) => this.renderEntitiesCard(this.findEntitiesIdBySuffixes(card.entities), card.visibility))}
        <div class="preview">
          ${this.renderCameraOrImage(state)}
          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>
          <div class="stats">${this.renderStats(state)}</div>
          ${this.renderToolbar(state)}
        </div>
        ${this.renderEntitiesCard(this.settingsEntity, this.showConfigCard)}
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
  documentationURL: "https://github.com/Barma-lej/landroid-card",
});
