import { LitElement, html, nothing } from 'lit';
import { hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
import registerTemplates from 'ha-template';
import get from 'lodash.get';
import localize from './localize';
import styles from './styles';
import defaultImage from './landroid.svg';
import { version } from '../package.json';
import './landroid-card-editor';
import defaultConfig from './defaults';
import LandroidCardEditor from './landroid-card-editor';

const editorName = 'landroid-card-editor';
customElements.define(editorName, LandroidCardEditor);

registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version} `,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;'
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
      (eid) => eid.substr(0, eid.indexOf('.')) === 'vacuum'
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
    try {
      return JSON.parse(localStorage.getItem('selectedLanguage'));
    } catch (e) {
      return localStorage.getItem('selectedLanguage') || 'en';
    }
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
      return true;
    }

    return this.config.show_name;
  }

  get showStatus() {
    if (this.config.show_status === undefined) {
      return true;
    }

    return this.config.show_status;
  }

  get showConfigbar() {
    if (this.config.show_configbar === undefined) {
      return true;
    }

    return this.config.show_configbar;
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
        (this.config.camera_refresh || 5) * 1000
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
      {
        entityId,
      },
      {
        bubbles: false,
        composed: true,
      }
    );
  }

  handleZone(e) {
    const zone = e.target.getAttribute('value');
    this.callService('setzone', { isRequest: false }, { zone });
    // const fan_speed = e.target.getAttribute('value');
    // this.callService('set_fan_speed', { isRequest: false }, { fan_speed });
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
   * Choose between vacuum and landroid_cloud domain and call service
   * @param {string} service
   * @param {Object} params
   * @param {Object} options Service options
   */
  callService(service, params = { isRequest: true }, options = {}) {
    if (service === 'more') {
      this.handleMore();
      return;
    }

    let domain = 'vacuum';
    const ladroidServices = [
      'config',
      'edgecut',
      'lock',
      'ots',
      'partymode',
      'poll',
      'restart',
      'setzone',
      'schedule',
    ];

    if (ladroidServices.includes(service)) {
      domain = 'landroid_cloud';
    }
    // console.log(this.config.device_id, this.config.device, this.hass.states );
    // console.log(domain, service, { entity_id: this.config.entity, ...options});

    this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...options,
    });

    // this.hass.callService(domain, service, { device_id: this.config.device_id, ...options, });
    // this.hass.callService('landroid_cloud', 'setzone', { device_id: 'b2433e6a3cf7900f69e6978e42cd0749', zone: 1, });
    // this.hass.callService('landroid_cloud', 'setzone', { entity_id: 'vacuum.mower', zone: 1, });
    // this.hass.callService('landroid_cloud', 'config', { entity_id: 'vacuum.mower', raindelay: 90, });
    // this.hass.callService('landroid_cloud', 'config', { device_id: 'b2433e6a3cf7900f69e6978e42cd0749', entity_id: 'vacuum.mower', raindelay: 90, });
    // this.hass.callService('vacuum', 'set_fan_speed', { entity_id: 'vacuum.robi', fan_speed: 'Silent', });

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
   * @return {AttributesObject}
   */
  getAttributes(entity) {
    const {
      status,
      state,
      // fan_speed,
      // fan_speed_list,

      battery_level,
      battery_icon,
      accessories,
      battery,
      blades,
      error,
      firmware,
      locked,
      mac_address,
      model,
      online,
      orientation,
      rain_sensor,
      schedule,
      serial_number,
      status_info,
      time_zone,
      zone,
      capabilities,
      mqtt_connected,
      supported_landroid_features,
      party_mode_enabled,
      rssi,
      statistics,
      torque,
      state_updated_at,
      device_class,
      friendly_name,
      supported_features,

      // IF Landroid Cloud <= 2.0.3
      battery_voltage,
      battery_temperature,
      total_charge_cycles,
      current_charge_cycles,
      total_blade_time,
      current_blade_time,
      blade_time_reset,
      error_id,
      firmware_version,
      mac,
      pitch,
      roll,
      yaw,
      rain_delay,
      rain_sensor_triggered,
      rain_delay_remaining,
      serial,
      mowing_zone,
      zone_probability,
      work_time,
      distance,
      last_update,
      // ENDIF Landroid Cloud <= 2.0.3
    } = entity.attributes;

    return {
      status: status || state || entity.state,
      // fan_speed,
      // fan_speed_list,

      battery_level,
      battery_icon,
      accessories: accessories || '-',
      battery: battery || {
        cycles: {
          total: total_charge_cycles,
          current: current_charge_cycles,
          reset_at: '-',
          reset_time: '-',
        },
        temperature: battery_temperature,
        voltage: battery_voltage,
        percent: battery_level,
        charging: '-',
      },
      blades: blades || {
        total_on: total_blade_time,
        current_on: current_blade_time,
        reset_at: total_blade_time - current_blade_time,
        reset_time: blade_time_reset,
      },
      error: this.isObject(error)
        ? error
        : { id: error_id, description: error },
      firmware: firmware || { auto_upgrade: '-', version: firmware_version },
      locked,
      mac_address: mac_address || mac,
      model: model || '',
      online,
      orientation: orientation || { pitch: pitch, roll: roll, yaw: yaw },
      rain_sensor: rain_sensor || {
        delay: rain_delay,
        triggered: rain_sensor_triggered,
        remaining: rain_delay_remaining,
      },
      schedule,
      serial_number: serial_number || serial,
      status_info: status_info || {
        id: '-',
        description: status || state || entity.stat,
      },
      time_zone: time_zone || '-',
      zone: model
        ? zone
        : {
            current: '-',
            index: mowing_zone,
            indicies: zone_probability,
            starting_point: zone,
          },
      capabilities: capabilities || '',
      mqtt_connected: mqtt_connected || '',
      supported_landroid_features: supported_landroid_features || '',
      party_mode_enabled,
      rssi,
      statistics: statistics || {
        worktime_blades_on: work_time,
        distance: distance,
        worktime_total: '-',
      },
      torque: torque || '',
      state_updated_at: state_updated_at || last_update,
      device_class,
      friendly_name,
      supported_features,
    };
  }

  /**
   * Format value according to locale
   * @param {string} name Name of Attribute
   * @param {string} valueToFormat Value to formating
   * @return {FormatedValue}
   */
  formatValue(name, valueToFormat) {
    if (valueToFormat === undefined || valueToFormat === null) {
      return '-';
    }

    const lang = this.lang || 'en';

    switch (name) {
      case 'distance': {
        const { length } = this.hass.config['unit_system'] || 'km';
        return length === 'km'
          ? (valueToFormat / 1000).toLocaleString(lang, {
              style: 'unit',
              unit: 'kilometer',
              unitDisplay: 'short',
            })
          : (valueToFormat / 1609).toLocaleString(lang, {
              style: 'unit',
              unit: 'mile',
              unitDisplay: 'short',
            });
      }

      case 'temperature': {
        const { temperature } = this.hass.config['unit_system'] || '°C';
        return temperature === '°C'
          ? valueToFormat.toLocaleString(lang, {
              style: 'unit',
              unit: 'celsius',
            })
          : valueToFormat.toLocaleString(lang, {
              style: 'unit',
              unit: 'fahrenheit',
            });
      }

      case 'battery_level':
      case 'percent':
      case 'rssi':
      case 'torque':
        return valueToFormat.toLocaleString(lang, {
          style: 'unit',
          unit: 'percent',
        });

      case 'voltage':
        return `${valueToFormat} ${localize('units.voltage')}`;
      // valueToFormat.toLocaleString(lang, { style: "unit", unit: "volt" });

      case 'pitch':
      case 'roll':
      case 'yaw':
        return valueToFormat.toLocaleString(lang, {
          style: 'unit',
          unit: 'degree',
        });

      case 'total':
      case 'current':
        return valueToFormat.toLocaleString(lang);

      case 'reset_at':
      case 'total_on':
      case 'current_on':
      case 'delay':
      case 'remaining':
      case 'time_extension':
      case 'duration':
      case 'worktime_blades_on':
      case 'worktime_total': {
        return isNaN(Math.floor(valueToFormat / 1440))
          ? ''
          : `${Math.floor(valueToFormat / 1440).toLocaleString(lang, {
              style: 'unit',
              unit: 'day',
            })}
              ${Math.floor((valueToFormat % 1440) / 60).toLocaleString(lang, {
                style: 'unit',
                unit: 'hour',
              })}
              ${Math.floor((valueToFormat % 1440) % 60).toLocaleString(lang, {
                style: 'unit',
                unit: 'minute',
              })}`;
      }

      case 'last_update':
      case 'reset_time':
      case 'state_updated_at': {
        try {
          return Intl.DateTimeFormat(lang, {
            dateStyle: 'full',
            timeStyle: 'short',
          }).format(new Date(valueToFormat));
        } catch (error) {
          console.warn(
            `(valueToFormat - ${valueToFormat}) is not valid DateTime Format`
          );
          return '-';
        }
      }

      case 'active':
      case 'auto_upgrade':
      case 'boundary':
      case 'charging':
      case 'locked':
      case 'mqtt_connected':
      case 'online':
      case 'party_mode_enabled':
      case 'triggered':
        return valueToFormat
          ? localize('common.true') || 'true'
          : localize('common.false') || 'false';

      case 'start':
      case 'end':
      default:
        return valueToFormat.toLocaleString(lang);
    }
  }

  getIcon(entry = '') {
    const {
      battery_icon: battery_icon_attr,
      locked: locked_attr,
      online: online_attr,
      party_mode_enabled: party_mode_enabled_attr,
      rain_sensor: rain_sensor_attr,
      mqtt_connected: mqtt_connected_attr,
      rssi: rssi_attr,
      zone: zone_attr,
    } = this.getAttributes(this.entity);

    const wifi_strength =
      rssi_attr > -101 && rssi_attr < -49 ? (rssi_attr + 100) * 2 : 0;
    const { state } = this.entity;

    if (entry) {
      const icons = {
        battery_icon: battery_icon_attr,
        accessories: 'mdi:toolbox',
        battery: 'mdi:battery',
        cycles: 'mdi:battery-sync',
        blades: 'mdi:fan',
        error: 'mdi:alert-circle',
        firmware: 'mdi:information',
        locked: locked_attr ? 'mdi:lock' : 'mdi:lock-open',
        mac_address: 'mdi:barcode',
        model: 'mdi:label',
        online: online_attr ? 'mdi:web' : 'mdi:web-off',
        orientation: 'mdi:rotate-orbit',
        rain_sensor:
          rain_sensor_attr['delay'] > 0
            ? 'mdi:weather-pouring'
            : 'mdi:weather-sunny',
        schedule: 'mdi:calendar-clock',
        serial_number: 'mdi:numeric',
        status_info: 'mdi:information',
        time_zone: 'mdi:web-clock',
        // zone: 'mdi:numeric-3-box-multiple',
        zone: 'mdi:numeric-' + (zone_attr['current'] + 1) + '-box-multiple',
        current: 'mdi:numeric-' + (zone_attr['current'] + 1) + '-box-multiple',
        next: 'mdi:numeric-' + (zone_attr['next'] + 1) + '-box-multiple',
        // zone: 'mdi:checkbox-multiple-blank',
        capabilities: 'mdi:format-list-bulleted',
        mqtt_connected: mqtt_connected_attr ? 'mdi:network' : 'mdi:network-off',
        supported_landroid_features: 'mdi:star-circle-outline',
        party_mode_enabled: party_mode_enabled_attr
          ? 'mdi:sleep'
          : 'mdi:sleep-off',
        rssi: `mdi:wifi-strength-${
          Math.floor((wifi_strength - 1) / 20) > 0
            ? Math.floor((wifi_strength - 1) / 20)
            : 'outline'
        }`,
        statistics: 'mdi:chart-areaspline',
        torque: 'mdi:plus-minus-box',
        state_updated_at: 'mdi:update',
        supported_features: 'mdi:format-list-bulleted',

        play: 'mdi:play',
        start: 'mdi:play',
        stop: 'mdi:stop',
        pause: state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:pause',
        return_to_base: 'mdi:home-import-outline',
        edgecut: state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:motion-play',
      };

      return icons[entry];
    } else {
      const battery_icon = battery_icon_attr,
        accessories = 'mdi:toolbox',
        battery = 'mdi:battery',
        cycles = 'mdi:battery-sync',
        blades = 'mdi:fan',
        error = 'mdi:alert-circle',
        firmware = 'mdi:information',
        locked = locked_attr ? 'mdi:lock' : 'mdi:lock-open',
        mac_address = 'mdi:barcode',
        model = 'mdi:label',
        online = online_attr ? 'mdi:web' : 'mdi:web-off',
        orientation = 'mdi:rotate-orbit',
        rain_sensor =
          rain_sensor_attr['delay'] > 0
            ? 'mdi:weather-pouring'
            : 'mdi:weather-sunny',
        schedule = 'mdi:calendar-clock',
        serial_number = 'mdi:numeric',
        status_info = 'mdi:information',
        time_zone = 'mdi:web-clock',
        zone = 'mdi:numeric-' + (zone_attr['current'] + 1) + '-box-multiple',
        current = 'mdi:numeric-' + (zone_attr['current'] + 1) + '-box-multiple',
        next = 'mdi:numeric-' + (zone_attr['next'] + 1) + '-box-multiple',
        capabilities = 'mdi:format-list-bulleted',
        mqtt_connected = mqtt_connected_attr
          ? 'mdi:network'
          : 'mdi:network-off',
        supported_landroid_features = 'mdi:star-circle-outline',
        party_mode_enabled = party_mode_enabled_attr
          ? 'mdi:sleep'
          : 'mdi:sleep-off',
        rssi = `mdi:wifi-strength-${
          Math.floor((wifi_strength - 1) / 20) > 0
            ? Math.floor((wifi_strength - 1) / 20)
            : 'outline'
        }`,
        statistics = 'mdi:chart-areaspline',
        torque = 'mdi:plus-minus-box',
        state_updated_at = 'mdi:update',
        supported_features = 'mdi:format-list-bulleted',
        play = 'mdi:play',
        start = 'mdi:play',
        stop = 'mdi:stop',
        pause = state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:pause',
        return_to_base = 'mdi:home-import-outline',
        edgecut = state === 'edgecut' ? 'mdi:motion-pause' : 'mdi:motion-play';
      return {
        battery_icon,
        accessories,
        battery,
        cycles,
        blades,
        error,
        firmware,
        locked,
        mac_address,
        model,
        online,
        orientation,
        rain_sensor,
        schedule,
        serial_number,
        status_info,
        time_zone,
        zone,
        current,
        next,
        capabilities,
        mqtt_connected,
        supported_landroid_features,
        party_mode_enabled,
        rssi,
        statistics,
        torque,
        state_updated_at,
        supported_features,

        play,
        start,
        pause,
        stop,
        return_to_base,
        edgecut,
      };
    }
  }

  /**
   * Checking whether an object
   * @param {Object} Value to check
   * @return {Boolean}
   */
  isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
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

    var title = type,
      value = '',
      value_right = true,
      icon = '',
      selected = '',
      action = '',
      attributes = {};

    switch (type) {
      case 'blades':
        {
          const { blades } = this.getAttributes(this.entity);
          attributes = blades;
        }
        break;

      case 'rssi':
        {
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
          } = this.getAttributes(this.entity);
          value = rssi > -101 && rssi < -49 ? (rssi + 100) * 2 : 0;
          title = type;
          attributes = {
            model,
            serial_number,
            mac_address,
            state_updated_at,
            time_zone,
            firmware: firmware,
            online,
            accessories: accessories,
            capabilities: capabilities,
          };
          // attributes.accessories = statistics;
          // attributes.blades = blades;
        }
        break;

      case 'stats':
        {
          const { blades, statistics } = this.getAttributes(this.entity);
          title = 'statistics';
          attributes = { blades: {}, statistics: {} };
          attributes.statistics = statistics;
          attributes.blades = blades;
        }
        break;

      case 'zone':
        {
          const { zone } = this.getAttributes(this.entity);
          selected = zone['current'];
          attributes = { zone: { 0: '1', 1: '2', 2: '3', 3: '4' } };
          action = 'setzone';
        }
        break;

      case 'battery':
      default:
        {
          ({
            battery_level: value,
            battery_icon: icon,
            battery: attributes,
          } = this.getAttributes(this.entity));
          title = 'battery_level';
          value_right = false;
        }
        break;
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
            ? this.renderListItem(attributes, { selected, action })
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

    return html`
      ${Object.keys(attributes).map((item, index) =>
        this.isObject(attributes[item])
          ? this.renderListItem(attributes[item], {
              parent: item,
              selected: params.selected,
              action: params.action,
            })
          : // : parent
            //     ? html`
            //         <mwc-list-item value="${item}">
            //             ${parent ? localize('attr.' + parent) + ' - ' + localize('attr.' + item) + ': ': ''}
            //             ${this.formatValue(item, attributes[item])}
            //         </mwc-list-item>
            //       `
            html`
              <mwc-list-item
                ?activated=${params.selected === index}
                value="${item}"
                @click=${params.action ? (e) => this.handleZone(e) : ''}
              >
                ${params.parent
                  ? localize('attr.' + params.parent) + ' - '
                  : ''}
                ${localize('attr.' + item)
                  ? localize('attr.' + item) + ': '
                  : ''}
                ${this.formatValue(item, attributes[item])}
              </mwc-list-item>
            `
      )}
    `;
    // @click=${params.action?(e) => this.handleZone(e):''}
  }

  /**
   * Generates the toolbar button tip icon
   * @param {string} action Name of action
   * @param {Object} params Additional parameters
   * @param {string} params.attr Name of attribute to icon render
   * @param {string} params.title Title of button
   * @param {Boolean} params.isIcon Render a toolbar button (true) or an icon for tip (false)
   * @param {Boolean} params.isTitle Render a toolbar button with a title
   * @param {string} params.defaultService The default service
   * @param {Boolean} params.isRequest [=true] Requests an update which is processed asynchronously
   * @return {TemplateResult} Icon or Button or Button with title
   */
  renderButton(action, params = {}) {
    const icon = this.getIcon(params.attr || action);
    const isRequest = params.isRequest !== undefined ? params.isRequest : true;

    if (params.isIcon) {
      return html`
        <div
          class="tip"
          title="${localize('action.' + action)}"
          @click="${this.handleAction(params.defaultService || action, {
            isRequest: isRequest,
          })}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    } else {
      return !params.isTitle
        ? html`
            <ha-icon-button
              label="${localize('action.' + action)}"
              @click="${this.handleAction(params.defaultService || action, {
                isRequest: isRequest,
              })}"
            >
              <ha-icon icon="${icon}"></ha-icon>
            </ha-icon-button>
          `
        : html`
            <ha-button
              @click="${this.handleAction(action)}"
              title="${localize('action.' + (params.title || action))}"
            >
              <ha-icon icon="${icon}"></ha-icon>
              ${localize('action.' + (params.title || action))}
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
            variables=${{ value: state }}
          ></ha-template>
        `;

        return html`
          <div class="stats-block" @click="${() => this.handleMore(entity_id)}">
            <span class="stats-value">${value}</span>
            ${unit}
            <div class="stats-subtitle">${subtitle}</div>
          </div>
        `;
      }
    );
  }

  /**
   * Generates the Name
   * @return {TemplateResult}
   */
  renderName() {
    const { friendly_name } = this.getAttributes(this.entity);

    if (!this.showName) {
      return nothing;
    }

    /**
     * Generates the Status
     * @return {TemplateResult}
     */
    return html`
      <div class="landroid-name" @click="${() => this.handleMore()}">
        ${friendly_name}
      </div>
    `;
  }

  /**
   * Generates the Status
   * @return {TemplateResult}
   */
  renderStatus() {
    if (!this.showStatus) {
      return nothing;
    }

    const { status } = this.getAttributes(this.entity);
    let localizedStatus = localize(`status.${status}`) || status;

    switch (status) {
      case 'rain_delay':
        {
          const { rain_sensor } = this.getAttributes(this.entity);
          localizedStatus += ` (${rain_sensor['remaining']} ${
            localize('units.min') || ''
          })`;
        }
        break;

      case 'mowing':
        {
          const { zone } = this.getAttributes(this.entity);
          localizedStatus += ` - ${localize('attr.zone') || ''}
            ${zone['current'] + 1}`;
        }
        break;

      case 'error':
        {
          const { error } = this.getAttributes(this.entity);
          if (error['id'] > 0) {
            localizedStatus += ` ${error['id']}: 
            ${
              localize('error.' + error['description']) ||
              error['description'] ||
              ''
            }`;
          }
        }
        break;

      default:
        break;
    }

    return html`
      <div class="status" @click="${() => this.handleMore()}">
        <span class="status-text" alt=${localizedStatus}>
          ${localizedStatus}
        </span>
        <mwc-circular-progress
          .indeterminate=${this.requestInProgress}
          density="-5"
        ></mwc-circular-progress>
      </div>
    `;
  }

  renderConfigbar() {
    if (!this.showConfigbar) {
      return nothing;
    }

    return html`
      <div class="configbar">
        ${this.renderListMenu('zone')}
        ${this.renderButton('partymode', {
          attr: 'party_mode_enabled',
          isIcon: true,
          isRequest: false,
        })}
        ${this.renderButton('lock', {
          attr: 'locked',
          isIcon: true,
          isRequest: false,
        })}
        <!-- ${this.renderListMenu('zone')} -->
        <!-- <ha-slider max="50" value="10" step="5"></ha-slider> -->
      </div>
    `;
  }

  renderToolbar(state) {
    if (!this.showToolbar) {
      return nothing;
    }

    switch (state) {
      case 'initializing':
      case 'mowing':
      case 'starting':
      case 'zoning': {
        return html`
          <div class="toolbar">
            ${this.renderButton('pause', { isTitle: true })}
            ${this.renderButton('return_to_base', { isTitle: true })}
          </div>
        `;
      }

      case 'edgecut': {
        return html`
          <div class="toolbar">
            ${this.renderButton('pause', { attr: 'edgecut', isTitle: true })}
            ${this.renderButton('return_to_base', { isTitle: true })}
          </div>
        `;
      }

      case 'paused': {
        return html`
          <div class="toolbar">
            <ha-button
              @click="${this.handleAction('resume', {
                defaultService: 'start',
              })}"
              title="${localize('action.resume')}"
            >
              <ha-icon icon="mdi:play"></ha-icon>
              ${localize('action.continue')}
            </ha-button>
            ${this.renderButton('edgecut', { isTitle: true })}
            ${this.renderButton('return_to_base', { isTitle: true })}
          </div>
        `;
      }

      case 'returning': {
        return html`
          <div class="toolbar">
            <ha-button
              @click="${this.handleAction('resume', {
                defaultService: 'start',
              })}"
              title="${localize('action.resume')}"
            >
              <ha-icon icon="mdi:play"></ha-icon>
              ${localize('action.continue')}
            </ha-button>
            ${this.renderButton('pause', 'pause', false)}
          </div>
        `;
      }

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
          }
        );

        const dockButton = html`${this.renderButton('return_to_base')}`;

        return html`
          <div class="toolbar">
            ${this.renderButton('start')} ${this.renderButton('edgecut')}
            ${state === 'idle' ? dockButton : ''}
            <div class="fill-gap"></div>
            ${buttons}
          </div>
        `;
      }
    }
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

    const { state } = this.entity;

    return html`
      <ha-card>
        <div class="preview">
          <div class="header">
            <div class="tips">
              ${this.renderListMenu('rssi')} ${this.renderListMenu('stats')}
              <!-- ${this.renderListMenu('blades')} -->
              ${this.renderListMenu('battery')}
            </div>
            <!-- <ha-icon-button
              class="more-info"
              icon="hass:dots-vertical"
              more-info="true"
              @click="${() => this.handleMore()}">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button> -->
          </div>

          ${this.renderCameraOrImage(state)}

          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          <div class="stats">${this.renderStats(state)}</div>
        </div>

        ${this.renderConfigbar(state)} ${this.renderToolbar(state)}
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
