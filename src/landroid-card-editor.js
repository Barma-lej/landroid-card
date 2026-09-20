import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { defaultConfig } from './defaults';
import { CARD_MAP, DEVICE_CLASS_MAP, SUPPORTED_DOMAINS, STATE_UNAVAILABLE } from './constants';
import style from './style-editor';
import localize from './localize';
import './elements/lc-stats-editor';
import './elements/lc-sub-element-editor';

// mdi:tune
const GENERAL_ICON =
  'M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z';
// mdi:view-grid-plus-outline
const STATS_ICON =
  'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M7 7H9V9H7V7M7 11H9V13H7V11M7 15H9V17H7V15M17 17H11V15H17V17M17 13H11V11H17V13M17 9H11V7H17V9Z';
// mdi:information-outline
const INFO_ICON =
  'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 12,2M11,17H13V11H11V17Z';
// mdi:chart-box-outline
const STATISTICS_ICON =
  'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19M7 10H9V17H7V10M11 7H13V17H11V7M15 13H17V17H15V13Z';
// mdi:battery-charging-medium
const BATTERY_ICON =
  'M12 20H4V6H12M12.67 4H11V2H5V4H3.33C2.6 4 2 4.6 2 5.33V20.67C2 21.4 2.6 22 3.33 22H12.67C13.4 22 14 21.4 14 20.67V5.33C14 4.6 13.4 4 12.67 4M11 16H5V18H11V16M11 13H5V15H11V13M11 10H5V12H11V10M23 10H20V3L15 13H18V21L23 10Z';
// mdi:wrench-outline
const SETTINGS_ICON =
  'M12 20H4V6H12M12.67 4H11V2H5V4H3.33C2.6 4 2 4.6 2 5.33V20.67C2 21.4 2.6 22 3.33 22H12.67C13.4 22 14 21.4 14 20.67V5.33C14 4.6 13.4 4 12.67 4M11 16H5V18H11V16M11 13H5V15H11V13M11 10H5V12H11V10M23 10H20V3L15 13H18V21L23 10Z';

export default class LandroidCardEditor extends LitElement {
  static get styles() {
    return [
      style,
      css`
        .sub-editor-view {
          display: block;
        }
        .main-editor-view[hidden],
        .sub-editor-view[hidden] {
          display: none !important;
        }
      `,
    ];
  }

  static get properties() {
    return {
      hass: {},
      config: {},
      _subElement: { state: true },
      _selectedStatsState: { state: true },
    };
  }

  constructor() {
    super();
    this._subElement = null;
    this._selectedStatsState = 'default';
  }

  _handleOpenStatEditor(ev) {
    this._subElement = ev.detail; // { subKey, index, item }
  }

  /**
   * Проверяет, заполнен ли элемент (хотя бы entity, template или attribute)
   */
  _isValidStatItem(item) {
    if (!item || typeof item !== 'object') return false;
    return Boolean(
      (item.entity && item.entity.trim()) ||
      (item.template && item.template.trim()) ||
      (item.attribute && item.attribute.trim())
    );
  }

  /**
   * Закрывает экран Detail и удаляет пустые элементы (если ничего не заполнено)
   */
  _handleCloseSubEditor() {
    if (this._subElement) {
      const { subKey } = this._subElement;
      const stats = { ...(this.config.stats || {}) };
      const list = Array.isArray(stats[subKey]) ? [...stats[subKey]] : [];

      // Отфильтровываем пустые элементы
      const cleanList = list.filter((item) => this._isValidStatItem(item));

      const newConfig = { ...this.config };
      if (cleanList.length === 0) {
        delete stats[subKey];
      } else {
        stats[subKey] = cleanList;
      }

      if (Object.keys(stats).length === 0) {
        delete newConfig.stats;
      } else {
        newConfig.stats = stats;
      }

      this.config = newConfig;
      fireEvent(this, 'config-changed', { config: this.config });
    }

    this._subElement = null;
  }

  _handleSubItemChanged(e) {
    if (!this._subElement) return;
    const { subKey, index } = this._subElement;
    const stats = { ...(this.config.stats || {}) };
    const list = [...(stats[subKey] || [])];

    list[index] = e.detail.value;
    stats[subKey] = list;

    this.config = { ...this.config, stats };
    fireEvent(this, 'config-changed', { config: this.config });
  }

