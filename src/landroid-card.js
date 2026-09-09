import { LitElement, html } from 'lit';
import registerTemplates from 'ha-template';
import localize from './localize';
import styles from './styles';
import { version } from '../package.json';
import './landroid-card-editor';
import { getEntityDomain, isSupportedEntity } from './helpers';
import * as consts from './constants';
import { DEFAULT_LANG, defaultConfig } from './defaults';
import LandroidCardEditor from './landroid-card-editor';
import { ActionsMixin } from './card/actions-mixin';
import { DiscoveryMixin } from './card/discovery-mixin';
import { ImageMixin } from './card/image-mixin';
import {
  renderCardName,
  renderCardStatus,
  renderTipButton,
} from './card/card-templates';
import './elements/lc-linear-progress';
import './elements/lc-toolbar';
import './elements/lc-stats';

const editorName = 'landroid-card-editor';
const ALLOWED_LANGS = [
  'en',
  'de',
  'ru',
  'fr',
  'es',
  'nl',
  'pl',
  'it',
  'hu',
  'cs',
  'da',
  'sv',
  'et',
  'sl',
];

customElements.define(editorName, LandroidCardEditor);

registerTemplates();

console.info(
  `%c LANDROID-CARD %c ${version}`,
  'color: white; background: #ec6a36; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 4px 0px 0px 4px;',
  'color: #ec6a36; background: white; font-weight: 700; border: 1px #ec6a36 solid; border-radius: 0px 4px 4px 0px;',
);

class LandroidCard extends ActionsMixin(DiscoveryMixin(ImageMixin(LitElement))) {

  /**
   * Properties of the LandroidCard element
   *
   * @prop {Object} hass - The Home Assistant instance
   * @prop {Object} config - The user configuration for the card
   * @prop {Boolean} requestInProgress - If a request to the API is currently in progress
   * @prop {Boolean} showSettingsCard - If the card should display a configuration button at the top
   */
  static get properties() {
    return {
      hass: Object,
      config: Object,
      requestInProgress: Boolean,
      showSettingsCard: Boolean,
      _entityIds: Array,
      _activeCard: String,
      _resolvedImage: { type: String, state: true },
      _haStateImageReady: Boolean,
    };
  }

  /**
   * The styles for the LandroidCard element
   *
   * @return {CSSResult} The styles for the LandroidCard element
   */
  static get styles() {
    return styles;
  }

  /**
   * Returns a custom element for editing the user configuration.
   * Home Assistant will display this element in the card editor in the dashboard.
   *
   * @return {Element} Custom element for editing the user configuration
   */
  static async getConfigElement() {
    return document.createElement(editorName);
  }

  /**
   * Returns a default card configuration (without the type: parameter)
   * in json form for use by the card type picker in the dashboard.
   *
   * @param {object} hass - The Home Assistant instance.
   * @param {array} entities - The list of entities.
   * @return {object} The default card configuration configuration object with the entity and image properties.
   */
  static getStubConfig(hass, entities) {
    const robotEntities = entities.filter(isSupportedEntity);

    return {
      entity: robotEntities[0] || '',
      _preview: !robotEntities.length, // флаг для setConfig
    };
  }

  /**
   * Returns the entity object from the Home Assistant state based on the provided configuration entity.
   *
   * @return {object|undefined} The entity object from the Home Assistant state, or undefined if the entity does not exist.
   */
  get entity() {
    return this.hass?.states[this.config.entity] || undefined;
  }

  /**
   * Домен основной сущности: 'lawn_mower' или 'vacuum'.
   */
  get entityDomain() {
    return getEntityDomain(this.config?.entity);
  }

  /**
   * Returns the user's selected language code as a string.
   *
   * @return {string} The user's selected language code as a string.
   * @example 'en' for English, 'nl' for Dutch, etc.
   */
  get lang() {
    const storedLanguage = localStorage.getItem('selectedLanguage');
    const rawLang = (
      this.hass?.locale?.language ||
      storedLanguage ||
      DEFAULT_LANG
    )
      .split('-')[0]
      .toLowerCase();

    return ALLOWED_LANGS.includes(rawLang) ? rawLang : DEFAULT_LANG;
  }

