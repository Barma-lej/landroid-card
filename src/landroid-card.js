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
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      showConfigBar: Boolean,
    };
  }

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
    const [landroidEntity] = entities.filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === 'lawn_mower',
    );

    return {
      entity: landroidEntity || '',
      image: 'default',
    };
  }

  /**
   * Returns the entity object from the Home Assistant state based on the provided configuration entity.
   *
   * @return {object} The entity object from the Home Assistant state.
   */
  get entity() {
    return this.hass.states[this.config.entity];
  }

  /**
   * Returns an object containing the entities associated with the device_id of the configured entity.
   * If the configured entity does not have a device_id or if the device_id is only associated with the configured entity,
   * an empty object is returned and a warning is logged.
   *
   * @return {Object} An object containing the entities associated with the device_id of the configured entity.
   */
  get deviceEntities() {
    const deviceId = this.hass.entities[this.config.entity].device_id || false;
    if (deviceId) {
      const entitiesForDevice = Object.values(this.hass.entities)
        .filter((entity) => entity.device_id === deviceId)
        .map((entity) => entity.entity_id);

      // Получение объекта сущностей из this.hass.states для указанных entity_id
      const entities = entitiesForDevice.reduce((acc, entityId) => {
        acc[entityId] = this.hass.states[entityId];
        return acc;
      }, {});

      return entities;
    } else {
      console.warn(
        `%c LANDROID-CARD %c ${version} `,
        `Entity ${this.entity.entity_id} doesn't have a device_id attribute or only the entity in device.`,
      );
      return {};
    }
  }

  /**
   * Returns the language code for the user's selected language, or the default language if none is selected.
   *
   * @return {string} The language code for the user's selected language, or the default language if none is selected.
   */
  get lang() {
    const langStored = localStorage.getItem('selectedLanguage');

    return (this.hass.locale.language || langStored || DEFAULT_LANG)
      .replace(/['"]+/g, '')
      .replace('_', '-');
  }


  get RTL() {
    const translations = this.hass.translationMetadata.translations[this.lang];
    return translations?.['isRTL'] ? 'rtl' : 'ltr';
  }

  get camera() {
    if (!this.hass) return null;

    return this.hass.states[this.config.camera];
  }

  get image() {
    if (this.config.image === 'default') return defaultImage;

    return this.config.image || defaultImage;
  }

  get imageSize() {
    if (this.config.image_size === undefined) return 4 * 50;

    return this.config.image_size * 50;
  }

  get imageLeft() {
    if (this.config.image_left === undefined) return '';

    return this.config.image_left ? 'float: left;' : '';
  }

  get showAnimation() {
    if (this.config.show_animation === undefined) return true;

    return this.config.show_animation;
  }

  get compactView() {
    if (this.config.compact_view === undefined) return false;

    return this.config.compact_view;
  }

  get showName() {
    if (this.config.show_name === undefined) return false;

    return this.config.show_name;
  }

  get showStatus() {
    if (this.config.show_status === undefined) return true;

    return this.config.show_status;
  }

  get showToolbar() {
    if (this.config.show_toolbar === undefined) return true;

    return this.config.show_toolbar;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error(localize('error.missing_entity'));
    }

    // const deviceId = this.hass.entities[config.entity].device_id;

    // const entityEndings = Object.values(consts.CARD_MAP)
    //   .map((card) => card.entities)
    //   .flat()
    //   .filter((entity) => entity.endsWith('_entity'));

    // const entityIds = entityEndings.map((entity) => entity.replace('_entity', ''));

    // const deviceEntities = Object.values(this.hass.entities)
    //   .filter((entity) => entity.device_id === deviceId)
    //   .map((entity) => entity.entity_id);

    // const multidimensionalArray = [];
    // for (let i = 0; i < 5; i++) {
    //   const ending = entityEndings[i];
    //   const entitiesWithEnding = deviceEntities.filter((entityId) => entityId.endsWith(ending));
    //   multidimensionalArray.push(entitiesWithEnding);
    // }

    // console.log(multidimensionalArray);
    // const [BATTERYCARD] = Object.keys(consts.CARD_MAP);

    const actions = config.actions;
    if (actions && Array.isArray(actions)) {
      console.warn(localize('warning.actions_array'));
    }

    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  getCardSize() {
    // const header = 44;
    // const imageSize = this.imageSize;
    // const metadata = 20 + (this.showName * 21) + (this.showStatus * 28);
    // const stats = (this.config.stats || 0) * 63;
    // const toolbar = this.showToolbar * 59;
    // var size = header + metadata + stats + toolbar;
    // if (!this.config.compact_view) {
    //   if (this.imageLeft) {
    //     size = Math.floor((size > imageSize)?size:imageSize / 50);
    //   } else {
    //     size = Math.floor(size + imageSize / 50);
    //   }
    // }

    // return size;
    return this.config.compact_view || false ? 3 : 8;
  }

  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  updated(changedProps) {
    if (
      changedProps.get('hass') &&
      changedProps.get('hass').states[this.config.entity].state !==
        this.hass.states[this.config.entity].state
    ) {
      this.requestInProgress = false;
    }
  }

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

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.camera) {
      clearInterval(this.thumbUpdater);
    }
  }

  handleMore(entityId = this.entity.entity_id) {
    fireEvent(
      this,
      'hass-more-info',
      { entityId },
      { bubbles: false, composed: true },
    );
  }

  /**
   * Search for service in domains per field.
   *
   * @param {string} service - The field of the service to search for.
   * @returns {Object|undefined} - An object with the domain, service, and field of the service if found,
   *                              or undefined if not found.
   */
  getServiceObject(service) {
    if (!service) return undefined;

    for (const domain of consts.SERVICE_DOMAINS) {
      const domainServices = this.hass.services[domain];

      if (domainServices[service]) {
        return {
          domain,
          service,
          field: Object.keys(domainServices[service].fields)[0],
        };
      }

      for (const [key, value] of Object.entries(domainServices)) {
        if (value.fields[service]) {
          return { domain, service: key, field: service };
        }
      }
    }
    return undefined;
  }

