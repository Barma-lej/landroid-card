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
    const newConfig = { ...defaultConfig, ...config };

    // Get all entities of domain 'lawn_mower'
    const lawnMowerEntities = this.entities() || [];
    let firstRun = false;

    // If entity is not set in config and we have at least one lawn_mower entity, assign the first one
    if (!newConfig?.entity && lawnMowerEntities.length > 0) {
      newConfig.entity = lawnMowerEntities[0];
      firstRun = true;
    }

    if (firstRun) {
      // Получаем все объекты для lawn_mower
      const mowerEntities = [...this.entitiesForMower(newConfig?.entity || '')];

      // Если entity не задано и есть объекты для lawn_mower, добавляем первый entity
      if (mowerEntities.length > 0) {
        newConfig['settings'] = mowerEntities;
      }
    }

    // Assign the new configuration
    this.config = newConfig;
  }

  /**
   * Returns an array of all entities of the domains 'select', 'switch', 'number', and 'button'
   * for the lawn_mower device specified in the config.
   *
   * @return {string[]} An array of entity IDs.
   */
  entitiesForMower(mower = this.config.entity) {
    // const mower = entity || '';
    if (!mower) return [];

    const domainList = ['select', 'switch', 'number', 'button'];

    // Получаем все объекты для конкретного устройства lawn_mower
    return domainList
      .flatMap((domain) =>
        Object.keys(this.hass.states).filter((entityId) =>
          entityId.startsWith(`${domain}.${mower.split('.')[1]}`),
        ),
      )
      .sort();
  }

  /**
   * Returns an array of entity IDs from the Home Assistant state object that match the given domain.
   * If the domain is 'camera', an empty string is added to the array.
   * The array is sorted alphabetically.
   *
   * @param {string} [domain='lawn_mower'] - The domain to filter entity IDs by.
   * @return {string[]} An array of entity IDs that match the given domain, with an empty string added if the domain is 'camera'.
   */
  entities(domain = 'lawn_mower') {
    if (!this.hass || !this.hass.states) {
      throw new Error('Home Assistant instance is not available');
    }

    const entities = Object.keys(this.hass.states).filter((entityId) =>
      entityId.startsWith(`${domain}.`),
    );

    if (domain === 'camera') {
      entities.unshift('');
    }

    return entities.sort();
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
   * Render a switch based on the provided configValue.
   *
   * @param {type} configValue - The value used to configure the checkbox.
   * @return {type} The rendered checkbox element.
   */
  renderSwitch(configValue) {
    if (configValue === undefined || configValue === null) {
      return nothing;
    }

    return html`
      <ha-formfield
        .name=${configValue}
        label=${localize('editor.' + configValue)}
        title=${localize(
          'editor.' +
            configValue +
            '_aria_label_' +
            (this.config && this.config[configValue] ? 'off' : 'on'),
        )}
      >
        <ha-switch
          @change=${this.configChanged}
          .checked=${this.config ? this.config[configValue] : false}
          .configValue=${configValue}
        >
          ${localize('editor.' + configValue)}
        </ha-switch>
      </ha-formfield>
    `;
  }

  /**
   * Renders a list of select elements for the user to select mower entities that they would like to display on the card.
   *
   * @return {TemplateResult} The rendered list of select elements.
   */
  renderSettings() {
    if (!this.config) {
      return nothing;
    }

    const mowerEntities = this.entitiesForMower()
      ? ['', ...this.entitiesForMower()]
      : [''];
    const listItems = mowerEntities.map(
      (entity) => html`
        <mwc-list-item .value="${entity}">${entity}</mwc-list-item>
      `,
    );

    const settings = this.config.settings
      ? [...this.config.settings, '']
      : [''];

    return settings.map(
      (setting, index) => html`
        <div class="entities">
          <ha-select
            label="${this.hass.localize(
              'ui.components.entity.entity-picker.entity',
            )}"
            .configValue="${'settings'}"
            data-index="${index}"
            .value="${setting || ''}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
          >
            ${listItems}
          </ha-select>
        </div>
      `,
    );
  }

  /**
   * Renders the component's UI based on the current configuration.
   *
   * @return {TemplateResult} The rendered UI as a lit-html TemplateResult.
   */
  render() {
    if (!this.hass || !this.config) {
      return nothing;
    }

    const entityOptions = this.entities().map(
      (entity) => html`
        <mwc-list-item
          .value="${entity}"
          ?selected=${entity === this.config.entity}
        >
          ${entity}
        </mwc-list-item>
      `,
    );

    const cameraOptions = this.entities('camera').map(
      (entity) => html`
        <mwc-list-item
          .value="${entity}"
          ?selected=${entity === this.config.camera}
        >
          ${entity}
        </mwc-list-item>
      `,
    );

    const imageSizeOptions = ['1', '2', '3', '4', '5', '6', '7', '8'].map(
      (size) => html`
        <mwc-list-item
          .value="${size}"
          ?selected=${size === this.config.image_size}
        >
          ${size}
        </mwc-list-item>
      `,
    );

    return html`
      <div class="card-config">
        <div class="entities">
          <ha-select
            label="${this.hass.localize(
              'ui.components.entity.entity-picker.entity',
            )}
              (${this.hass.localize(
              'ui.panel.lovelace.editor.card.config.required',
            )})"
            .configValue="${'entity'}"
            .value="${this.config.entity}"
            @selected="${this.configChanged}"
            @closed="${(e) => e.stopPropagation()}"
          >
            ${entityOptions}
          </ha-select>
        </div>

        <div class="entities">
          <ha-select
            label="${this.hass.localize(
              'ui.panel.lovelace.editor.card.generic.camera_image',
            )}"
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
            label="${this.hass.localize(
              'ui.panel.lovelace.editor.card.generic.image_entity',
            )}"
            class="textfield"
            .data="${this.config.image}"
            .configValue="${'image'}"
            .value="${this.config.image}"
            @change="${this.configChanged}"
          ></ha-textfield>
        </div>

        <div class="side-by-side">
          ${this.renderSwitch('show_animation')}
          ${this.renderSwitch('image_left')}
        </div>

        <div class="side-by-side">
          ${this.renderSwitch('show_name')} ${this.renderSwitch('show_status')}
        </div>

        <div class="side-by-side">
          ${this.renderSwitch('show_toolbar')}
          ${this.renderSwitch('compact_view')}
        </div>
        <h3>
          ${this.hass.localize(
            'ui.panel.lovelace.editor.card.generic.entities',
          )}
        </h3>
        ${this.renderSettings()}
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
      // if (!this.config || !this.hass || !event.target)
      return;

    const { target } = event;
    const value = target.value;
    const index = target.getAttribute('data-index');

    if (target.configValue) {
      if (target.configValue === 'settings' && index !== null) {
        // Изменение конкретного элемента в массиве settings
        const newSettings = this.config.settings
          ? [...this.config.settings]
          : [];
        if (value === '') {
          newSettings.splice(index, 1);
        } else {
          newSettings[index] = value;
        }
        if (newSettings.length === 0) {
          delete this.config.settings;
        } else {
          this.config = {
            ...this.config,
            settings: newSettings,
          };
        }
      } else {
        // Для других полей конфигурации
        if (value === '') {
          delete this.config[target.configValue];
        } else {
          this.config = {
            ...this.config,
            [target.configValue]:
              target.checked !== undefined ? target.checked : value,
          };
        }
      }
    }
    fireEvent(this, 'config-changed', { config: this.config });
  }
}