  /**
   * Returns 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   *
   * @return {string} 'rtl' if the user's selected language is a right-to-left language, and 'ltr' otherwise.
   */
  get RTL() {
    const langTranslations =
      this.hass.translationMetadata.translations[this.lang];
    return langTranslations?.isRTL ? 'rtl' : 'ltr';
  }

  /**
   * Returns whether or not to show the animation on the card.
   * If the user has not specified the 'show_animation' option in the config,
   * this function returns default value.
   * Otherwise, this function returns the value of the 'show_animation' option.
   *
   * @return {boolean} Whether or not to show the animation on the card.
   */
  get showAnimation() {
    return this.config?.show_animation ?? defaultConfig.show_animation;
  }

  /**
   * Returns whether or not the card should be in compact view mode.
   * If the user has specified 'compact_view: true' in the config,
   * this function returns default value.
   * Otherwise, this function returns false.
   *
   * @return {boolean} Whether or not the card should be in compact view mode.
   */
  get compactView() {
    return this.config?.compact_view ?? defaultConfig.compact_view;
  }

  /**
   * Returns whether or not to show the name of the Landroid on the card.
   * If the user has not specified the 'show_name' option in the config,
   * this function returns default value.
   * Otherwise, this function returns the value of the 'show_name' option.
   *
   * @return {boolean} Whether or not to show the name of the Landroid on the card.
   */
  get showName() {
    return this.config?.show_name ?? defaultConfig.show_name;
  }

  /**
   * Returns whether or not to show the status of the Landroid on the card.
   * If the user has not specified the 'show_status' option in the config,
   * this function returns default value.
   * Otherwise, this function returns the value of the 'show_status' option.
   *
   * @return {boolean} Whether or not to show the status of the Landroid on the card.
   */
  get showStatus() {
    return this.config?.show_status ?? defaultConfig.show_status;
  }

  /**
   * Returns whether or not to show the edgecut button on the card.
   * If the user has not specified the 'show_edgecut' option in the config,
   * this function returns default value.
   * Otherwise, this function returns the value of the 'show_edgecut' option.
   *
   * @return {boolean} Whether or not to show the edgecut button on the card.
   */
  get showEdgecut() {
    return this.config?.show_edgecut ?? defaultConfig.show_edgecut;
  }

  /**
   * Returns whether or not to show the toolbar on the card.
   * If the user has not specified the 'show_toolbar' option in the config,
   * this function returns default value.
   * Otherwise, this function returns the value of the 'show_toolbar' option.
   *
   * @return {boolean} Whether or not to show the toolbar on the card.
   */
  get showToolbar() {
    return this.config?.show_toolbar ?? defaultConfig.show_toolbar;
  }

  /**
   * Sets the configuration for the component.
   *
   * @param {Object} config - The configuration object to be set.
   * @throws {Error} If the configuration does not contain an 'entity' key.
   * @throws {Error} If the configuration contains an 'actions' key with an array value.
   *                  The 'actions' key should be an object, not an array.
   * @return {void} This function does not return anything.
   */
  setConfig(config) {
    this._huiCardCache?.clear?.();

    if (!config.entity && !config._preview) {
      throw new Error(localize('error.missing_entity'));
    }

    const actions = config.actions;
    if (actions && Array.isArray(actions)) {
      console.warn(localize('warning.actions_array'));
    }

    this.config = { ...config, };

    // Инициализируем все карточки как скрытые
    this._activeCard = null;
    this._huiCardCache = new Map(); // сброс кеша при новом конфиге
  }

  /**
   * Returns the size of the card in number of columns.
   * The size depends on the compactView property.
   *
   * @return {number} The size of the card.
   */
  getCardSize() {
    return this.compactView ? 3 : 7;
  }

