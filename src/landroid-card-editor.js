import { LitElement, html, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { defaultConfig } from './defaults';
import { CARD_MAP, DEVICE_CLASS_MAP } from './constants';
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
    this.config = { ...config };
  }

  defaultEntitiesForCard(cardType) {
    const config = CARD_MAP[cardType];
    if (!config || !this.hass.entities) return [];

    // Безопасное извлечение массивов
    const targetClasses = config.targetClasses || [];
    const fallbackClasses = config.fallbackClasses || [];

    const entities = this.entitiesForMowerAll();
    const mapped = [];

    // Ищем сущности по основным классам
    entities.forEach((entityId) => {
      const stateObj = this.hass.states[entityId];
      if (stateObj) {
        const deviceClass = stateObj.attributes.device_class;
        if (targetClasses.includes(deviceClass)) {
          mapped.push(entityId);
        }
      }
    });

    const baseDomain = fallbackClasses.map((fb) => fb.split('.')[0]);
    const fallbackTypes = fallbackClasses.map((fb) => fb.split('.')[1]);
    const [domain] = baseDomain;
    const deviceClassKey = DEVICE_CLASS_MAP ? DEVICE_CLASS_MAP[domain] : null;

    // Заполняем оставшиеся места фоллбэками
    if (mapped.length < targetClasses.length && deviceClassKey) {
      entities.forEach((entityId) => {
        const stateObj = this.hass.states[entityId];
        if (stateObj) {
          const deviceClass = stateObj.attributes[deviceClassKey];

          if (
            fallbackTypes.includes(deviceClass) &&
            !mapped.includes(entityId)
          ) {
            mapped.push(entityId);
          }
        }
      });
    }

    return mapped;
  }

  /**
   * Returns an array of all entities of the domains 'select', 'switch', 'number', and 'button'
   * for the lawn_mower device specified in the config.
   *
   * @return {string[]} An array of entity IDs.
   */
  entitiesForMower(mower = this.config.entity) {
    if (!mower || !this.hass?.entities) return [];

    const deviceId = this.hass.entities[mower]?.device_id;
    if (!deviceId) return [];

    return Object.values(this.hass.entities)
      .filter((e) => e.device_id === deviceId && e.entity_category === 'config')
      .map((e) => e.entity_id)
      .sort();
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

  firstUpdated() {
    this._firstRendered = true;
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (!this._firstRendered) return;

    fireEvent(this, 'ha-component-height', { height: 100 });
  }

  /**
   * Renders a list of entities for the specified configuration key.
   * If the configuration key is not present in the component's configuration,
   * it uses the default entities for the card type associated with the configuration key.
   * If the configuration key is present, it uses the entities specified in the configuration.
   * In both cases, an empty string is added to the end of the list.
   * @param {string} configKey - The configuration key to use when rendering the list of entities.
   * @param {Function} sourceEntities - A function that returns an array of entity IDs to use as the source for the list of entities.
   * @return {TemplateResult} A template result containing the rendered list of entities.
   */
  renderEntityList(
    configKey,
    sourceEntities = () => this.entitiesForMowerAll(),
  ) {
    if (!this.config) return nothing;

    const cardType = configKey.replace('_card', '');
    const isCardTab = cardType in CARD_MAP;

    const configured = this.config[configKey];
    const getDefaults = () => {
      if (isCardTab) return this.defaultEntitiesForCard(cardType);
      if (configKey === 'settings_card') return this.entitiesForMower();
      return [];
    };

    const items = configured ?? getDefaults();
    const displayList = [...items, ''];

    return html`
      <p class="note">${localize('editor.card_entities_note')}</p>
      <ha-sortable
        handle-selector=".handle"
        @item-moved=${(e) => {
          if (!this._firstRendered) return;
          const { oldIndex, newIndex } = e.detail;
          const base = this.config[configKey]
            ? [...this.config[configKey]]
            : [...getDefaults()];
          base.splice(newIndex, 0, base.splice(oldIndex, 1)[0]);
          this.config = { ...this.config, [configKey]: base };
          fireEvent(this, 'config-changed', { config: this.config });
        }}
      >
        <div class="entities-list">
          ${displayList.map(
            (entityId, index) => html`
              <div class="entities" .index=${index}>
                ${index < items.length
                  ? html`<ha-icon class="handle" icon="mdi:drag"></ha-icon>`
                  : nothing}
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
                    const base = this.config[configKey]
                      ? [...this.config[configKey]]
                      : [...getDefaults()];
                    if (!value) {
                      base.splice(index, 1);
                    } else {
                      base[index] = value;
                    }
                    if (base.length === 0) {
                      const newConfig = { ...this.config };
                      delete newConfig[configKey];
                      this.config = newConfig;
                    } else {
                      this.config = { ...this.config, [configKey]: base };
                    }
                    fireEvent(this, 'config-changed', { config: this.config });
                  }}
                ></ha-selector>
              </div>
            `,
          )}
        </div>
      </ha-sortable>
    `;
  }

  _computeLabelCallback = (schema) => {
    if (schema.name === 'entity') {
      return (
        this.hass.localize('ui.components.entity.entity-picker.entity') +
        ' (' +
        this.hass.localize('ui.panel.lovelace.editor.card.config.required') +
        ')'
      );
    }
    if (schema.name === 'camera') {
      return this.hass.localize(
        'ui.panel.lovelace.editor.card.generic.camera_image',
      );
    }
    if (schema.name === 'camera_view') {
      return this.hass.localize(
        'ui.panel.lovelace.editor.card.generic.camera_view',
      );
    }
    if (schema.name === 'image') {
      return this.hass.localize(
        'ui.panel.lovelace.editor.card.generic.image_entity',
      );
    }
    if (schema.name === 'image_size') {
      return localize('editor.image_size');
    }

    return localize(`editor.${schema.name}`) || schema.name;
  };

  _valueChanged = (ev) => {
    if (!this._firstRendered) return;
    let value = ev.detail.value;

    const newConfig = { ...value };

    // === ОБРАБОТКА ИЗОБРАЖЕНИЯ ===
    if (newConfig.image) {
      if (typeof newConfig.image === 'object' && newConfig.image.media_content_id) {
        newConfig.image = newConfig.image.media_content_id;
      }
    } else if (newConfig.image === '') {
      newConfig.image = 'default';
    }

    for (const [key, val] of Object.entries(newConfig)) {
      if (val === defaultConfig[key]) {
        delete newConfig[key];
      }
    }

    this.config = newConfig;
    fireEvent(this, 'config-changed', { config: this.config });
    
  };

  render() {
    if (!this.hass || !this.config) return nothing;

    const schema = [
      {
        name: 'entity',
        selector: { entity: { domain: ["lawn_mower", "vacuum"] } },
      },
      {
        name: 'camera',
        selector: { entity: { domain: 'camera' } },
        required: false,
      },
      ...(this.config.camera
        ? [
            {
              name: 'camera_view',
              selector: {
                select: { options: ['auto', 'live'], mode: 'dropdown' },
              },
            },
            {
              type: 'grid',
              name: '',
              schema: [
                { name: 'camera_controls', selector: { boolean: {} } },
                { name: 'camera_muted', selector: { boolean: {} } },
              ],
            },
          ]
        : []),
      {
        name: 'image',
        selector: {
          media: {
            accept: ['image/*'],
            clearable: true,
            image_upload: true, // Включает загрузчик изображений
            hide_content_type: true,
          },
        },
      },
      {
        name: 'image_size',
        selector: { number: { min: 1, max: 8, step: 1, mode: 'box' } },
      },
      {
        name: '',
        type: 'expandable',
        title: localize('editor.tab_general'),
        schema: [
          {
            type: 'grid',
            name: '',
            schema: [
              { name: 'show_animation', selector: { boolean: {} } },
              { name: 'image_left', selector: { boolean: {} } },
              { name: 'show_name', selector: { boolean: {} } },
              { name: 'show_status', selector: { boolean: {} } },
              { name: 'show_toolbar', selector: { boolean: {} } },
              { name: 'show_edgecut', selector: { boolean: {} } },
              { name: 'compact_view', selector: { boolean: {} } },
            ],
          },
        ],
      },
    ];

    const data = {
      ...this.config,
      // Упаковываем строку обратно в объект для селектора media
      image: (this.config.image && this.config.image !== 'default') 
             ? { media_content_id: this.config.image } 
             : undefined,
      camera_view: this.config.camera_view ?? defaultConfig.camera_view,
      image_size: this.config.image_size ?? defaultConfig.image_size,
    };

    // Проставляем дефолтные значения булевым флагам, чтобы переключатели не были "пустыми"
    const booleans = [
      'camera_controls',
      'camera_muted',
      'show_animation',
      'image_left',
      'show_name',
      'show_status',
      'show_toolbar',
      'show_edgecut',
      'compact_view',
    ];
    for (const key of booleans) {
      if (data[key] === undefined) {
        data[key] = defaultConfig[key] ?? false;
      }
    }

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <ha-expansion-panel
          .header=${localize('editor.tab_info')}
          outlined
        >
          ${this.renderEntityList('info_card')}
        </ha-expansion-panel>

        <ha-expansion-panel
          .header=${localize('editor.tab_statistics')}
          outlined
        >
          ${this.renderEntityList('statistics_card')}
        </ha-expansion-panel>

        <ha-expansion-panel
          .header=${localize('editor.tab_battery')}
          outlined
        >
          ${this.renderEntityList('battery_card')}
        </ha-expansion-panel>

        <ha-expansion-panel
          .header=${localize('editor.tab_settings')}
          outlined
        >
          ${this.renderEntityList('settings_card', () =>
            this.entitiesForMowerAll(),
          )}
        </ha-expansion-panel>
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

  setConfigValue(key, value) {
    const newConfig = { ...this.config };
    if (value === (defaultConfig[key] ?? false)) {
      delete newConfig[key];
    } else {
      newConfig[key] = value;
    }
    this.config = newConfig;
    fireEvent(this, 'config-changed', { config: this.config });
  }
}
