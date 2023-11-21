import { LitElement, html, nothing } from 'lit';
import { hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
// Cannot upgrade - conflict with vacuum-card https://github.com/Barma-lej/landroid-card/issues/163
import registerTemplates from 'ha-template';
import get from 'lodash.get';
import localize from './localize';
import styles from './styles';
import defaultImage from './landroid.svg';
import { version } from '../package.json';
import './landroid-card-editor';
import helpers from './helpers';
import { defaultConfig, defaultAttributes } from './defaults';
import LandroidCardEditor from './landroid-card-editor';

// Cannot upgrade - conflict with vacuum-card https://github.com/Barma-lej/landroid-card/issues/163
// if (!customElements.get('ha-template')) {
//   import('ha-template').then((registerTemplates) => {
//     registerTemplates();
//   });
// }

const editorName = 'landroid-card-editor';
const DEFAULT_LANG = 'en-GB';
customElements.define(editorName, LandroidCardEditor);

// Cannot upgrade - conflict with vacuum-card https://github.com/Barma-lej/landroid-card/issues/163
registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version} `,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;',
);

// if (!customElements.get('ha-icon-button')) {
//   customElements.define(
//     'ha-icon-button',
//     class extends customElements.get('paper-icon-button') {}
//   );
// }

class LandroidCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      // showConfigPanel: Boolean,
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

  get lang() {
    let langStored;

    try {
      langStored = JSON.parse(localStorage.getItem('selectedLanguage'));
    } catch (e) {
      langStored = localStorage.getItem('selectedLanguage');
    }

    return (langStored || navigator.language.split('-')[0] || DEFAULT_LANG)
      .replace(/['"]+/g, '')
      .replace('_', '-');
  }

  get camera() {
    if (!this.hass) {
      return null;
    }
    return this.hass.states[this.config.camera];
  }

  get image() {
    if (this.config.image === 'default') {
      return defaultImage;
    }

    return this.config.image || defaultImage;
  }

  get imageSize() {
    if (this.config.image_size === undefined) {
      return 4 * 50;
    }

    return this.config.image_size * 50;
  }

  get imageLeft() {
    if (this.config.image_left === undefined) {
      return '';
    }

    return this.config.image_left ? 'float: left;' : '';
  }

  get showAnimation() {
    if (this.config.show_animation === undefined) {
      return true;
    }

    return this.config.show_animation;
  }

  get compactView() {
    if (this.config.compact_view === undefined) {
      return false;
    }

    return this.config.compact_view;
  }

  get showName() {
    if (this.config.show_name === undefined) {
      return false;
    }

    return this.config.show_name;
  }

  get showStatus() {
    if (this.config.show_status === undefined) {
      return true;
    }

    return this.config.show_status;
  }

  get showToolbar() {
    if (this.config.show_toolbar === undefined) {
      return true;
    }

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

    // this.config = config;
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

  handleService(e, service, isRequest = false) {
    let service_origin = service;
    const configServices = [
      'raindelay',
      'timeextension',
      'multizone_distances',
      'multizone_probabilities',
    ];

    if (configServices.includes(service)) {
      service_origin = 'config';
    }

    switch (service) {
      case 'edgecut':
      case 'lock':
      case 'partymode':
      case 'refresh':
      case 'restart':
        this.callService(service_origin, { isRequest });
        break;

      case 'ots':
        this.handleMore();
        break;

      case 'send_raw':
        this.callService(
          service_origin,
          { isRequest },
          { json: e.target.getAttribute('value') },
        );
        break;

      case 'setzone':
        this.callService(
          service_origin,
          { isRequest },
          { zone: e.target.getAttribute('value') },
        );
        break;

      default:
        this.callService(
          service_origin,
          { isRequest },
          { [service]: e.target.getAttribute('value') },
        );
        break;
    }

    // switch (service) {
    //   case 'edgecut':
    //   case 'torque':
    //   case 'setzone': {
    //     // const value = e.target.getAttribute('value');
    //     // const [service] = e.target.getAttribute('value');
    //     this.callService(service, { isRequest: false }, { service });
    //   }
    //   break;

    //   case 'raindelay':
    //   case 'timeextension':
    //   case 'multizone_distances':
    //   case 'multizone_probabilities': {
    //     // const value = e.target.getAttribute('value');
    //     this.callService('config', { isRequest: false }, { [service]: e.target.getAttribute('value') });
    //   }
    //   break;

    //   default:
    //     this.handleMore();
    //     break;
    // }
  }

  handleAction(action, params = { isRequest: true }) {
    const actions = this.config.actions || {};

    return () => {
      if (!actions[action]) {
        this.callService(params.defaultService || action, {
          isRequest: params.isRequest,
        });
        return;
      }

      this.callAction(actions[action]);
    };
  }

  /**
   * Choose between lawn_mower and landroid_cloud domain and call service
   * @param {string} service
   * @param {Object} params
   * @param {Object} options Service options
   */
  callService(service, params = { isRequest: true }, options = {}) {
    if (service === 'more') {
      this.handleMore();
      return;
    }

    let domain = 'lawn_mower';
    const landroidServices = [
      'config',
      'edgecut',
      'lock',
      'ots',
      'partymode',
      'poll',
      'refresh',
      'restart',
      'schedule',
      'send_raw',
      'setzone',
      'torque',
    ];

    if (landroidServices.includes(service)) {
      domain = 'landroid_cloud';
    }

    this.hass.callService(domain, service, {
      entity_id: [this.config.entity],
      ...options,
    });

    // console.log('domain: ' + domain + ', service: ' + service + ', entity: ' + this.config.entity + ', options: ' + options);

    if (params.isRequest) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
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
   * Determines the attributes for the entity
   * @param {Object} entity
   * @return {Object}
   */
  getAttributes(entity = this.entity) {
    if (!helpers.isObject(entity.attributes)) {
      return defaultAttributes;
    }

    const entityAttributes = { ...entity.attributes };

    // Рекурсивно перебираем атрибуты в defaultValues
    function fillDefaults(target, defaults) {
      for (const key in defaults) {
        if (Object.prototype.hasOwnProperty.call(defaults, key)) {
          if (typeof defaults[key] === 'object' && defaults[key] !== null) {
            // Если это объект, рекурсивно заполняем его
            target[key] = fillDefaults(target[key] || {}, defaults[key]);
          } else if (!(key in target)) {
            // Если атрибут отсутствует в target, используем значение из defaults
            target[key] = defaults[key];
          }
        }
      }
      return target;
    }

    // Заполняем значениями по умолчанию
    fillDefaults(entityAttributes, defaultAttributes);

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
      time_extension: entityAttributes.schedule?.time_extension,
      ...entityAttributes,
    };
  }

  /**
   * Format value according to locale
   * @param {string} name Name of Attribute
   * @param {string} valueToFormat Value to formatting
   * @return {FormatedValue}
   */
  formatValue(name, valueToFormat) {
    if (valueToFormat === undefined || valueToFormat === null) {
      return '-';
    }

    let lang = this.lang || DEFAULT_LANG;

    if (!this.cachedLocale) {
      try {
        (1).toLocaleString(lang, {
          style: 'unit',
          unit: 'kilometer',
          unitDisplay: 'short',
        });
        this.cachedLocale = lang;
      } catch (error) {
        this.cachedLocale = DEFAULT_LANG;
      }
    } else {
      lang = this.cachedLocale;
    }

    switch (name) {
      case 'distance': {
        const unitSystem = this.hass.config['unit_system'] || {};
        const length = unitSystem.length || 'km';
        const parsedDistance = parseInt(valueToFormat) || 0;
        const distanceUnit = length === 'km' ? 'kilometer' : 'mile';
        return (
          parsedDistance / (length === 'km' ? 1000 : 1609)
        ).toLocaleString(lang, {
          style: 'unit',
          unit: distanceUnit,
          unitDisplay: 'short',
        });
      }

      case 'temperature': {
        const temperatureHASS =
          this.hass.config['unit_system']?.temperature || '°C';
        const temperatureUnit =
          temperatureHASS === '°C' ? 'celsius' : 'fahrenheit';
        const parsedTemperature = parseFloat(valueToFormat) || 0;
        return parsedTemperature.toLocaleString(lang, {
          style: 'unit',
          unit: temperatureUnit,
        });
      }

      case 'battery_level':
      case 'daily_progress':
      case 'percent':
      case 'rssi':
      case 'time_extension':
      case 'torque': {
        const parsedPercent = parseInt(valueToFormat) || 0;
        return parsedPercent.toLocaleString(lang, {
          style: 'unit',
          unit: 'percent',
        });
      }

      case 'voltage': {
        const parsedVoltage = parseFloat(valueToFormat) || 0;
        return `${parsedVoltage.toLocaleString(lang)} ${localize(
          'units.voltage',
        )}`;
      }

      case 'pitch':
      case 'roll':
      case 'yaw': {
        return valueToFormat.toLocaleString(lang, {
          style: 'unit',
          unit: 'degree',
        });
      }

      case 'total':
      case 'current':
        return valueToFormat.toLocaleString(lang);

      case 'reset_at':
      case 'total_on':
      case 'current_on':
      case 'remaining':
      case 'duration':
      case 'worktime_blades_on':
      case 'worktime_total': {
        const parsedTime = parseInt(valueToFormat) || 0;
        const days = Math.floor(parsedTime / 1440);
        const hours = Math.floor((parsedTime % 1440) / 60);
        const minutes = Math.floor((parsedTime % 1440) % 60);
        return `${
          days
            ? days.toLocaleString(lang, {
                style: 'unit',
                unit: 'day',
              })
            : ''
        } ${
          hours
            ? hours.toLocaleString(lang, {
                style: 'unit',
                unit: 'hour',
              })
            : ''
        } ${
          minutes
            ? minutes.toLocaleString(lang, {
                style: 'unit',
                unit: 'minute',
              })
            : ''
        }`.trim();
      }

      case 'last_update':
      case 'next_scheduled_start':
      case 'reset_time':
      case 'state_updated_at': {
        try {
          return Intl.DateTimeFormat(lang, {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(new Date(valueToFormat));
        } catch (error) {
          console.warn(
            `(valueToFormat - ${valueToFormat}) is not a valid DateTime Format`,
          );
          return '-';
        }
      }

      case 'active':
      case 'auto_upgrade':
      case 'boundary':
      case 'charging':
      case 'locked':
      case 'online':
      case 'party_mode_enabled':
      case 'triggered':
        return valueToFormat
          ? localize('common.true') || 'true'
          : localize('common.false') || 'false';

      case 'delay': {
        const hoursDelay = Math.floor(valueToFormat / 60) || '0';
        const minutesDelay = Math.floor(valueToFormat % 60) || '00';
        return `${hoursDelay}:${minutesDelay}`;
      }

      case 'start':
      case 'end':
      default:
        return valueToFormat.toLocaleString(lang);
    }
  }

  getIcon(entry = '') {
    const attributes = this.getAttributes();
    const wifi_strength =
      attributes.rssi > -101 && attributes.rssi < -49
        ? (attributes.rssi + 100) * 2
        : 0;

    const icons = {
      battery_icon: attributes.battery_icon,
      accessories: 'mdi:toolbox',
      battery: 'mdi:battery',
      cycles: 'mdi:battery-sync',
      blades: 'mdi:fan',
      error: 'mdi:alert-circle',
      firmware: 'mdi:information',
      locked: attributes.locked ? 'mdi:lock' : 'mdi:lock-open',
      mac_address: 'mdi:barcode',
      model: 'mdi:label',
      online: attributes.online ? 'mdi:web' : 'mdi:web-off',
      orientation: 'mdi:rotate-orbit',
      rain_sensor:
        attributes.rain_sensor.delay > 0
          ? 'mdi:weather-pouring'
          : 'mdi:weather-sunny',
      schedule: 'mdi:calendar-clock',
      time_extension: 'mdi:clock-in',
      serial_number: 'mdi:numeric',
      status_info: 'mdi:information',
      time_zone: 'mdi:web-clock',
      zone: `mdi:numeric-${attributes.zone.current + 1}-box-multiple`,
      current: `mdi:numeric-${attributes.zone.current + 1}-box-multiple`,
      next: `mdi:numeric-${attributes.zone.next + 1}-box-multiple`,
      capabilities: 'mdi:format-list-bulleted',
      supported_landroid_features: 'mdi:star-circle-outline',
      daily_progress: 'mdi:progress-helper',
      next_scheduled_start: 'mdi:clock-start',
      party_mode_enabled: attributes.party_mode_enabled
        ? 'mdi:sleep'
        : 'mdi:sleep-off',
      rssi: `mdi:wifi-strength-${
        Math.floor((wifi_strength - 1) / 20) > 0
          ? Math.floor((wifi_strength - 1) / 20)
          : 'outline'
      }`,
      statistics: 'mdi:chart-areaspline',
      torque: 'mdi:car-speed-limiter',
      state_updated_at: 'mdi:update',
      supported_features: 'mdi:format-list-bulleted',
      play: 'mdi:play',
      start_mowing: 'mdi:play',
      stop: 'mdi:stop',
      pause: attributes.state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:pause',
      dock: 'mdi:home-import-outline',
      edgecut:
        attributes.state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:motion-play',
    };

    return entry ? icons[entry] : icons;
  }

  /**
   * Generates the buttons menu
   * @param {string} type (battery, blades)
   * @return {TemplateResult}
   */
  renderListMenu(type) {
    if (!type) {
      return nothing;
    }

    let title = type;
    let value = '';
    let value_right = true;
    let icon = '';
    let selected = '';
    let service = '';
    let attributes = {};

    const attributesEntity = this.getAttributes();

    switch (type) {
      case 'blades': {
        attributes = attributesEntity.blades;
        break;
      }

      case 'delay': {
        service = 'raindelay';
        icon = 'mdi:weather-rainy';
        const { rain_sensor } = attributesEntity;
        value = selected = rain_sensor.delay;
        for (let i = 0; i < 1440; i += 30) {
          attributes[i] = this.formatValue('delay', i);
        }
        break;
      }

      case 'locked': {
        service = 'lock';
        icon = this.getIcon(type);
        const { locked } = attributesEntity;
        selected = locked;
        attributes = {
          locked: {
            0: localize('common.turn_off'),
            1: localize('common.turn_on'),
          },
        };
        break;
      }

      case 'party_mode_enabled': {
        service = 'partymode';
        icon = this.getIcon(type);
        const { party_mode_enabled } = attributesEntity;
        selected = party_mode_enabled;
        attributes = {
          party_mode_enabled: {
            0: localize('common.turn_off'),
            1: localize('common.turn_on'),
          },
        };
        break;
      }

      case 'rssi': {
        const {
          accessories,
          firmware,
          mac_address,
          model,
          online,
          rssi,
          serial_number,
          time_zone,
          capabilities,
          state_updated_at,
        } = attributesEntity;
        value = rssi > -101 && rssi < -49 ? (rssi + 100) * 2 : 0;
        title = type;
        attributes = {
          model,
          serial_number,
          mac_address,
          time_zone,
          online,
          state_updated_at,
          accessories: Array.isArray(accessories)
            ? { ...accessories }
            : accessories,
          firmware,
          capabilities: Array.isArray(capabilities)
            ? { ...capabilities }
            : capabilities,
        };
        break;
      }

      case 'stats': {
        title = 'statistics';
        const { blades, statistics } = attributesEntity;
        attributes = { blades: { ...blades }, statistics: { ...statistics } };
        break;
      }

      case 'torque': {
        service = 'torque';
        icon = 'mdi:car-speed-limiter';
        const { torque } = attributesEntity;
        selected = torque;
        value = torque;
        attributes = { torque: {} };
        for (let i = 50; i >= -50; i -= 5) {
          attributes.torque[i] = this.formatValue('torque', i);
        }
        break;
      }

      case 'zone': {
        service = 'setzone';
        const { zone } = attributesEntity;
        selected = zone.current;
        attributes = { zone: { 0: '1', 1: '2', 2: '3', 3: '4' } };
        break;
      }

      case 'battery':
      default: {
        ({
          battery_level: value,
          battery_icon: icon,
          battery: attributes,
        } = attributesEntity);
        title = 'battery_level';
        value_right = false;
        break;
      }
    }

    return html`
      <div class="tip">
        <ha-button-menu
          @click="${(e) => e.stopPropagation()}"
          title="${localize(`attr.${title}`) || title}"
        >
          <div slot="trigger">
            <span class="icon-title">
              ${!value_right
                ? value
                  ? this.formatValue(title, value)
                  : ''
                : ''}
              <ha-icon icon="${icon ? icon : this.getIcon(title)}"></ha-icon>
              ${value_right
                ? value
                  ? this.formatValue(title, value)
                  : ''
                : ''}
            </span>
          </div>
          ${attributes
            ? this.renderListItem(attributes, { selected, service })
            : ''}
        </ha-button-menu>
      </div>
    `;
  }

  /**
   * Generates the list items
   * @param {Object} attributes Object of attributes
   * @param {string} parent Parent element to naming children items
   * @return {TemplateResult}
   */
  renderListItem(attributes = {}, params = {}) {
    if (!attributes) {
      return nothing;
    }

    const listItems = Object.keys(attributes).map((item, i) => {
      if (helpers.isObject(attributes[item])) {
        return this.renderListItem(attributes[item], {
          parent: item,
          selected: params.selected,
          service: params.service,
        });
      } else {
        return html`
          ${i === 0 && params.parent
            ? html`
                <mwc-list-item
                  class="label"
                  role="checkbox"
                  aria-checked="true"
                >
                  ${localize('attr.' + params.parent)}
                </mwc-list-item>
              `
            : ``}
          <mwc-list-item
            class="${params.parent ? 'second-item' : ''}"
            ?activated=${params.selected == item}
            value="${item}"
            title="${this.formatValue(item, attributes[item])}"
            @click=${params.service
              ? (e) => this.handleService(e, params.service)
              : (e) => e.stopPropagation()}
          >
            ${isNaN(item) ? localize('attr.' + item) + ': ' : ''}
            ${this.formatValue(item, attributes[item])}
          </mwc-list-item>
        `;
      }
    });

    return html`${listItems}`;
  }

  /**
   * Generates the toolbar button tip icon
   * @param {string} action Name of action
   * @param {Object} [arguments] Optional arguments
   * @param {string} [arguments.attr] [=action] Name of attribute to icon render
   * @param {string} [arguments.title] [=action] Title of button
   * @param {string} [arguments.defaultService] [=null] The default service
   * @param {Boolean} [arguments.isIcon] [=false] Render a toolbar button (true) or an icon for tip (false)
   * @param {Boolean} [arguments.isTitle] [=false] Render a toolbar button with a title
   * @param {Boolean} [arguments.isRequest] [=true] Requests an update which is processed asynchronously
   * @return {TemplateResult} Icon or Button or Button with title
   */
  renderButton(
    action,
    {
      attr = action,
      title = action,
      defaultService = null,
      isIcon = false,
      isTitle = false,
      isRequest = true,
    } = {},
  ) {
    const icon = this.getIcon(attr);
    // !!arguments.isRequest [True -> True, False -> False, Undefined -> False]

    if (isIcon) {
      return html`
        <div
          class="tip"
          title="${localize('action.' + action)}"
          @click="${this.handleAction(action, {
            isRequest: isRequest,
            defaultService: defaultService,
          })}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return !isTitle // [True -> False, False -> True, Undefined -> True]
        ? html`
            <ha-icon-button
              label="${localize('action.' + action)}"
              @click="${this.handleAction(action, {
                isRequest: isRequest,
                defaultService: defaultService,
              })}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `
        : html`
            <ha-button
              @click="${this.handleAction(action, {
                isRequest: isRequest,
                defaultService: defaultService,
              })}"
              title="${localize('action.' + title)}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${localize('action.' + title)}
            </ha-button>
          `;
    }
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
      },
    );
  }

  /**
   * Generates the Name
   * @return {TemplateResult}
   */
  renderName() {
    const { friendly_name } = this.getAttributes();

    if (!this.showName) {
      return nothing;
    }

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
    if (!this.showStatus) {
      return nothing;
    }

    const { state } = this.getAttributes();
    let localizedStatus = localize(`status.${state}`) || state;

    switch (state) {
      case 'rain_delay':
        {
          const { rain_sensor } = this.getAttributes();
          localizedStatus += ` (${
            this.formatValue('remaining', rain_sensor['remaining']) || ''
          })`;
        }
        break;

      case 'mowing':
        {
          const { zone } = this.getAttributes();
          localizedStatus += ` - ${localize('attr.zone') || ''} ${
            zone['current'] + 1
          }`;
        }
        break;

      case 'error':
        {
          const { error } = this.getAttributes();
          if (error['id'] > 0) {
            localizedStatus += ` ${error['id']}: ${
              localize('error.' + error['description']) ||
              error['description'] ||
              ''
            }`;
          }
        }
        break;

      case 'docked':
      case 'idle':
        {
          const { next_scheduled_start } = this.getAttributes();
          const now = Date.parse(new Date());
          if (next_scheduled_start) {
            // Issue https://github.com/Barma-lej/landroid-card/issues/150
            if (now < Date.parse(next_scheduled_start)) {
              localizedStatus += ` - ${
                localize('attr.next_scheduled_start') || ''
              } ${
                this.formatValue(
                  'next_scheduled_start',
                  next_scheduled_start,
                ) || ''
              }`;
            }
          }
        }
        break;

      default:
        break;
    }

    return html`
      <div
        class="status"
        @click="${() => this.handleMore()}"
        title="${localizedStatus}"
      >
        <span class="status-text"> ${localizedStatus} </span>
        <mwc-circular-progress
          .indeterminate=${this.requestInProgress}
          density="-5"
        ></mwc-circular-progress>
      </div>
    `;
  }

  /**
   * Generates Config Bar
   * @return {TemplateResult} Configuration Bar and Card
   */
  renderConfigbar() {
    if (!this.showConfigBar) {
      return nothing;
    }
    // console.log(
    //   'renderConfigbar - ' + this.getAttributes().friendly_name
    // );

    return html`
      <div class="configbar">
        ${this.renderListMenu('zone')} ${this.renderListMenu('delay')}
        ${this.renderListMenu('torque')} ${this.renderListMenu('locked')}
        <!-- ${this.renderButton('lock', {
          attr: 'locked',
          isIcon: true,
          isRequest: false,
        })} -->
      </div>
      <div class="configcard">
        <div id="states" class="card-content">
          ${this.renderInputNumber('torque', { min: -50, max: 50 })}
          ${this.renderInputNumber('time_extension', {
            service: 'timeextension',
            min: -100,
          })}
        </div>
      </div>
    `;
  }

  /**
   * Generates a row with slider
   * @param {string} mode Name of attribute, can be used as name of service if argument `service` is undefined
   * @param {Object} arguments Optional arguments
   * @param {String} [arguments.service=mode] [=mode] Name of service (optional)
   * @param {Number} [arguments.min=0] [=0] Minimal value of slider (optional)
   * @param {number} [arguments.max = 100] [=100] Maximal value of slider (optional)
   * @param {number} [arguments.step = 1] [=1] Step value of slider (optional)
   * @return {TemplateResult} A row with icon, name and state of attribute and a slider to change value of attribute
   */
  renderInputNumber(
    mode,
    { service = mode, min = 0, max = 100, step = 1 } = {},
  ) {
    if (!mode) {
      return nothing;
    }

    const icon = this.getIcon(mode);
    const value = this.getAttributes()[mode];
    const state = this.formatValue(mode, value);
    const title = localize('attr.' + mode);

    return html`
      <div class="row">
        <div class="icon-badge">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="info text-content" title="${title}">${title}</div>
        <div class="flex">
          <ha-slider
            class="slider"
            .hass="${this.hass}"
            value="${value}"
            min="${min}"
            max="${max}"
            step="${step}"
            pin
            @change="${(e) => this.handleService(e, service)}"
          ></ha-slider>
          <div class="state">${state}</div>
        </div>
      </div>
    `;
  }

  renderToolbar(state) {
    if (!this.showToolbar) {
      return nothing;
    }

    const { daily_progress } = this.getAttributes();
    let bar;
    switch (state) {
      case 'initializing':
      case 'mowing':
      case 'starting':
      case 'zoning':
        bar = html`
          ${this.renderButton('pause', { isTitle: true })}
          ${this.renderButton('dock', { isTitle: true })}
        `;
        break;

      case 'edgecut':
        bar = html`
          ${this.renderButton('pause', { attr: 'edgecut', isTitle: true })}
          ${this.renderButton('dock', { isTitle: true })}
        `;
        break;

      case 'paused':
        bar = html`
          ${this.renderButton('resume', {
            attr: 'start_mowing',
            defaultService: 'start_mowing',
            isTitle: true,
          })}
          ${this.renderButton('edgecut', { isTitle: true })}
          ${this.renderButton('dock', { isTitle: true })}
        `;
        break;

      case 'returning':
        bar = html`
          ${this.renderButton('resume', {
            attr: 'start_mowing',
            defaultService: 'start_mowing',
            isTitle: true,
          })}
          ${this.renderButton('pause')}
        `;
        break;

      case 'docked':
      case 'idle':
      case 'rain_delay':
      default: {
        const { shortcuts = [] } = this.config;

        const buttons = shortcuts.map(
          ({ name, service, icon, service_data }) => {
            const execute = () => {
              this.callAction({ service, service_data });
            };
            return html`
              <ha-icon-button label="${name}" @click="${execute}">
                <ha-icon icon="${icon}"></ha-icon>
              </ha-icon-button>
            `;
          },
        );

        bar = html`
          ${this.renderButton('start_mowing')} ${this.renderButton('edgecut')}
          ${state === 'idle' ? this.renderButton('dock') : ''}
          <div class="fill-gap"></div>
          ${buttons}
        `;
      }
    }
    return html`
      <div class="toolbar">
        ${bar}
        <ha-icon-button
          label="${localize('action.config')}"
          @click="${() => (this.showConfigBar = !this.showConfigBar)}"
        >
          <ha-icon icon="mdi:tools"></ha-icon>
        </ha-icon-button>

        <paper-progress
          id="landroidProgress"
          title="${localize('attr.daily_progress')}: ${this.formatValue(
            'daily_progress',
            daily_progress,
          )}"
          aria-hidden="true"
          role="progressbar"
          value="${daily_progress}"
          aria-valuenow="${daily_progress}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-disabled="false"
          style="touch-action: auto;"
        ></paper-progress>
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
              ${this.renderListMenu('rssi')}
              ${this.renderListMenu('party_mode_enabled')}
              ${this.renderListMenu('stats')} ${this.renderListMenu('battery')}
            </div>
            <!-- <ha-icon-button
              class="more-info"
              icon="hass:dots-vertical"
              more-info="true"
              @click="${() => this.handleMore()}">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button> -->
          </div>

          <!-- <div class="metadata"> -->
          ${this.renderCameraOrImage(state)}
          <!-- </div> -->
          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          <div class="stats">${this.renderStats(state)}</div>
          ${this.renderToolbar(state)}
        </div>
        ${this.renderConfigbar(state)}
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