  /**
   * Indicates if the component should update.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {boolean} True if the component should update, false otherwise.
   */
  shouldUpdate(changedProps) {
    // 1. Внутренние реактивные свойства карточки и конфиг
    if (
      changedProps.has('config') ||
      changedProps.has('_activeCard') ||
      changedProps.has('showSettingsCard') ||
      changedProps.has('requestInProgress') ||
      changedProps.has('_resolvedImage') ||
      changedProps.has('_haStateImageReady')
    ) {
      return true;
    }

    // 2. Если hass не менялся (или изменились любые другие свойства, кроме hass)
    if (!changedProps.has('hass')) {
      return false;
    }

    const oldHass = changedProps.get('hass');
    if (!oldHass) return true;

    // 3. Реакция на смену темы оформления
    if (
      oldHass.themes !== this.hass.themes ||
      oldHass.selectedTheme !== this.hass.selectedTheme
    ) {
      return true;
    }

    // 4. Реакция на смену языка и локали (форматы дат/чисел, тексты)
    if (
      oldHass.language !== this.hass.language ||
      oldHass.locale !== this.hass.locale
    ) {
      return true;
    }

    // 5. Изменение состояния основной сущности
    const entityId = this.config?.entity;
    if (entityId && oldHass.states[entityId] !== this.hass.states[entityId]) {
      return true;
    }

    // 6. Изменение вспомогательных сущностей (сенсоры, кнопки, шорткаты и т.д.)
    if (this._entityIds?.some((id) => oldHass.states[id] !== this.hass.states[id])) {
      return true;
    }

    return false;
  }

  /**
   * Lifecycle method called after the first render.
   * Preloads the standard HA status image element when `image: 'ha'`.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {void}
   */
  firstUpdated(changedProps) {
    if (super.firstUpdated) {
      super.firstUpdated(changedProps);
    }
    if (this.imageMode === 'ha') {
      this._preloadHaStateImage();
    }
  }

  /**
   * Lifecycle method to update the component when its properties change.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {void} This function does not return anything.
   */
  updated(changedProps) {
    const oldHass = changedProps.get('hass');
    const oldEntityState = oldHass?.states[this.config.entity]?.state;
    const newEntityState = this.hass.states[this.config.entity]?.state;

    if (
      oldHass &&
      (oldEntityState !== newEntityState ||
        this.settingsCardEntitiesChanged(changedProps))
    ) {
      this.requestInProgress = false;
    }

    // Обновляем кеш при смене config или первом рендере
    if (changedProps.has('config') || !this._entityIds) {
      this._entityIds = [
        ...(this.settingsCardEntities || []),
        ...Object.values(this.cardEntities).flatMap((card) => card.entities),
      ];
    }

    // Пауза/возобновление анимаций HA-изображения согласно show_animation
    this._syncHaAnimations();
  }

  /**
   * Checks if any of the entities specified in the settings card have changed.
   * This is used to determine if the component should update when its properties change.
   *
   * @param {Map} changedProperties - Map of changed properties.
   * @return {boolean} True if any of the entities specified in the settings card have changed, false otherwise.
   */
  settingsCardEntitiesChanged(changedProperties) {
    const oldHass = changedProperties.get('hass');
    if (!oldHass || !this._entityIds) return false;

    return this._entityIds.some(
      (entityId) =>
        oldHass.states[entityId]?.state !== this.hass.states[entityId]?.state,
    );
  }

  /**
   * Lifecycle method to update the component when it is connected to the DOM.
   *
   * @return {void} This function does not return anything.
   */
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Lifecycle method to clean up when the component is disconnected from the DOM.
   *
   * @return {void} This function does not return anything.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /**
   * Toggles the visibility of the given card type and updates the component to reflect the change.
   *
   * @param {Event} e - The event object.
   * @param {string} cardType - The type of card to toggle.
   * @return {void} This function does not return anything.
   */
  _toggleCardVisibility(e) {
    const cardType = e.currentTarget.dataset.cardType;
    if (cardType) {
      this._activeCard = this._activeCard === cardType ? null : cardType;
    }
  }

  /**
   * Renders a tip button for a given card.
   * label = 0; // none: 0, left: 1 or right: 2
   *
   * @param {string} cardType - The card type.
   * @return {TemplateResult|nothing} The rendered tip button or nothing if the card type is not valid.
   */
  renderTipButton(cardType) {
    return renderTipButton(this, cardType);
  }

