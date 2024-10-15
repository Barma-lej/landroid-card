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
import { stopPropagation, isObject, wifiStrenghtToQuality } from './helpers';
import * as consts from './constants';
import { DEFAULT_LANG, defaultConfig } from './defaults';
import LandroidCardEditor from './landroid-card-editor';
import './elements/landroid-linear-progress';

const editorName = 'landroid-card-editor';
const SENSOR_DEVICE_CLASS_TIMESTAMP = 'timestamp';

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
   * @prop {Boolean} showConfigBar - If the card should display a configuration button at the top
   */
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      showConfigBar: Boolean,
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
    return this.hass.states[this.config.entity] || undefined;
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
    return hasConfigOrEntityChanged(this, changedProps);
  }

  /**
   * Lifecycle method to update the component when its properties change.
   *
   * If the user has navigated away from the card, and then navigates back to it,
   * the component needs to be updated to reflect the current state of the Landroid.
   * This method is called whenever the component's properties change (e.g. the
   * user navigates away and back to the card, or the user changes the
   * configuration of the card).
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {void} This function does not return anything.
   */
  updated(changedProps) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity].state !==
        this.hass.states[this.config.entity].state
    ) {
      this.requestInProgress = false;
    }
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
    super.disconnectedCallback();
    if (this.camera) {
      clearInterval(this.thumbUpdater);
    }
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
   * Returns an object containing the domain, service, and field for a given service.
   * Returns undefined if the service is not found.
   *
   * @param {string} service - The service to find.
   * @return {Object|undefined} The object with the domain, service, and field if found, undefined otherwise.
   */

  /**
   * Returns an object containing the domain, service, and field for a given service.
   * 
   * This function iterates over the services in the `hass.services` object and
   * checks if a service with the given name exists. If a service with the given
   * name is found, an object with the domain, service, and field is returned.
   * If no service with the given name is found, the function returns undefined.
   * 
   * @param {string} service - The service to find.
   * @return {Object|undefined} The object with the domain, service, and field if found, undefined otherwise.
   */
  getServiceObject(service) {
    if (!service) return undefined;

    for (const domain of consts.SERVICE_DOMAINS) {
      if (this.hass.services[domain] === undefined) {
        throw new Error(`hass.services does not contain the domain ${domain}`);
      }
      const domainServices = this.hass.services[domain];

      if (domainServices[service]) {
        const field = Object.keys(domainServices[service].fields)[0];
        return { domain, service, field };
      }

      for (const [serviceName, serviceData] of Object.entries(domainServices)) {
        if (serviceData.fields[service]) {
          return { domain, service: serviceName, field: service };
        }
      }
    }
    return undefined;
  }

  /**
   * Calls a service on the Landroid entity.
   *
   * @param {Event} e - The event object, typically from a click event.
   * @param {string} service - The name of the service to call, e.g. `start_mowing`.
   * @param {Object} [params] - An object of options.
   * @param {boolean} [params.isRequest=false] - If true, sets `requestInProgress` to true.
   * @param {Object} [params.entity] - The entity to call the service on, defaults to the entity of the card.
   * @param {Object} [params.service_data] - Data to pass to the service, overrides any field specified in the service.
   * @return {void} This function does not return anything.
   */
  callService(e, service, params = {}) {
    if (!service) return undefined;

    const {isRequest = false, entity = this.entity, service_data = {}} = params;

    let serviceObject = this.getServiceObject(service);

    if (!isObject(serviceObject)) {
      const [domain, name] = service.split('.');
      serviceObject = {
        domain: domain,
        service: name,
      }
    }

    if (isObject(serviceObject)) {
      const options = serviceObject.field
        ? { [serviceObject.field]: e.target.value }
        : {...service_data};

      this.hass.callService(serviceObject.domain, serviceObject.service, {
        entity_id: [entity.entity_id],
        ...options,
      });

      if (isRequest) {
        this.requestInProgress = true;
        this.requestUpdate();
      }
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
  handleAction(action, params = {}) {
    const actions = this.config.actions || {};
    const {defaultService = action} = params;
    return () => {
      if (!actions[action]) {
        this.callService({}, defaultService, params);
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
    const { service, service_data } = action;
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, service_data);
  }

  /**
   * Retrieves the friendly name of an entity without the device name.
   *
   * @param {Object} entity - The entity object for which to retrieve the name.
   * @return {string} The friendly name of the entity without the device name.
   */
  getEntityName(entity) {
    if (!isObject(entity)) return '';

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
   * Renders a button based on the given action and parameters.
   *
   * @param {string} action - The action to be performed when the button is clicked.
   * @param {Object} [params] - Optional parameters for rendering the button.
   * @param {boolean} [params.asIcon=false] - Whether to render the button as an icon or a toolbar button.
   * @param {boolean} [params.label=false] - Whether to include a title for the button.
   * @param {string} [params.defaultService] The default service
   * @param {boolean} [params.isRequest] Default is true. Requests an update which is processed asynchronously
   * @return {TemplateResult} The rendered button component.
   */
  renderButton(action, { asIcon = false, label = false, defaultService, isRequest = true } = {}) {
    if (!action) {
      return nothing;
    }

    const buttonConfig = {
      [consts.ACTION_MOWING]: {
        icon: 'mdi:play',
        title: localize(`action.${consts.ACTION_MOWING}`),
      },
      [consts.ACTION_EDGECUT]: {
        icon: 'mdi:motion-play',
        title: localize(`action.${consts.ACTION_EDGECUT_TITLE}`),
      },
      [consts.ACTION_PAUSE]: {
        icon: 'mdi:pause',
        title: localize(`action.${consts.ACTION_PAUSE}`),
      },
      [consts.ACTION_DOCK]: {
        icon: 'mdi:home-import-outline',
        title: localize(`action.${consts.ACTION_DOCK}`),
      },
    };

    const { icon, title } = buttonConfig[action] || {};

    if (asIcon) {
      return html`
        <div
          class="tip"
          title="${title}"
          @click="${this.handleAction(action, { defaultService, isRequest })}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return label
        ? html`
            <ha-button
              @click="${this.handleAction(action, { defaultService, isRequest })}"
              title="${title}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${title}
            </ha-button>
          `
        : html`
            <ha-icon-button
              label="${title}"
              @click="${this.handleAction(action, { defaultService, isRequest })}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `;
    }
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

    const title = this.getEntityName(entity);
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
        if (partyMode === 'on') {
          localizedStatus += ` (${localize('attr.party_mode') || ''})`;
        } else {
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
   * Renders a configuration entity based on its domain.
   *
   * @param {string} entityId - The entity ID of the configuration entity.
   * @return {TemplateResult|nothing} The rendered configuration entity as a lit-html TemplateResult or nothing.
   */
  renderConfigEntity(entityId) {
    const stateObj = this.getEntityObject(entityId);
    if (!stateObj) return nothing;
    const domain = entityId.split('.')[0];

    switch (domain) {
      case 'button':
        return this.renderButtonEntity(stateObj);

      case 'number':
        return this.renderNumber(stateObj);

      case 'select':
        return this.renderSelectRow(stateObj);

      case 'switch':
        return this.renderToggleEntity(stateObj);

      default:
        return nothing;
    }
  }

  /**
   * Renders the configuration bar if `showConfigBar` is true.
   *
   * @return {TemplateResult} The configuration bar as a lit-html TemplateResult.
   */
  renderConfigBar() {
    if (!this.showConfigBar) return nothing;

    const { settings } = this.config;

    return html`
      <div class="entitiescard">
        <div id="states" class="card-content">
          ${settings.map((entity_id) => this.renderConfigEntity(entity_id))}
        </div>
      </div>
    `;
  }

  /**
   * Renders the Entities Card for a given card type.
   *
   * @param {string} card - The type of card to render.
   * @return {TemplateResult|nothing} The rendered Entities Card or nothing if the card is not visible.
   */
  renderEntitiesCard(card) {
    if (!consts.CARD_MAP[card].visibility) return nothing;

    try {
      const entities = this.findEntitiesBySuffixes(
        consts.CARD_MAP[card].entities,
      );

      return html`
        <div class="entitiescard">
          <div id="states" class="card-content">
            ${Object.values(entities).map((entity) =>
              this.renderEntityRow(entity),
            )}
          </div>
        </div>
      `;
    } catch (e) {
      console.warn(e);
      return nothing;
    }
  }

  /**
   * Presses a button entity when the corresponding button is clicked.
   *
   * @param {Event} e - The click event.
   * @param {string} entity_id - The entity ID of the button entity.
   */
  pressButton(e, entity_id) {
    e.stopPropagation();
    this.hass.callService("button", "press", {
      entity_id,
    });
  }

  /**
   * Renders a button for a given entity in the UI.
   *
   * @param {Object} stateObj - The entity object to render.
   * @return {TemplateResult} The rendered button as a TemplateResult.
   */
  renderButtonEntity(stateObj) {
    if (!stateObj || stateObj.state === consts.UNAVAILABLE) return nothing;

    const config = {
      entity: stateObj.entity_id,
      name: this.getEntityName(stateObj),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        <mwc-button
          @click=${(e) => this.pressButton(e, config.entity)}
          .disabled=${stateObj.state === consts.UNAVAILABLE}
        >
          ${this.hass.localize("ui.card.button.press")}
        </mwc-button>
      </hui-generic-entity-row>
    `;
  }

  /**
 * Renders a row for a given entity in the UI.
 *
 * @param {Object} stateObj - The entity object to render.
 * @return {TemplateResult} The rendered row as a TemplateResult.
 */
  renderEntityRow(stateObj) {
    if (!stateObj || stateObj.state === consts.UNAVAILABLE) return nothing;

    const entity_id = stateObj.entity_id;
    const title = this.getEntityName(stateObj);
    const config = { entity: entity_id, name: title };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        <div
          class="text-content value"
          @action=${() => this.handleMore(entity_id)}
        >
          ${stateObj.attributes.device_class ===
            SENSOR_DEVICE_CLASS_TIMESTAMP && !stateObj.state.includes('unknown')
            ? html`
                <hui-timestamp-display
                  .hass=${this.hass}
                  .ts=${new Date(stateObj.state)}
                  capitalize
                ></hui-timestamp-display>
              `
            : this.hass.formatEntityState(stateObj)}
        </div>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Handles the change event when a number input value is changed.
   * If the new value is different from the current state of the entity,
   * it calls the 'number.set_value' service with the updated value.
   *
   * @param {Event} e - The event object representing the change event.
   * @param {Object} stateObj - The entity object representing the state.
   * @return {void} This function does not return anything.
   */
  selectedValueChanged(e, stateObj) {
    if (e.target.value !== stateObj.state) {
      // this.callService(e, 'number.set_value');
      this.hass.callService('number', 'set_value', {
        entity_id: stateObj.entity_id,
        value: e.target.value,
      });
    }
  }

  /**
   * Renders a number input row (Slider or TextField) for an entity card.
   *
   * @param {Object} stateObj - The entity object.
   * @return {TemplateResult} The rendered number input row.
   */
  renderNumber(stateObj) {
    if (!stateObj || stateObj.state === consts.UNAVAILABLE) return nothing;

    const config = {
      entity: stateObj.entity_id,
      name: this.getEntityName(stateObj),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        ${stateObj.attributes.mode === 'slider' ||
        (stateObj.attributes.mode === 'auto' &&
          (Number(stateObj.attributes.max) - Number(stateObj.attributes.min)) /
            Number(stateObj.attributes.step) <=
            256)
          ? html`
              <div class="flex">
                <ha-slider
                  labeled
                  .disabled=${stateObj.state === consts.UNAVAILABLE}
                  .step=${Number(stateObj.attributes.step)}
                  .min=${Number(stateObj.attributes.min)}
                  .max=${Number(stateObj.attributes.max)}
                  .value=${Number(stateObj.state)}
                  @change=${(e) => this.selectedValueChanged(e, stateObj)}
                ></ha-slider>
                <span class="state">
                  ${this.hass.formatEntityState(stateObj)}
                </span>
              </div>
            `
          : html`
              <div class="flex state">
                <ha-textfield
                  autoValidate
                  .disabled=${stateObj.state === consts.UNAVAILABLE}
                  pattern="[0-9]+([\\.][0-9]+)?"
                  .step=${Number(stateObj.attributes.step)}
                  .min=${Number(stateObj.attributes.min)}
                  .max=${Number(stateObj.attributes.max)}
                  .value=${stateObj.state}
                  .suffix=${stateObj.attributes.unit_of_measurement}
                  type="number"
                  @change=${(e) => this.selectedValueChanged(e, stateObj)}
                ></ha-textfield>
              </div>
            `}
      </hui-generic-entity-row>
    `;
  }

  /**
   * Renders a select row for the given entity state object.
   *
   * @param {Object} stateObj - The entity state object.
   * @return {TemplateResult} The rendered select row.
   */
  renderSelectRow(stateObj) {
    if (!stateObj  || stateObj.state === consts.UNAVAILABLE) return nothing;
    // if (!stateObj) {
    //   return html`
    //     <hui-warning>
    //       ${this.hass.createEntityNotFoundWarning(this.hass, stateObj)}
    //     </hui-warning>
    //   `;
    // }

    const config = {
      entity: stateObj.entity_id,
      name: this.getEntityName(stateObj),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config} hideName>
        <ha-select
          .label=${this.getEntityName(stateObj)}
          .value=${stateObj.state}
          .disabled=${stateObj.state === consts.UNAVAILABLE}
          naturalMenuWidth
          @selected=${(e) => this.selectedChanged(e, stateObj)}
          @click=${stopPropagation}
          @closed=${stopPropagation}
        >
          ${stateObj.attributes.options
            ? stateObj.attributes.options.map(
                (option) => html`
                  <mwc-list-item .value=${option}>
                    ${this.hass.formatEntityState(stateObj, option)}
                  </mwc-list-item>
                `,
              )
            : ''}
        </ha-select>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Handles the change event when a select option is selected.
   *
   * @param {Event} e - The event object representing the change event.
   * @param {Object} stateObj - The entity object representing the state.
   * @return {void} This function does not return anything.
   */
  selectedChanged(e, stateObj) {
    const option = e.target.value;
    if (
      option === stateObj.state ||
      !stateObj.attributes.options.includes(option)
    ) {
      return;
    }

    this.hass.callService('select', 'select_option', {
      entity_id: [stateObj.entity_id],
      option,
    });
  }

  /**
   * Generates Toggle Entity Row for Entities Card
   * @param {Object} stateObj Entity object
   * @return {TemplateResult} Toggle Entity Row
   */
  renderToggleEntity(stateObj) {
    if (!stateObj || stateObj.state === consts.UNAVAILABLE) return nothing;

    const entity_id = stateObj.entity_id;
    const title = this.getEntityName(stateObj);
    const config = { entity: entity_id, name: title };

    const showToggle =
      stateObj.state === 'on' ||
      stateObj.state === 'off' ||
      consts.isUnavailableState(stateObj.state);

    return html`
      <hui-generic-entity-row
        .hass=${this.hass}
        .config=${config}
        .catchInteraction=${!showToggle}
      >
        ${showToggle
          ? html`
              <ha-entity-toggle
                .hass=${this.hass}
                .stateObj=${stateObj}
              ></ha-entity-toggle>
            `
          : html`
              <div class="text-content">
                ${this.hass.formatEntityState(stateObj)}
              </div>
            `}
      </hui-generic-entity-row>
    `;
  }

  /**
   * Renders the appropriate buttons based on the given state.
   *
   * @param {string} state - The state of the lawn mower.
   * @return {TemplateResult} The template result containing the rendered buttons.
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
          ${this.renderButton(consts.ACTION_EDGECUT, { label: true, entity: this.getEntityObject(consts.BUTTON_EDGECUT_SUFFIX) })}
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
      default: {
        return html`
          ${this.renderButton(consts.ACTION_MOWING)}
          ${this.renderButton(consts.ACTION_EDGECUT, { entity: this.getEntityObject(consts.BUTTON_EDGECUT_SUFFIX) })}
          ${state === 'idle' ? this.renderButton(consts.ACTION_DOCK) : ''}
        `;
      }
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
              @click="${() => (this.showConfigBar = !this.showConfigBar)}"
            >
              <ha-icon icon="mdi:tools"></ha-icon>
            </ha-icon-button>
          `
          : nothing
        }
        ${dailyProgress
          ? html`
              <landroid-linear-progress
                title="${dailyProgress.attributes
                  .friendly_name}: ${this.hass.formatEntityState(
                  dailyProgress,
                )}"
                aria-hidden="true"
                role="progressbar"
                progress="${dailyProgress.state || 0}"
              >
              </landroid-linear-progress>
            `
          : nothing}
      </div>
    `;
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
        <div class="preview">
          <div class="tips">
            ${this.renderTipButton(consts.INFOCARD)}
            ${this.renderTipButton(consts.STATISTICSCARD)}
            ${this.renderTipButton(consts.BATTERYCARD)}
          </div>
        </div>
        ${this.renderEntitiesCard(consts.INFOCARD)}
        ${this.renderEntitiesCard(consts.STATISTICSCARD)}
        ${this.renderEntitiesCard(consts.BATTERYCARD)}
        <div class="preview">
          ${this.renderCameraOrImage(state)}
          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          <div class="stats">${this.renderStats(state)}</div>
          ${this.renderToolbar(state)}
        </div>
        ${this.renderConfigBar()}
      </ha-card>
    `;
  }
}

customElements.define('landroid-card', LandroidCard);

window.customCards = window.customCards || [];
window.customCards.push({
  preview: true,
  type: 'landroid-card',
  name: localize('common.name'),
  description: localize('common.description'),
});
