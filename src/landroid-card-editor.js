import { LitElement, html } from 'lit';
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin';
import style from './style-editor';
import defaultConfig from './defaults';
import buildElementDefinitions from './buildElementDefinitions';
import globalElementLoader from './globalElementLoader';
import MwcListItem from './mwc/list-item';
import MwcSelect from './mwc/select';
import localize from './localize';

export const fireEvent = (node, type, detail = {}, options = {}) => {
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });

  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

export default class LandroidCardEditor extends ScopedRegistryHost(LitElement) {
  static get elementDefinitions() {
    return buildElementDefinitions(
      [
        globalElementLoader('ha-checkbox'),
        globalElementLoader('ha-formfield'),
        globalElementLoader('ha-form-string'),
        MwcListItem,
        MwcSelect,
      ],
      LandroidCardEditor
    );
  }

  static get styles() {
    return style;
  }

  static get properties() {
    return { hass: {}, _config: {} };
  }

  setConfig(config) {
    this._config = {
      ...defaultConfig,
      ...config,
    };
  }

  entityOptions(domain = 'vacuum') {
    const allEntities = Object.keys(this.hass.states).filter((eid) =>
      [domain].includes(eid.substring(0, eid.indexOf('.')))
    );

    allEntities.sort();
    return allEntities;
  }

  firstUpdated() {
    this._firstRendered = true;
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    // get header name
    // let { header } = this._config;
    // if (!header && this._config.entity) {
    //   let name = this._config.entity.split('.')[1] || '';
    //   if (name) {
    //     name = name.charAt(0).toUpperCase() + name.slice(1);
    //     header = name;
    //   }
    // }

    // eslint-disable-next-line arrow-body-style
    // eslint-disable-next-line arrow-parens
    const options = this.entityOptions().map(
      (entity) =>
        html`<mwc-list-item
          value="${entity}"
          ?selected=${entity === this._config.entity}
          >${entity}</mwc-list-item
        > `
    );
    const cameraOptions = this.entityOptions('camera').map(
      (entity) =>
        html`<mwc-list-item
          value="${entity}"
          ?selected=${entity === this._config.entity}
          >${entity}</mwc-list-item
        >`
    );

    return html`
      <div class="card-config">
        <div class="entities">
          <mwc-select
            .naturalMenuWidth=${true}
            label="${localize('editor.entity')}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
            .configValue="${'entity'}"
          >
            ${options}
          </mwc-select>
        </div>

        <div class="entities">
          <mwc-select
            .naturalMenuWidth=${true}
            label="${localize('editor.camera')}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
            .configValue="${'camera'}"
          >
            ${cameraOptions}
          </mwc-select>
          <ha-form-string
            .schema=${{ name: 'image', type: 'string' }}
            label="${localize('editor.image')}"
            .data="${this._config.image}"
            .configValue="${'image'}"
            @value-changed="${this.configChanged}"
          ></ha-form-string>
        </div>

        <div class="overall-config">
          <div class="checkbox-options">
            <ha-formfield label="${localize('editor.compact_view')}">
              <ha-checkbox
                @change="${this.checkboxConfigChanged}"
                .checked=${this._config.compact_view}
                .value="${'compact_view'}"
              ></ha-checkbox>
            </ha-formfield>
            <ha-formfield label="${localize('editor.show_name')}">
              <ha-checkbox
                @change="${this.checkboxConfigChanged}"
                .checked=${this._config.show_name}
                .value="${'show_name'}"
              ></ha-checkbox>
            </ha-formfield>
          </div>

          <div class="checkbox-options">
            <ha-formfield label="${localize('editor.show_status')}">
              <ha-checkbox
                @change="${this.checkboxConfigChanged}"
                .checked=${this._config.show_status}
                .value="${'show_status'}"
              ></ha-checkbox>
            </ha-formfield>
            <ha-formfield label="${localize('editor.show_toolbar')}">
              <ha-checkbox
                @change="${this.checkboxConfigChanged}"
                .checked=${this._config.show_toolbar}
                .value="${'show_toolbar'}"
              ></ha-checkbox>
            </ha-formfield>
          </div>

          <strong> ${localize('editor.code_only_note')} </strong>
        </div>
      </div>
    `;
  }

  configChanged(ev) {
    if (!this._config || !this.hass || !this._firstRendered) return;
    const {
      target: { configValue, value },
      detail: { value: checkedValue },
    } = ev;

    if (checkedValue !== undefined && checkedValue !== null) {
      this._config = { ...this._config, [configValue]: checkedValue };
    } else {
      this._config = { ...this._config, [configValue]: value };
    }

    fireEvent(this, 'config-changed', { config: this._config });
  }

  checkboxConfigChanged(ev) {
    if (!this._config || !this.hass || !this._firstRendered) return;
    const {
      target: { value, checked },
    } = ev;

    this._config = { ...this._config, [value]: checked };

    fireEvent(this, 'config-changed', { config: this._config });
  }
}
