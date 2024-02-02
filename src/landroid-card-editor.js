import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import style from './style-editor';
import { defaultConfig } from './defaults';
import localize from './localize';

export default class LandroidCardEditor extends LitElement {
  static get styles() {
    return style;
  }

  static get properties() {
    return { hass: {}, config: {} };
  }

  setConfig(config) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  entityOptions(domain = 'lawn_mower') {
    const allEntities = Object.keys(this.hass.states).filter((eid) =>
      [domain].includes(eid.substring(0, eid.indexOf('.'))),
    );

    if (domain === 'camera') {
      allEntities.push('');
    }

    allEntities.sort();
    return allEntities;
  }

  firstUpdated() {
    this._firstRendered = true;
  }

  renderCheckbox(configValue) {
    if (!configValue) {
      return nothing;
    }

    return html`
      <ha-formfield
        label="${localize('editor.' + configValue)}"
        title="${localize(
          'editor.' +
            configValue +
            '_aria_label_' +
            (this.config[configValue] ? 'off' : 'on'),
        )}"
      >
        <ha-checkbox
          @change="${this.configChanged}"
          .checked=${this.config[configValue]}
          .configValue="${configValue}"
        ></ha-checkbox>
      </ha-formfield>
    `;
  }

  render() {
    if (!this.hass) {
      return nothing;
    }

    const options = this.entityOptions().map(
      (entity) => html`
        <mwc-list-item
          .value="${entity}"
          ?selected=${entity === this.config.entity}
          >${entity}
        </mwc-list-item>
      `,
    );
    const cameraOptions = this.entityOptions('camera').map(
      (entity) => html`
        <mwc-list-item
          .value="${entity}"
          ?selected=${entity === this.config.entity}
          >${entity}
        </mwc-list-item>
      `,
    );

    // Issue https://github.com/Barma-lej/landroid-card/issues/57
    const imageSizeOptions = ['1', '2', '3', '4', '5', '6', '7', '8'].map(
      (size) => html`
        <mwc-list-item
          .value="${size}"
          ?selected=${size === this.config.image_size}
          >${size}
        </mwc-list-item>
      `,
    );

    return html`
      <div class="card-config">
        <div class="entities">
          <ha-select
            label="${localize('editor.entity')}"
            .configValue="${'entity'}"
            .value="${this.config.entity}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
          >
            ${options}
          </ha-select>
        </div>

        <div class="entities">
          <ha-select
            label="${localize('editor.camera')}"
            class="column"
            .configValue="${'camera'}"
            .value="${this.config.camera}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
          >
            ${cameraOptions}
          </ha-select>

          <ha-select
            label="${localize('editor.image_size')}"
            class="column"
            .configValue="${'image_size'}"
            .value="${this.config.image_size}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
          >
            ${imageSizeOptions}
          </ha-select>
        </div>

        <div class="entities">
          <ha-textfield
            label="${localize('editor.image')}"
            class="textfield"
            .data="${this.config.image}"
            .configValue="${'image'}"
            .value="${this.config.image}"
            @change="${this.configChanged}"
          ></ha-textfield>
        </div>

        <div class="overall-config">
          <div class="checkbox-options">
            ${this.renderCheckbox('show_animation')}
            ${this.renderCheckbox('image_left')}
          </div>

          <div class="checkbox-options">
            ${this.renderCheckbox('show_name')}
            ${this.renderCheckbox('show_status')}
          </div>

          <div class="checkbox-options">
            ${this.renderCheckbox('show_toolbar')}
            ${this.renderCheckbox('compact_view')}
          </div>

          <strong>${localize('editor.code_only_note')}</strong>
        </div>
      </div>
    `;
  }

  configChanged(event) {
    if (!this.config || !this.hass || !this._firstRendered || !event.target)
      return;

    const { target } = event;

    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }

    fireEvent(this, 'config-changed', { config: this.config });
  }
}