/**
 * Calls a service with the given parameters.
 *
 * @param {Event} e - The event object.
 * @param {string} service - The service to call.
 * @param {Object} params - The parameters for the service call.
 * @param {boolean} params.isRequest - Whether the service call is a request.
 * @param {Object} params.entity - The entity for the service call.
 * @param {Object} params.service_data - Additional service data.
 * @return {undefined} Returns undefined if the service is not provided.
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
 * Handles the given action by either calling a default service or an action defined in the configuration.
 *
 * @param {string} action - The action to handle.
 * @param {Object} [params] - Optional parameters for the action.
 * @param {string} [params.defaultService=action] - The default service to call if the action is not defined in the configuration.
 * @return {Function} A function that handles the action.
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
   * @param {Object} stateObj - The entity object for which to retrieve the name.
   * @return {string} The friendly name of the entity without the device name.
   */
  getEntityName(stateObj) {
    if (!isObject(stateObj)) return '';

    const { friendly_name: device_name } = this.getAttributes();
    return stateObj.attributes.friendly_name.replace(device_name + ' ', '');
  }

  /**
   * Find the entity object ending with the specified suffix.
   *
   * @param {string} suffix - The suffix of the entity ID.
   * @return {Object|undefined} The entity object that ends with the specified suffix, or undefined if not found.
   */
  getEntityObject(suffix) {
    return Object.values(this.deviceEntities).find((e) =>
      e.entity_id.endsWith(suffix),
    );
  }

  /**
   * Finds entities in the deviceEntities object that have entity IDs ending with any of the given suffixes.
   *
   * @param {Array<string>} entities_suffixes - An array of suffixes to match against the entity IDs.
   * @return {Object} - An object containing the matching entities, with the entity IDs as keys and the entities as values.
   */
  findEntitiesBySuffix(entities_suffixes) {
    return Object.values(this.deviceEntities)
      .filter((entity) =>
        entities_suffixes.some((suffix) => entity.entity_id.endsWith(suffix)),
      )
      .reduce((acc, entity) => {
        acc[entity.entity_id] = entity;
        return acc;
      }, {});
  }

  /**
   * Manage Entity Card visibility.
   * 
   * @param {string} card - The name of the card to toggle visibility.
   * @return {void} This function does not return a value.
   */
  showCard(card) {
    for (const key in consts.CARD_MAP) {
      if (Object.prototype.hasOwnProperty.call(consts.CARD_MAP, key)) {
        if (key === card) {
          consts.CARD_MAP[key].visibility = !consts.CARD_MAP[key].visibility;
        } else {
          consts.CARD_MAP[key].visibility = false;
        }
      }
    }

    this.requestUpdate();
  }

  /**
   * Retrieves the attributes for the given entity.
   *
   * @param {Object} [entity=this.entity] - The entity to retrieve the attributes from.
   * @return {Object} - An object containing the attributes of the entity.
   */
  getAttributes(entity = this.entity) {
    if (!isObject(entity)) {
      return nothing;
    }

    const entityAttributes = { ...entity.attributes };

    // Выносим некоторые атрибуты на верхний уровень
    return {
      status:
        entityAttributes.status ||
        entityAttributes.state ||
        entity.state ||
        '-',
      state:
        entityAttributes.status ||
        entityAttributes.state ||
        entity.state ||
        '-',
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
  renderButton(action, params = {}) {
    if (!action) {
      return nothing;
    }

    const {asIcon = false, label = false} = params;

    const buttonConfig = {
      [consts.ACTION_MOWING]: {
        icon: 'mdi:play',
        title: localize(`action.${consts.ACTION_MOWING}`),
      },
      [consts.ACTION_EDGECUT]: {
        icon: 'mdi:motion-play',
        title: localize(`action.edgecut`),
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
          @click="${this.handleAction(action, params)}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return !label // [True -> False, False -> True, Undefined -> True]
        ? html`
            <ha-icon-button
              label="${title}"
              @click="${this.handleAction(action, params)}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `
        : html`
            <ha-button
              @click="${this.handleAction(action, params)}"
              title="${title}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${title}
            </ha-button>
          `;
    }
  }

  /**
   * Renders a tip button for a given card.
   * label = 0; // none: 0, left: 1 or right: 2
   *
   * @param {string} card - The card type.
   * @return {TemplateResult|nothing} The rendered tip button or nothing if the card type is not valid.
   */
  renderTipButton(card) {
    if (!Object.hasOwn(consts.CARD_MAP, card)) {
      return nothing;
    }

    const findStateObj = (entities) => {
      const entity = entities
        .map((entity_suffix) => this.getEntityObject(entity_suffix))
        .find((entity) => entity !== undefined);

      if (entity) {
        return {
          title: this.getEntityName(entity),
          stateObj: entity,
          state: entity.entity_id.includes('rssi')
            ? wifiStrenghtToQuality(entity.state)
            : this.hass.formatEntityState(entity),
          icon: entity.attributes.icon || stateIcon(entity),
        };
      }
      return undefined;
    };

    const { entities } = consts.CARD_MAP[card];
    const config = findStateObj(entities);
    if (!isObject(config)) {
      return nothing;
    }

    const labelContent = html`<div .title="${config.title}: ${config.state}">
      ${config.state}
    </div>`;

    return html`
      <div class="tip" @click="${() => this.showCard(card)}">
        ${consts.CARD_MAP[card].labelPosition === 1 ? labelContent : ''}
        <state-badge
          .stateObj=${config.stateObj}
          .title="${config.title}: ${config.state}"
          .overrideIcon=${config.icon}
          .stateColor=${true}
        ></state-badge>
        ${consts.CARD_MAP[card].labelPosition === 2 ? labelContent : ''}
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

    if (this.camera) {
      const camera = this.hass.states[this.config.camera];
      return camera && camera.attributes.entity_picture
        ? html`
            <img
              style="height: ${this.imageSize}px; ${this.imageLeft}"
              class="camera"
              src="${camera.attributes.entity_picture}&v=${Date.now()}"
              @click=${() => this.handleMore(this.config.camera)}
            />
          `
        : nothing;
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
    const { stats = {} } = this.config;

    const statsList = stats[state] || stats.default || [];

    return statsList.map(
      ({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute && !value_template) {
          return nothing;
        }

        try {
          const state = entity_id
            ? this.hass.states[entity_id].state
            : get(this.entity.attributes, attribute);

          const value = html`
            <ha-template
              hass=${this.hass}
              template=${value_template}
              value=${state}
              .variables=${{ value: state }}
            ></ha-template>
          `;

          return html`
            <div
              class="stats-block"
              title="${subtitle}"
              @click="${() => this.handleMore(entity_id)}"
            >
              <span class="stats-value">${value}</span>
              ${unit}
              <div class="stats-subtitle">${subtitle}</div>
            </div>
          `;
        } catch (e) {
          console.warn(e);
          return nothing;
        }
      },
    );
  }

  /**
   * Renders the name of the component.
   *
   * @return {TemplateResult} The HTML template representing the name.
   */
  renderName() {
    if (!this.showName) return nothing;

    const { friendly_name } = this.getAttributes();

    return html`
      <div
        class="landroid-name"
        title="${friendly_name}"
        @click="${() => this.handleMore()}"
      >
        ${friendly_name}
      </div>
    `;
  }

  /**
   * Renders the status of the component.
   *
   * @return {TemplateResult} The rendered status template.
   */
  renderStatus() {
    if (!this.showStatus) return nothing;

    const { state } = this.getAttributes();
    const { state: zone } = this.getAttributes(
      this.getEntityObject(consts.SELECT_CURRENT_ZONE_SUFFIX),
    );
    const { state: party_mode } = this.getAttributes(
      this.getEntityObject(consts.SWITCH_PARTY_SUFFIX),
    );

    let localizedStatus = localize(`status.${state}`) || state;

    // const error = this.getEntityObject(consts.SENSOR_ERROR_SUFFIX);
    // if (isObject(error) && error.attributes.id > 0) {
    //   localizedStatus += `. ${
    //     localize(`error.${error.state}`) || error.state || ''
    //   } (${error.attributes.id})`;
    // }

    switch (state) {
      case consts.STATE_RAINDELAY: {
        const rain_sensor = this.getEntityObject(
          consts.SENSOR_RAINSENSOR_REMAINING_SUFFIX,
        );
        localizedStatus += isObject(rain_sensor)
          ? ` (${this.hass.formatEntityState(rain_sensor) || ''})`
          : '';
        break;
      }

      case consts.STATE_MOWING:
        localizedStatus += ` - ${localize('attr.zone') || ''} ${zone}`;
        break;

      case consts.STATE_DOCKED:
      case consts.STATE_IDLE: {
        if (party_mode === 'on') {
          localizedStatus += ` (${localize('attr.party_mode') || ''})`;
        } else {
          const next_scheduled_start = this.getEntityObject(
            consts.SENSOR_NEXT_SCHEDULED_START_SUFFIX,
          );
          if (
            isObject(next_scheduled_start) &&
            Date.parse(new Date()) < Date.parse(next_scheduled_start.state)
          ) {
            localizedStatus += ` - ${
              localize('attr.next_scheduled_start') || ''
            } ${this.hass.formatEntityState(next_scheduled_start)}`;
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
        @click="${() => this.handleMore()}"
        title="${localizedStatus}"
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
   * Renders the configuration bar if `showConfigBar` is true.
   *
   * @return {TemplateResult} The configuration bar as a lit-html TemplateResult.
   */
  renderConfigBar() {
    if (!this.showConfigBar) return nothing;

    return html`
      <div class="entitiescard">
        <div id="states" class="card-content">
          ${this.renderToggleEntity(
            this.getEntityObject(consts.SWITCH_PARTY_SUFFIX),
          )}
          ${this.renderToggleEntity(
            this.getEntityObject(consts.SWITCH_LOCK_SUFFIX),
          )}
          ${this.renderNumber(
            this.getEntityObject(consts.NUMBER_TIME_EXTENSION_SUFFIX),
          )}
          ${this.renderNumber(
            this.getEntityObject(consts.NUMBER_TORQUE_SUFFIX),
          )}
          ${this.renderNumber(
            this.getEntityObject(consts.SELECT_RAINDELAY_SUFFIX),
          )}
          ${this.renderSelectRow(
            this.getEntityObject(consts.SELECT_CURRENT_ZONE_SUFFIX),
          )}
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
      const entities = this.findEntitiesBySuffix(
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
 * Renders a row for a given entity in the UI.
 *
 * @param {Object} stateObj - The entity object to render.
 * @return {TemplateResult} The rendered row as a TemplateResult.
 */
  renderEntityRow(stateObj) {
    if (!stateObj) return nothing;

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
    if (!stateObj) return nothing;
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
    if (!stateObj) return nothing;
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
    if (!stateObj) return nothing;

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
        <ha-icon-button
          label="${localize('action.config')}"
          @click="${() => (this.showConfigBar = !this.showConfigBar)}"
        >
          <ha-icon icon="mdi:tools"></ha-icon>
        </ha-icon-button>
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
          : ''}
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
          <div class="header">
            <div class="tips">
              ${this.renderTipButton(consts.INFOCARD)}
              ${this.renderTipButton(consts.STATISTICSCARD)}
              ${this.renderTipButton(consts.BATTERYCARD)}
            </div>
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
