import { LitElement, html, css, nothing } from 'lit';
import localize from '../localize';

const CHEVRON_LEFT = 'M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z';
const CODE_ICON = 'M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z';
const FORM_ICON = 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M19 19H5V5H19V19M17 12H7V10H17V12M13 16H7V14H13V16M17 8H7V6H17V8Z';
const CONTENT_ICON = 'M4,9H20V11H4V9M4,13H14V15H4V13Z';

export class LandroidStatSubElementEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      item: { type: Object },
      _yamlMode: { state: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .ha-header-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        min-height: 48px;
      }
      .ha-header-bar .back-btn {
        margin-left: -8px;
      }
      .ha-header-bar .title {
        font-size: 20px;
        font-weight: 400;
        flex: 1;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ha-header-bar .code-btn {
        margin-right: -8px;
        color: var(--primary-text-color);
      }
      .content {
        padding: 16px 0 8px;
      }
      ha-expansion-panel {
        display: block;
        margin-top: 16px;
      }
      ha-yaml-editor {
        display: block;
      }
    `;
  }

  constructor() {
    super();
    this._yamlMode = false;
  }

  _computeLabelCallback = (schema) => {
    switch (schema.name) {
      case 'entity':
        return this.hass?.localize?.('ui.components.entity.entity-picker.entity') || 'Объект';
      case 'name':
        return this.hass?.localize?.('ui.dialogs.helper_settings.generic.name') || 'Название';
      case 'unit':
        return (
          this.hass?.localize?.('ui.dialogs.helper_settings.input_number.unit_of_measurement') ||
          'Единица измерения'
        );
      case 'attribute':
        return `${this.hass?.localize?.('ui.components.selectors.attribute.attribute') || 'Атрибут'} (${this.hass?.localize?.('ui.panel.lovelace.editor.card.config.optional') || 'опционально'})`;
      case 'template':
        return `Шаблон (${this.hass?.localize?.('ui.panel.lovelace.editor.card.config.optional') || 'опционально'})`;
      default:
        return schema.name;
    }
  };

  _getEntitySchema() {
    return [{ name: 'entity', selector: { entity: {} } }];
  }

  _getContentSchema() {
    return [
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'name', selector: { text: {} } },
          { name: 'unit', selector: { text: {} } },
        ],
      },
      { name: 'attribute', selector: { text: {} } },
      { name: 'template', selector: { template: {} } },
    ];
  }

  _toggleYamlMode() {
    this._yamlMode = !this._yamlMode;
  }

  _valueChanged(ev) {
    ev.stopPropagation();
    const val = ev.detail.value || {};
    const updated = { ...this.item, ...val };

    const cleaned = {};
    for (const [k, v] of Object.entries(updated)) {
      if (v !== '' && v !== undefined && v !== null) {
        cleaned[k] = v;
      }
    }

    this.dispatchEvent(
      new CustomEvent('sub-item-changed', {
        detail: { value: cleaned },
        bubbles: true,
        composed: true,
      })
    );
  }

  _yamlChanged(ev) {
    ev.stopPropagation();
    if (!ev.detail.isValid) return;

    const val = ev.detail.value;
    if (typeof val === 'object' && val !== null) {
      this.dispatchEvent(
        new CustomEvent('sub-item-changed', {
          detail: { value: val },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    if (!this.hass) return nothing;

    const data = this.item || {};

    return html`
      <!-- Хедер в точности по скриншоту 2 -->
      <div class="ha-header-bar">
        <ha-icon-button
          class="back-btn"
          .title=${this.hass?.localize?.('ui.common.back') || 'Назад'}
          @click=${() => this.dispatchEvent(new CustomEvent('go-back', { bubbles: true, composed: true }))}
        >
          <ha-svg-icon .path=${CHEVRON_LEFT}></ha-svg-icon>
        </ha-icon-button>

        <span class="title">
          ${localize('editor.stat_editor_title') || 'Редактор показателя'}
        </span>

        <!-- Кнопка переключения YAML / Визуальный редактор -->
        <ha-icon-button
          class="code-btn"
          .title=${this._yamlMode
            ? (this.hass?.localize?.('ui.panel.lovelace.editor.edit_card.edit_visual') || 'Edit in visual editor')
            : (this.hass?.localize?.('ui.panel.lovelace.editor.edit_card.edit_code') || 'Edit in YAML')}
          @click=${this._toggleYamlMode}
        >
          <ha-svg-icon .path=${this._yamlMode ? FORM_ICON : CODE_ICON}></ha-svg-icon>
        </ha-icon-button>
      </div>

      <!-- В режиме YAML показываем нативный ha-yaml-editor Home Assistant -->
      ${this._yamlMode
        ? html`
            <ha-yaml-editor
              .hass=${this.hass}
              .defaultValue=${data}
              @value-changed=${this._yamlChanged}
            ></ha-yaml-editor>
          `
        : html`
            <!-- Визуальный режим: 1. Поле объекта -->
            <ha-form
              .hass=${this.hass}
              .data=${data}
              .schema=${this._getEntitySchema()}
              .computeLabel=${this._computeLabelCallback}
              @value-changed=${this._valueChanged}
            ></ha-form>

            <!-- 2. Секция содержимого -->
            <ha-expansion-panel outlined expanded>
              <ha-svg-icon slot="leading-icon" .path=${CONTENT_ICON}></ha-svg-icon>
              <div slot="header" role="heading" aria-level="3">
                ${this.hass?.localize?.('ui.panel.lovelace.editor.card.heading.content') || 'Содержимое'}
              </div>
              <div class="content">
                <ha-form
                  .hass=${this.hass}
                  .data=${data}
                  .schema=${this._getContentSchema()}
                  .computeLabel=${this._computeLabelCallback}
                  @value-changed=${this._valueChanged}
                ></ha-form>
              </div>
            </ha-expansion-panel>
          `}
    `;
  }
}

if (!customElements.get('landroid-stat-sub-element-editor')) {
  customElements.define('landroid-stat-sub-element-editor', LandroidStatSubElementEditor);
}