  /**
   * Renders the name of the mower.
   *
   * @return {TemplateResult} The rendered name as a lit-html TemplateResult or nothing.
   */
  renderName() {
    return renderCardName(this);
  }

  /**
   * Renders the status of the mower.
   *
   * @return {TemplateResult} The rendered status as a lit-html TemplateResult or nothing.
   */
  renderStatus() {
    return renderCardStatus(this);
  }

  async willUpdate(changedProps) {
    if (super.willUpdate) {
      super.willUpdate(changedProps);
    }
    await this._resolveMediaImage(changedProps);
  }

  /**
   * Renders the HTML template for the component.
   *
   * @return {TemplateResult} The rendered HTML template.
   */
  render() {
    // Режим превью — hass ещё не доступен
    if (!this.hass || !this.config?.entity) {
      return html`
        <ha-card>
          <div class="preview">
            <div class="landroid-wrapper">
              <img
                style="height: ${this.imageSize}px;"
                class="landroid docked"
                src="${this.image}"
              />
            </div>
            <div class="metadata">
              <div class="landroid-name">
                ${this.hass?.localize('component.lawn_mower.entity_component._.name') ?? 'Lawn mower'}
              </div>
            </div>
          </div>
        </ha-card>
      `;
    }

    if (!this.entity || this.entity.state === consts.STATE_UNAVAILABLE) {
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

    const state = this.entity?.attributes?.state || this.entity?.state || '-';

    return html`
      <ha-card>
        <div class="tips">
          ${this.renderTipButton(consts.INFOCARD)}
          ${this.renderTipButton(consts.STATISTICSCARD)}
          ${this.renderTipButton(consts.BATTERYCARD)}
        </div>
        ${Object.entries(this.cardEntities).map(([cardType, card]) =>
          this.renderEntitiesCard(card.entities, this._activeCard === cardType),
        )}
        <div class="preview">
          ${this.renderCameraOrImage(state)}
          <div class="metadata">
            ${this.renderName()} ${this.renderStatus()}
          </div>
          <lc-stats
            style="display: contents;"
            .hass="${this.hass}"
            .stats="${this.config.stats?.[state] ||
            this.config.stats?.default ||
            []}"
            .entityObj="${this.entity}"
            @lc-more-info=${this._handleCustomEvent}
          ></lc-stats>
          <lc-toolbar
            .hass=${this.hass}
            .state=${state}
            .domain=${this.entityDomain}
            .supportedFeatures=${this.entity?.attributes?.supported_features}
            .entityId=${this.config.entity}
            .edgecutEntityId="${this.getEntityByTranslationKey(
              consts.TK_BUTTON_EDGECUT,
            )?.entity_id}"
            .showEdgecut=${this.showEdgecut && this.entityDomain === consts.LAWNMOWER_SERVICE}
            .showToolbar="${this.showToolbar}"
            .settingsEntity="${this.settingsCardEntities}"
            .showSettingsCard="${this.showSettingsCard}"
            .shortcuts="${this.config.shortcuts ?? []}"
            .dailyProgress="${this.getEntityByTranslationKey(
              consts.TK_SENSOR_DAILY_PROGRESS,
            ) || null}"
            @lc-action="${(e) =>
              this.handleAction(e, e.detail.action, e.detail)}"
            @lc-shortcut="${(e) => this.callAction(e.detail.action)}"
            @lc-toggle-config="${() =>
              (this.showSettingsCard = !this.showSettingsCard)}"
          ></lc-toolbar>
        </div>
        ${this.renderEntitiesCard(
          this.settingsCardEntities,
          this.showSettingsCard,
        )}
      </ha-card>
    `;
  }
}

customElements.define('landroid-card', LandroidCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'landroid-card',
  name: localize('common.name'),
  preview: true,
  description: localize('common.description'),
  documentationURL: 'https://github.com/Barma-lej/landroid-card',
  // Landroid card suggestions in the card picker based on entity domain and/or integration
  getEntitySuggestion: (hass, entityId) => {
    if (!isSupportedEntity(entityId)) return null;

    return {
      config: { type: "custom:landroid-card", entity: entityId },
    };
  },
});
