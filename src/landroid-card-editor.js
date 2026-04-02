import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { defaultConfig } from './defaults';
import { MOWER_ENTITY_DOMAINS } from './constants';
import style from './style-editor';
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

    // If entity is not set in config and we have at least one lawn_mower entity, assign the first one
    if (!newConfig.entity && lawnMowerEntities.length > 0) {
      newConfig.entity = lawnMowerEntities[lawnMowerEntities.length - 1];

      const mowerEntities = this.entitiesForMower(newConfig.entity);
      if (mowerEntities.length > 0) {
        newConfig.settings = mowerEntities;
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

    // Получаем все объекты для конкретного устройства lawn_mower
    return MOWER_ENTITY_DOMAINS
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
      <ha-selector
        .label=${localize('editor.' + configValue)}
        .selector=${{ boolean: {} }}
        .value=${this.config?.[configValue] ?? false}
        @value-changed=${(e) => {
          if (!this._firstRendered) return;
          this.config = { ...this.config, [configValue]: e.detail.value };
          fireEvent(this, 'config-changed', { config: this.config });
        }}
      ></ha-selector>
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

    const settings = this.config.settings
      ? [...this.config.settings, '']
      : [''];

    return settings.map(
      (setting, index) => html`
        <div class="entities">
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              entity: {
                include_entities: ['', ...this.entitiesForMower()],
                // Исключаем все выбранные, кроме текущего элемента
                exclude_entities: (this.config.settings || []).filter(
                  (s, i) => i !== index && s !== ''
                ),
              },
            }}
            .value=${setting || ''}
            .required=${false}
            data-index=${index}
            @value-changed=${(e) => {
              if (!this._firstRendered) return;
              const value = e.detail.value;
              const newSettings = this.config.settings
                ? [...this.config.settings]
                : [];
              if (!value) {
                newSettings.splice(index, 1);
              } else {
                newSettings[index] = value;
              }
              if (newSettings.length === 0) {
                const newConfig = { ...this.config };
                delete newConfig.settings;
                this.config = newConfig;
              } else {
                this.config = { ...this.config, settings: newSettings };
              }
              fireEvent(this, 'config-changed', { config: this.config });
            }}
          ></ha-selector>
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

    return html`
      <div class="card-config">
        <div class="entities">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ entity: { domain: 'lawn_mower' } }}
              .value=${this.config.entity || ''}
              .label=${this.hass.localize('ui.components.entity.entity-picker.entity') + ' (' + this.hass.localize('ui.panel.lovelace.editor.card.config.required') + ')'} 
              @value-changed=${(e) => {
                this.config = { ...this.config, entity: e.detail.value };
                fireEvent(this, 'config-changed', { config: this.config });
              }}
            ></ha-selector>
        </div>

        <div class="entities">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ entity: { domain: 'camera' } }}
            .value=${this.config.camera || ''}
            .label=${this.hass.localize('ui.panel.lovelace.editor.card.generic.camera_image')}
            .required=${false}
            @value-changed=${(e) => {
              if (!this._firstRendered) return;
              this.config = { ...this.config, camera: e.detail.value };
              fireEvent(this, 'config-changed', { config: this.config });
            }}
          ></ha-selector>
        </div>

        <div class="entities">
          <ha-textfield
            label="${this.hass.localize(
              'ui.panel.lovelace.editor.card.generic.image_entity',
            )}"
            class="textfield flex-3"
            .data="${this.config.image}"
            .configValue="${'image'}"
            .value="${this.config.image}"
            @change="${this.configChanged}"
          ></ha-textfield>

          <ha-selector
            class="flex-1"
            .hass=${this.hass}
            .label=${localize('editor.image_size')}
            .selector=${{
              number: {
                min: 1,
                max: 8,
                step: 1,
                mode: 'box', // или 'slider'
              }
            }}
            .value=${this.config.image_size || '2'}
            .required=${false}
            @value-changed=${(e) => {
              this.config = { ...this.config, image_size: e.detail.value };
              fireEvent(this, 'config-changed', { config: this.config });
            }}
          ></ha-selector>
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
          ${this.renderSwitch('show_edgecut')}
        </div>

        <div class="side-by-side">
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

    if (target.configValue) {
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
    fireEvent(this, 'config-changed', { config: this.config });
  }
}
