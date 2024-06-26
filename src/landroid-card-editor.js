import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import style from './style-editor';
import { defaultConfig } from './defaults';
import localize from './localize';

export default class LandroidCardEditor extends LitElement {
  static get styles() {
    return style;
  }

  /**
   * Returns an object containing the properties of the class.
   *
   * @return {Object} An object with the properties 'hass' and 'config'.
   */
  static get properties() {
    return { hass: {}, config: {} };
  }

  /**
   * Sets the configuration for the component.
   *
   * @param {Object} config - The configuration object to be set.
   * @return {void} This function does not return anything.
   */
  setConfig(config) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * Returns an array of entity IDs from the Home Assistant state object that match the given domain.
   * If the domain is 'camera', an empty string is added to the array.
   * The array is sorted alphabetically.
   *
   * @param {string} [domain='lawn_mower'] - The domain to filter entity IDs by.
   * @return {string[]} An array of entity IDs that match the given domain, with an empty string added if the domain is 'camera'.
   */
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

  /**
   * Updates the component after the first render.
   *
   * This function is called automatically by LitElement after the component
   * has been rendered for the first time. It sets the `_firstRendered` property
   * of the component to `true`, indicating that the component has been rendered
   * at least once.
   *
   * @return {void} This function does not return a value.
   */
  firstUpdated() {
    this._firstRendered = true;
  }

  /**
   * Render a checkbox based on the provided configValue.
   *
   * @param {type} configValue - The value used to configure the checkbox.
   * @return {type} The rendered checkbox element.
   */
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


  /**
   * Renders the component's UI based on the current configuration.
   *
   * @return {TemplateResult} The rendered UI as a lit-html TemplateResult.
   */
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

  /**
   * Handles the event when the configuration is changed.
   *
   * @param {Event} event - The event object containing the target element.
   * @return {void} This function does not return anything.
   */
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
