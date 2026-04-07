import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { defaultConfig } from './defaults';
import {
  MOWER_ENTITY_DOMAINS,
  CARD_MAP,
  BATTERYCARD,
  INFOCARD,
  STATISTICSCARD,
} from './constants';
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
    return { hass: {}, config: {}, _activeTab: { type: String } };
  }

  /**
   * Sets the configuration for the component.
   *
   * @param {Object} config - The configuration object to be set.
   * @return {void} This function does not return anything.
   */
  setConfig(config) {
    const newConfig = { ...defaultConfig, ...config };

    const lawnMowerEntities = this.entities() || [];

    if (!newConfig.entity && lawnMowerEntities.length > 0) {
      newConfig.entity = lawnMowerEntities[lawnMowerEntities.length - 1];
    }

    // Миграция: settings → settings_card
    if (newConfig.settings !== undefined) {
      if (newConfig.settings_card === undefined) {
        newConfig.settings_card = newConfig.settings;
      }
      delete newConfig.settings;
      fireEvent(this, 'config-changed', { config: newConfig });
    }

    // Если settings_card не задан явно — подставить дефолты из MOWER_ENTITY_DOMAINS
    if (!newConfig.settings_card && newConfig.entity && this.hass) {
      const defaults = this.entitiesForMower(newConfig.entity);
      if (defaults.length > 0) newConfig.settings_card = defaults;
    }

    this.config = newConfig;
    this._activeTab = this._activeTab || 'general';
  }

  /**
   * Returns default entity IDs for a card type based on CARD_MAP suffixes.
   *
   * @param {string} cardType - 'battery' | 'info' | 'statistics'
   * @param {string} [mower=this.config.entity]
   * @return {string[]}
   */
  defaultEntitiesForCard(cardType, mower = this.config.entity) {
    if (!mower || !this.hass?.states) return [];

    const mowerName = mower.split('.')[1];
    const suffixes = CARD_MAP[cardType]?.entities || [];

    return suffixes
      .map((suffix) => {
        // Ищем entity с таким суффиксом среди всех состояний устройства
        const found = Object.keys(this.hass.states).find(
          (entityId) =>
            entityId.endsWith(`_${suffix}`) && entityId.includes(mowerName),
        );
        return found;
      })
      .filter(Boolean);
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
    return MOWER_ENTITY_DOMAINS.flatMap((domain) =>
      Object.keys(this.hass.states).filter((entityId) =>
        entityId.startsWith(`${domain}.${mower.split('.')[1]}`),
      ),
    ).sort();
  }

  /**
   * Returns an array of entity IDs for all entities associated with the specified lawn_mower device.
   *
   * @param {string} [mower=this.config.entity] - The entity ID of the lawn_mower device.
   * @return {string[]} An array of entity IDs associated with the specified lawn_mower device.
   */
  entitiesForMowerAll(mower = this.config.entity) {
    if (!mower || !this.hass.entities) return [];

    const deviceId = this.hass.entities[mower]?.device_id;
    if (!deviceId) return [];

    return Object.values(this.hass.entities)
      .filter((entity) => entity.device_id === deviceId)
      .map((entity) => entity.entity_id)
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
   * Called when the component has been updated.
   * Checks if the Home Assistant instance has been updated and if the component has an entity set.
   * If so, it updates the component's configuration with default values for settings and card tabs.
   * Fires a 'config-changed' event if the configuration has been changed.
   * @param {Object} changedProps - An object containing information on what properties have changed.
   * @return {void} This function does not return anything.
   */
  updated(changedProps) {
    if (changedProps.has('hass') && this.hass?.states && this.config?.entity) {
      // Settings card defaults
      if (!this.config.settings_card) {
        const defaults = this.entitiesForMower(this.config.entity);
        if (defaults.length > 0) {
          this.config = { ...this.config, settings_card: defaults };
          fireEvent(this, 'config-changed', { config: this.config });
        }
      }

      // Card tab defaults
      let changed = false;
      const newConfig = { ...this.config };

      for (const cardType of [BATTERYCARD, INFOCARD, STATISTICSCARD]) {
        const configKey = `${cardType}_card`;
        if (!newConfig[configKey]) {
          const defaults = this.defaultEntitiesForCard(cardType);
          if (defaults.length > 0) {
            newConfig[configKey] = defaults;
            changed = true;
          }
        }
      }

      if (changed) {
        this.config = newConfig;
        fireEvent(this, 'config-changed', { config: this.config });
      }
    }

    if (!this._firstRendered) {
      this._firstRendered = true;
    }
  }

  /**
   * Renders entity picker list for card tabs and settings.
   *
   * @param {string} configKey - config key: 'battery_card' | 'info_card' | 'statistics_card' | 'config_card'
   * @param {Function} [sourceEntities] - function returning available entities list. Defaults to entitiesForMowerAll.
   */
  renderEntityList(
    configKey,
    sourceEntities = () => this.entitiesForMowerAll(),
  ) {
    if (!this.config) return nothing;

    const current = this.config[configKey]
      ? [...this.config[configKey], '']
      : [''];

    return html`
      <p class="note">${localize('editor.card_entities_note')}</p>
      ${current.map(
        (entityId, index) => html`
          <div class="entities">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                entity: {
                  include_entities: ['', ...sourceEntities()],
                  exclude_entities: (this.config[configKey] || []).filter(
                    (s, i) => i !== index && s !== '',
                  ),
                },
              }}
              .value=${entityId || ''}
              .required=${false}
              data-index=${index}
              @value-changed=${(e) => {
                if (!this._firstRendered) return;
                const value = e.detail.value;
                const newItems = this.config[configKey]
                  ? [...this.config[configKey]]
                  : [];
                if (!value) {
                  newItems.splice(index, 1);
                } else {
                  newItems[index] = value;
                }
                if (newItems.length === 0) {
                  const newConfig = { ...this.config };
                  delete newConfig[configKey];
                  this.config = newConfig;
                } else {
                  this.config = { ...this.config, [configKey]: newItems };
                }
                fireEvent(this, 'config-changed', { config: this.config });
              }}
            ></ha-selector>
          </div>
        `,
      )}
    `;
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
   * Renders the component's UI based on the current configuration.
   *
   * @return {TemplateResult} The rendered UI as a lit-html TemplateResult.
   */
  render() {
    if (!this.hass || !this.config) return nothing;

    const tabs = [
      { id: 'general', label: localize('editor.tab_general') },
      { id: 'info', label: localize('editor.tab_info') },
      { id: 'statistics', label: localize('editor.tab_statistics') },
      { id: 'battery', label: localize('editor.tab_battery') },
      { id: 'settings', label: localize('editor.tab_settings') },
    ];

    return html`
      <div class="card-config">
        <div class="tab-bar">
          ${tabs.map(
            ({ id, label }) => html`
              <div
                class="tab"
                ?active=${this._activeTab === id}
                @click=${() => {
                  this._activeTab = id;
                }}
              >
                ${label}
              </div>
            `,
          )}
        </div>

        ${this._activeTab === 'general'
          ? html`
              <div class="entities">
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{ entity: { domain: 'lawn_mower' } }}
                  .value=${this.config.entity || ''}
                  .label=${this.hass.localize(
                    'ui.components.entity.entity-picker.entity',
                  ) +
                  ' (' +
                  this.hass.localize(
                    'ui.panel.lovelace.editor.card.config.required',
                  ) +
                  ')'}
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
                  .label=${this.hass.localize(
                    'ui.panel.lovelace.editor.card.generic.camera_image',
                  )}
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
                  .value="${this.config.image}"
                  .configValue="${'image'}"
                  @change="${this.configChanged}"
                ></ha-textfield>

                <ha-selector
                  class="flex-1"
                  .hass=${this.hass}
                  .label=${localize('editor.image_size')}
                  .selector=${{
                    number: { min: 1, max: 8, step: 1, mode: 'box' },
                  }}
                  .value=${this.config.image_size || '2'}
                  .required=${false}
                  @value-changed=${(e) => {
                    this.config = {
                      ...this.config,
                      image_size: e.detail.value,
                    };
                    fireEvent(this, 'config-changed', { config: this.config });
                  }}
                ></ha-selector>
              </div>

              <div class="side-by-side">
                ${this.renderSwitch('show_animation')}
                ${this.renderSwitch('image_left')}
              </div>
              <div class="side-by-side">
                ${this.renderSwitch('show_name')}
                ${this.renderSwitch('show_status')}
              </div>
              <div class="side-by-side">
                ${this.renderSwitch('show_toolbar')}
                ${this.renderSwitch('show_edgecut')}
              </div>
              <div class="side-by-side">
                ${this.renderSwitch('compact_view')}
              </div>
            `
          : nothing}
        ${this._activeTab === 'battery'
          ? this.renderEntityList('battery_card')
          : nothing}
        ${this._activeTab === 'info'
          ? this.renderEntityList('info_card')
          : nothing}
        ${this._activeTab === 'statistics'
          ? this.renderEntityList('statistics_card')
          : nothing}
        ${this._activeTab === 'settings'
          ? this.renderEntityList('settings_card', () => this.entitiesForMowerAll())
          : nothing}
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
