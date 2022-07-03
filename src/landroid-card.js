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
  'color: white; background: blue; font-weight: 700;',
  'color: orange; background: white; font-weight: 700;'
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

  get map() {
    if (!this.hass) {
      return null;
    }
    return this.hass.states[this.config.map];
  }

  get image() {
    if (this.config.image === 'default') {
      return defaultImage;
    }

    return this.config.image || defaultImage;
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

  get showToolbar() {
    if (this.config.show_toolbar === undefined) {
      return true;
    }

    return this.config.show_toolbar;
  }

  get compactView() {
    if (this.config.compact_view === undefined) {
      return false;
    }

    return this.config.compact_view;
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
    if (!this.compactView && this.map) {
      this.requestUpdate();
      this.thumbUpdater = setInterval(
        () => this.requestUpdate(),
        (this.config.map_refresh || 5) * 1000
      );
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map) {
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

  handleSpeed(e) {
    const fan_speed = e.target.getAttribute('value');
    this.callService('set_fan_speed', { isRequest: false }, { fan_speed });
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

  callService(service, params = { isRequest: true }, options = {}) {
    let domain = 'vacuum';
    const ladroidServices = [
      'poll',
      'config',
      'partymode',
      'setzone',
      'lock',
      'restart',
      'edgecut',
      'ots',
      'schedule',
    ];

    if (ladroidServices.includes(service)) {
      domain = 'landroid_cloud';
    }

    this.hass.callService(domain, service, {
      entity_id: this.config.entity,
      ...options,
    });

    if (params.isRequest) {
      this.requestInProgress = true;
      this.requestUpdate();
    }
  }

  callAction(action) {
    const { service, service_data } = action;
    const [domain, name] = service.split('.');
    this.hass.callService(domain, name, service_data);
  }

  getAttributes(entity) {
    const {
      status,
      state,
      fan_speed,
      fan_speed_list,

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
    } = entity.attributes;

    return {
      status: status || state || entity.state,
      fan_speed,
      fan_speed_list,

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
    };
  }

  renderSource() {
    const { fan_speed: source, fan_speed_list: sources } = this.getAttributes(
      this.entity
    );

    if (!sources) {
      return nothing;
    }

    const selected = sources.indexOf(source);

    return html`
      <div class="tip">
        <ha-button-menu @click="${(e) => e.stopPropagation()}">
          <div slot="trigger">
            <ha-icon icon="mdi:fan"></ha-icon>
            <span class="icon-title">
              ${localize(`source.${source}`) || source}
            </span>
          </div>
          ${sources.map(
            (item, index) =>
              html`
                <mwc-list-item
                  ?activated=${selected === index}
                  value=${item}
                  @click=${(e) => this.handleSpeed(e)}
                >
                  ${localize(`source.${item}`) || item}
                </mwc-list-item>
              `
          )}
        </ha-button-menu>
      </div>
    `;
  }

  renderBatteryMenu() {
    const { battery_level, battery_icon, battery } = this.getAttributes(
      this.entity
    );

    return this.renderButtonMenu(battery_level, battery_icon, battery);
  }

  renderButtonMenu(title, icon, attr_obj) {
    if (!attr_obj) {
      return nothing;
    }

    return html`
      <div class="tip">
        <ha-button-menu @click="${(e) => e.stopPropagation()}">
          <div slot="trigger">
            <ha-icon icon="${icon}"></ha-icon>
            <span class="icon-title">
              ${localize(`attr.${title}`) || title}
            </span>
          </div>
          ${Object.keys(attr_obj).map((item) =>
            typeof attr_obj[item] === 'object' &&
            attr_obj[item] !== null &&
            !Array.isArray(attr_obj[item])
              ? Object.keys(attr_obj[item]).map(
                  (nested_item) =>
                    html`
                      <mwc-list-item value="${nested_item}">
                        ${localize('attr.' + item)} -
                        ${localize('attr.' + nested_item)}:
                        ${localize(
                          'attr.' +
                            nested_item +
                            '_value_' +
                            attr_obj[item][nested_item]
                        ) ||
                        attr_obj[item][nested_item] ||
                        '-'}
                        ${localize(
                          'attr.' +
                            [attr_obj[item][nested_item]] +
                            '_measurement'
                        ) || ''}
                      </mwc-list-item>
                    `
                )
              : html`
                  <mwc-list-item value="${item}">
                    ${localize('attr.' + item)}:
                    ${localize('attr.' + item + '_value_' + attr_obj[item]) ||
                    attr_obj[item] ||
                    '-'}
                    ${localize('attr.' + [item] + '_measurement') || ''}
                  </mwc-list-item>
                `
          )}
        </ha-button-menu>
      </div>
    `;
  }

  renderRSSI() {
    const { rssi } = this.getAttributes(this.entity);

    // Get WiFi Quality from RSSI
    let wifi_quality;
    if (rssi > -101 && rssi < -49) {
      wifi_quality = 2 * (rssi + 100);
    } else {
      wifi_quality == 0;
    }

    let wifi_icon;
    if (rssi > -61) {
      wifi_icon = 'mdi:wifi-strength-4';
    } else if (rssi > -71) {
      wifi_icon = 'mdi:wifi-strength-3';
    } else if (rssi > -81) {
      wifi_icon = 'mdi:wifi-strength-2';
    } else if (rssi > -91) {
      wifi_icon = 'mdi:wifi-strength-1';
    } else {
      wifi_icon = 'mdi:wifi-strength-outline';
    }

    return html`
      <div
        class="tip"
        title="${localize('attr.rssi')}"
        @click="${() => this.handleMore()}"
      >
        <ha-icon icon="${wifi_icon}"></ha-icon>
        <span class="icon-title">${wifi_quality}%</span>
      </div>
    `;
  }

  renderBattery() {
    const { battery_level, battery_icon } = this.getAttributes(this.entity);

    return html`
      <div
        class="tip"
        title="${localize('attr.battery_level')}"
        @click="${() => this.handleMore()}"
      >
        <span class="icon-title">${battery_level}%</span>
        <ha-icon icon="${battery_icon}"></ha-icon>
      </div>
    `;
  }

  renderPartymode() {
    const { partymode_enabled } = this.getAttributes(this.entity);

    return html`
      <div
        class="tip"
        title="${localize('attr.partymode_enabled')}"
        @click="${this.handleAction('partymode', { isRequest: false })}"
      >
        <ha-icon
          icon="${partymode_enabled ? 'hass:sleep' : 'hass:sleep-off'}"
        ></ha-icon>
      </div>
    `;
  }

  renderLock() {
    const { lock } = this.getAttributes(this.entity);

    return html`
      <div
        class="tip"
        title="${localize('attr.lock')}"
        @click="${this.handleAction('lock', { isRequest: false })}"
      >
        <ha-icon icon="${lock ? 'hass:lock' : 'hass:lock-open'}"></ha-icon>
      </div>
    `;
  }

  renderMapOrImage(state) {
    if (this.compactView) {
      return nothing;
    }

    if (this.map) {
      const map = this.hass.states[this.config.map];
      return map && map.attributes.entity_picture
        ? html`
            <img
              class="map"
              src="${map.attributes.entity_picture}&v=${Date.now()}"
              @click=${() => this.handleMore(this.config.map)}
            />
          `
        : nothing;
    }

    if (this.image) {
      return html`
        <img
          class="landroid ${state}"
          src="${this.image}"
          @click="${() => this.handleMore()}"
        />
      `;
    }

    return nothing;
  }

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

  renderName() {
    const { friendly_name } = this.getAttributes(this.entity);

    if (!this.showName) {
      return nothing;
    }

    return html` <div class="landroid-name">${friendly_name}</div> `;
  }

  renderStatus() {
    if (!this.showStatus) {
      return nothing;
    }

    const { status, rain_sensor } = this.getAttributes(this.entity);
    let localizedStatus = localize(`status.${status}`) || status;

    if (status === 'rain_delay') {
      localizedStatus += ` (${rain_sensor[
        'remaining'
      ].toString()} ${(localizedStatus = localize(`units.min`) || '')})`;
    }

    return html`
      <div class="status">
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

  renderButton(action, icon = action, name = action, title = false) {
    if (title) {
      return html`
        <ha-button
          @click="${this.handleAction(action)}"
          title="${localize('common.' + name)}"
        >
          <ha-icon icon="hass:${icon}"></ha-icon>
          ${localize('common.' + name)}
        </ha-button>
      `;
    } else {
      return html`
        <ha-icon-button
          label="${localize('common.' + name)}"
          @click="${this.handleAction(action)}"
        >
          <ha-icon icon="hass:${icon}"></ha-icon>
        </ha-icon-button>
      `;
    }
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
            ${this.renderButton('pause', 'pause', 'pause', true)}
            ${this.renderButton('stop', 'stop', 'stop', true)}
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
          </div>
        `;
      }

      case 'edgecut': {
        return html`
          <div class="toolbar">
            ${this.renderButton('pause', 'motion-pause', 'pause', true)}
            ${this.renderButton('stop', 'stop', 'stop', true)}
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
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
              title="${localize('common.resume')}"
            >
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('common.continue')}
            </ha-button>
            ${this.renderButton(
              'return_to_base',
              'home-import-outline',
              'return_to_base',
              true
            )}
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
              title="${localize('common.resume')}"
            >
              <ha-icon icon="hass:play"></ha-icon>
              ${localize('common.continue')}
            </ha-button>
            ${this.renderButton('edgecut', 'motion-play', 'edgecut', true)}
            ${this.renderButton('pause', 'pause', 'pause', true)}
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

        const dockButton = html`${this.renderButton(
          'return_to_base',
          'home-import-outline'
        )}`;

        return html`
          <div class="toolbar">
            ${this.renderButton('start', 'play')}
            ${this.renderButton('edgecut', 'motion-play')}
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
              ${this.renderRSSI()} ${this.renderPartymode()}
              ${this.renderLock()} ${this.renderBatteryMenu()}
            </div>
            <!-- <ha-icon-button
              class="more-info"
              icon="hass:dots-vertical"
              more-info="true"
              @click="${() => this.handleMore()}">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </ha-icon-button> -->
          </div>

          ${this.renderMapOrImage(state)}

          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>

          <div class="stats">${this.renderStats(state)}</div>
        </div>

        ${this.renderToolbar(state)}
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
