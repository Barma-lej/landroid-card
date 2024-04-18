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

  static async getConfigElement() {
    return document.createElement(editorName);
  }

  static getStubConfig(hass, entities) {
    const [landroidEntity] = entities.filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === 'lawn_mower',
    );

    return {
      entity: landroidEntity || '',
      image: 'default',
    };
  }

  get entity() {
    return this.hass.states[this.config.entity];
  }

  get deviceEntities() {
    const deviceId = this.hass.entities[this.config.entity].device_id || false;
    if (deviceId) {
      const entitiesForDevice = Object.values(this.hass.entities)
        .filter((entity) => entity.device_id === deviceId)
        .map((entity) => entity.entity_id);

      // Получиение объекта сущностей из this.hass.states для указанных entity_id
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

  callService(e, service, params = { isRequest: false }) {
    if (!service) return undefined;

    const serviceObject = this.getServiceObject(service);

    if (isObject(serviceObject)) {
      const options = serviceObject.field
        ? { [serviceObject.field]: e.target.value }
        : {};

      this.hass.callService(serviceObject.domain, serviceObject.service, {
        entity_id: [this.config.entity],
        ...options,
      });

      if (params.isRequest) {
        this.requestInProgress = true;
        this.requestUpdate();
      }
    }
  }

  handleAction(action, params = { isRequest: true }) {
    const actions = this.config.actions || {};

    return () => {
      if (!actions[action]) {
        this.callService({}, params.defaultService || action, {
          isRequest: params.isRequest,
        });
        return;
      }

      this.callAction(actions[action]);
    };
  }

  /**
   * Call the action
   * @param {Object} action service, service_data
   */
  callAction(action) {
    const { service, service_data } = action;
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, service_data);
  }

  /**
   * Get friendly name of entity without device name
   * @param {Object} stateObj Entity which name do you need
   * @returns Friendly name of entity without device name
   */
  getEntityName(stateObj) {
    if (!isObject(stateObj)) return '';

    const { friendly_name: device_name } = this.getAttributes();
    return stateObj.attributes.friendly_name.replace(device_name + ' ', '');
  }

  /**
   * Find the device object ending with the suffix
   * @param {string} suffix - Suffix of entity id
   * @returns Object
   */
  getEntityObject(suffix) {
    return Object.values(this.deviceEntities).find((e) =>
      e.entity_id.endsWith(suffix),
    );
  }

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
   * Manage Entity Card visibility
   * @param {string} card Name of card
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
   * Determines the attributes for the entity
   * @param {Object} entity
   * @return {Object}
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
   * Generates the toolbar button tip icon
   * @param {string} action Name of action
   * @param {Object} [params] Optional params
   * @param {string} [params.defaultService] The default service
   * @param {Boolean} [params.asIcon] Render a toolbar button (true) or an icon for tip (false)
   * @param {Boolean} [params.label] Render a toolbar button with a title
   * @param {Boolean} [params.isRequest] Default is true. Requests an update which is processed asynchronously
   * @return {TemplateResult} Icon or Button or Button with title
   *
   */
  renderButton(action, params = { isRequest: true }) {
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
        title: localize(`action.${consts.ACTION_EDGECUT}`),
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

    if (params.asIcon) {
      return html`
        <div
          class="tip"
          title="${title}"
          @click="${this.handleAction(action, {
            isRequest: params.isRequest,
            defaultService: params.defaultService,
          })}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return !params.label // [True -> False, False -> True, Undefined -> True]
        ? html`
            <ha-icon-button
              label="${title}"
              @click="${this.handleAction(action, {
                isRequest: params.isRequest,
                defaultService: params.defaultService,
              })}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `
        : html`
            <ha-button
              @click="${this.handleAction(action, {
                isRequest: params.isRequest,
                defaultService: params.defaultService,
              })}"
              title="${title}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${title}
            </ha-button>
          `;
    }
  }

  /**
   * Generates the toolbar button tip icon
   * label = 0; // none: 0, left: 1 or right: 2
   * @param {string} type Type of button
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
   * Generates the Camera or Image
   * @param {string} state State used as a css class
   * @return {TemplateResult}
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
   * Generates the Stats
   * @param {string} state State used as a css class
   * @return {TemplateResult}
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
        } catch (error) {
          return nothing;
        }
      },
    );
  }

  /**
   * Generates the Name
   * @return {TemplateResult}
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
   * Generate the Status
   * @return {TemplateResult}
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

    const error = this.getEntityObject(consts.SENSOR_ERROR_SUFFIX);
    if (isObject(error) && error.attributes.id > 0) {
      localizedStatus += `. ${
        localize(`error.${error.state}`) || error.state || ''
      } (${error.attributes.id})`;
    }

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
   * Generates Config Bar
   * @return {TemplateResult} Configuration Bar and Card
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
   * Generates Entities Card
   * @param {string} card Type of card
   * @return {TemplateResult} Entities Card
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
    } catch (error) {
      return nothing;
    }
  }

  /**
   * Generates Entity Row for Entities Card
   * @param {Object} stateObj Entity object
   * @return {TemplateResult} Entities Card
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
   * If state of object changed then run service
   * @param {Object} e Target HTMLElement
   * @param {Object} stateObj Entity object
   */
  selectedValueChanged(e, stateObj) {
    if (e.target.value !== stateObj.state) {
      // this.callService(e, stateObj.service);
      this.hass.callService('number', 'set_value', {
        entity_id: stateObj.entity_id,
        value: e.target.value,
      });
    }
  }

  /**
   * Generates Input Number Row (Slider or TextField) for Entities Card
   * @param {Object} stateObj Entity object
   * @return {TemplateResult} Input Number Row
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
   * Generates Select Row for Entities Card
   * @param {Object} stateObj Entity object
   * @return {TemplateResult} Select Row
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
          ${this.renderButton(consts.ACTION_MOWING, { label: true })}
          ${this.renderButton(consts.ACTION_PAUSE)}
        `;

      case consts.STATE_ERROR:
      case consts.STATE_DOCKED:
      case consts.STATE_OFFLINE:
      case consts.STATE_RAINDELAY:
      default: {
        return html`
          ${this.renderButton(consts.ACTION_MOWING)}
          ${this.renderButton(consts.ACTION_EDGECUT)}
          ${state === 'idle' ? this.renderButton(consts.ACTION_DOCK) : ''}
        `;
      }
    }
  }

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