  /**
   * Sets the configuration for the component.
   *
   * @param {Object} config - The configuration object to be set.
   * @return {void} This function does not return anything.
   */
  setConfig(config) {
    const hasPreview = '_preview' in config;
    const statsNeedMigration = this._needsStatsMigration(config.stats);

    this.config = { ...config };
    delete this.config._preview;

    // Если структура stats устарела — сразу приводим к новому виду
    if (statsNeedMigration) {
      this.config.stats = this._migrateStats(this.config.stats);
    }

    // Если удалили _preview или обновили структуру stats —
    // сразу отправляем в Home Assistant чистый конфиг в современном формате
    if (hasPreview || statsNeedMigration) {
      fireEvent(this, 'config-changed', { config: this.config });
    }
  }

  /**
   * Checks for deprecated keys (entity_id, subtitle, value_template)
   * To remove in v2027.09
   * 
   * @param {Object} stats - The stats object to check for migration.
   * @return {boolean} Returns true if migration is needed, false otherwise.
   */
  _needsStatsMigration(stats) {
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) return false;

    return Object.values(stats).some((items) =>
      Array.isArray(items) &&
      items.some((i) => i && ('entity_id' in i || 'subtitle' in i || 'value_template' in i))
    );
  }

  /**
   * Migrates the stats configuration to the modern flat format
   * To remove in v2027.09
   * 
   * @param {Object} stats - The stats object to migrate.
   * @return {Object} Returns the migrated stats object.
   */
  _migrateStats(stats) {
    if (!stats || typeof stats !== 'object') return stats;

    const result = {};
    for (const [stateKey, list] of Object.entries(stats)) {
      if (!Array.isArray(list)) continue;
      result[stateKey] = list.map((item) => ({
        entity: item.entity || item.entity_id || '',
        ...(item.attribute ? { attribute: item.attribute } : {}),
        ...(item.name ?? item.subtitle ? { name: item.name ?? item.subtitle } : {}),
        ...(item.unit ? { unit: item.unit } : {}),
        ...(item.template || item.value_template
          ? { template: item.template || item.value_template }
          : {}),
      }));
    }
    return result;
  }

  defaultEntitiesForCard(cardType) {
    const card = CARD_MAP[cardType];
    if (!card || !this.hass?.entities) return [];

    const deviceId = this.hass.entities[this.config.entity]?.device_id;
    if (!deviceId) return [];

    const deviceEntities = Object.values(this.hass.entities).filter(
      (e) => e.device_id === deviceId,
    );
    const isAvailable = (id) => {
      const s = this.hass.states[id];
      return s && s.state !== STATE_UNAVAILABLE;
    };

    // 1. По translation_key (Landroid Cloud)
    const byTK = (card.translationKeys ?? [])
      .map((tk) => deviceEntities.find((e) => e.translation_key === tk))
      .filter(Boolean)
      .map((e) => e.entity_id)
      .filter(isAvailable);
    if (byTK.length) return byTK;

    // 2. Fallback по device_class (Mammotion, Husqvarna, vacuum-интеграции)
    const dcList = DEVICE_CLASS_MAP[cardType] ?? [];
    return deviceEntities
      .filter((e) => {
        if (!isAvailable(e.entity_id)) return false;
        const dc =
          this.hass.states[e.entity_id].attributes.device_class ??
          e.device_class ??
          e.original_device_class;
        return dc && dcList.includes(dc);
      })
      .map((e) => e.entity_id)
      .sort();
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

  /**
   * Current image source for the editor form:
   * 'ha' (standard HA image), 'default' (bundled) or 'custom' (user file).
   *
   * @return {string} The image source.
   */
  get _imageSource() {
    // Явно сохранённый 'custom' имеет приоритет: без этого выбор
    // «Custom image» без загруженного файла «отскакивает» обратно на 'ha'
    if (this.config?.image_source === 'custom') {
      return 'custom';
    }
    const image = this.config?.image;
    if (!image || image === 'ha') return 'ha';
    if (image === 'default') return 'default';
    return 'custom';
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

    // === ОБРАБОТКА ИСТОЧНИКА ИЗОБРАЖЕНИЯ (HA-стандарт / бандл / своё) ===
    if ('image_source' in newConfig) {
      const source = newConfig.image_source;
      if (source === 'ha') {
        newConfig.image = 'ha';
        delete newConfig.image_source; // производное значение — в конфиг не пишем
      } else if (source === 'default') {
        newConfig.image = 'default';
        delete newConfig.image_source; // производное значение — в конфиг не пишем
      } else if (source === 'custom') {
        // 'custom' храним явно: иначе dropdown «отскакивает» на 'ha',
        // потому что производное значение = image без URL
        newConfig.image_source = 'custom';
        if (
          !newConfig.image ||
          (typeof newConfig.image === 'string' &&
            (newConfig.image === 'ha' || newConfig.image === 'default'))
        ) {
          newConfig.image = 'default'; // ждём файл от пользователя — пока бандл
        }
      }
    }

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

    const subKey = this._subElement?.subKey;
    const subIndex = this._subElement?.index;
    const subItem =
      subKey !== undefined && subIndex !== undefined
        ? this.config.stats?.[subKey]?.[subIndex] || {}
        : null;

    // Режим Master (все аккордеоны карточки)
    const schema = [
      {
        name: 'entity',
        selector: { entity: { domain: SUPPORTED_DOMAINS } },
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
        name: 'image_source',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'ha', label: localize('editor.image_ha') },
              { value: 'default', label: localize('editor.image_default') },
              { value: 'custom', label: localize('editor.image_custom') },
            ],
          },
        },
      },
      ...(this._imageSource === 'custom'
        ? [
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
          ]
        : []),
      {
        name: 'image_size',
        selector: { number: { min: 1, max: 8, step: 1, mode: 'box' } },
      },
      {
        name: '',
        type: 'expandable',
        title: localize('editor.tab_general'),
        iconPath: GENERAL_ICON,
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
      image: (this.config.image && this.config.image !== 'default' && this.config.image !== 'ha')
             ? { media_content_id: this.config.image }
             : undefined,
      image_source: this._imageSource,
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
      <!-- 1. Экран редактирования подэлемента (Detail) -->
      ${subItem
        ? html`
            <div class="sub-editor-view" ?hidden=${!this._subElement}>
              <landroid-stat-sub-element-editor
                .hass=${this.hass}
                .item=${subItem}
                @sub-item-changed=${this._handleSubItemChanged}
                @go-back=${this._handleCloseSubEditor}
              ></landroid-stat-sub-element-editor>
            </div>
          `
        : nothing}

      <!-- 2. Главный экран карточки (Master) НЕ уничтожается, а просто скрывается -->
      <div class="card-config main-editor-view" ?hidden=${Boolean(this._subElement)}>
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>

        <!-- Блок Stats с сохранением открытого состояния -->
        <ha-expansion-panel .header=${localize('editor.tab_stats')} outlined>
          <ha-svg-icon slot="leading-icon" .path=${STATS_ICON}></ha-svg-icon>
          <div class="content" style="padding-top: 8px;">
            <lc-stats-editor
              .hass=${this.hass}
              .config=${this.config}
              .selectedState=${this._selectedStatsState}
              @stats-state-changed=${(e) => (this._selectedStatsState = e.detail.value)}
              @open-stat-editor=${this._handleOpenStatEditor}
            ></lc-stats-editor>
          </div>
        </ha-expansion-panel>

        <ha-expansion-panel .header=${localize('editor.tab_info')} outlined>
          <ha-svg-icon slot="leading-icon" .path=${INFO_ICON}></ha-svg-icon>
          ${this.renderEntityList('info_card')}
        </ha-expansion-panel>

        <ha-expansion-panel .header=${localize('editor.tab_statistics')} outlined>
          <ha-svg-icon slot="leading-icon" .path=${STATISTICS_ICON}></ha-svg-icon>
          ${this.renderEntityList('statistics_card')}
        </ha-expansion-panel>

        <ha-expansion-panel .header=${localize('editor.tab_battery')} outlined>
          <ha-svg-icon slot="leading-icon" .path=${BATTERY_ICON}></ha-svg-icon>
          ${this.renderEntityList('battery_card')}
        </ha-expansion-panel>

        <ha-expansion-panel .header=${localize('editor.tab_settings')} outlined>
           <ha-svg-icon slot="leading-icon" .path=${SETTINGS_ICON}></ha-svg-icon>
         ${this.renderEntityList('settings_card', () => this.entitiesForMowerAll())}
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