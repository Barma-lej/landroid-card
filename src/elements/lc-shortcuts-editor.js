import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';

const DRAG_ICON = 'M21 11H3V9H21V11M21 13H3V15H21V13Z';
const EDIT_ICON =
  'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
const DELETE_ICON =
  'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z';
const PLUS_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';

export class LandroidShortcutsEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      config: { type: Object },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .shortcuts-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .badges {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 8px;
      }
      .badge {
        display: flex;
        align-items: center;
        background: var(--card-background-color, #fff);
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: var(--ha-border-radius-sm, 8px);
        padding: 0 8px;
        height: 48px;
        gap: 8px;
        transition: background-color 0.2s ease;
        box-sizing: border-box;
      }
      .badge:hover {
        background: var(--hover-color, rgba(0, 0, 0, 0.04));
      }
      .handle {
        cursor: grab;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        padding: 8px 4px;
      }
      .badge-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        overflow: hidden;
      }
      .badge-content ha-icon {
        color: var(--primary-text-color);
        --mdc-icon-size: 24px;
        flex-shrink: 0;
      }
      .badge-content > div {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .primary-text {
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .secondary-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      ha-button.add-btn {
        align-self: flex-start;
      }
    `;
  }

  _editItem(index) {
    const list = this.config?.shortcuts || [];
    const item = list[index] || {};

    this.dispatchEvent(
      new CustomEvent('open-shortcut-editor', {
        detail: {
          index,
          item,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _addItem() {
    const shortcuts = Array.isArray(this.config?.shortcuts)
      ? [...this.config.shortcuts]
      : [];

    // Создаём пустой объект без предзаполненного действия
    shortcuts.push({});

    fireEvent(this, 'config-changed', {
      config: { ...this.config, shortcuts },
    });

    this._editItem(shortcuts.length - 1);
  }

  _removeItem(index) {
    if (!Array.isArray(this.config?.shortcuts)) return;

    const shortcuts = [...this.config.shortcuts];
    shortcuts.splice(index, 1);

    const newConfig = { ...this.config };
    if (shortcuts.length === 0) {
      delete newConfig.shortcuts;
    } else {
      newConfig.shortcuts = shortcuts;
    }

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  _getSecondaryText(item) {
    if (item.action?.action === 'perform-action') {
      return item.action.perform_action || item.action.service || '';
    }
    if (item.action?.action === 'navigate') {
      return item.action.navigation_path || '';
    }
    if (item.action?.action === 'url') {
      return item.action.url_path || '';
    }
    if (item.action?.action === 'more-info') {
      return item.action.entity || '';
    }
    if (item.service) {
      return item.service;
    }
    return item.action?.action || '';
  }

  render() {
    if (!this.hass || !this.config) return nothing;

    const items = Array.isArray(this.config.shortcuts)
      ? this.config.shortcuts
      : [];

    return html`
      <div class="shortcuts-container">
        <ha-sortable
          handle-selector=".handle"
          @item-moved=${(e) => {
            const { oldIndex, newIndex } = e.detail;
            const shortcuts = [...(this.config?.shortcuts || [])];
            shortcuts.splice(newIndex, 0, shortcuts.splice(oldIndex, 1)[0]);
            fireEvent(this, 'config-changed', {
              config: { ...this.config, shortcuts },
            });
          }}
        >
          <div class="badges">
            ${items.map((item, index) => {
              const defaultTitle = this.hass?.localize?.('ui.panel.lovelace.editor.card.button.name') || 'Button';
              const title = item.name || `${defaultTitle} #${index + 1}`;
            //   const title =
            //     item.name ||
            //     localize('editor.shortcut') ||
            //     `Shortcut #${index + 1}`;
              const sub = this._getSecondaryText(item);

              return html`
                <div class="badge">
                  <div class="handle">
                    <ha-svg-icon .path=${DRAG_ICON}></ha-svg-icon>
                  </div>

                  <div
                    class="badge-content"
                    @click=${() => this._editItem(index)}
                  >
                    <ha-icon .icon=${item.icon || 'mdi:flash'}></ha-icon>
                    <div>
                      <span class="primary-text">${title}</span>
                      ${sub
                        ? html`<span class="secondary-text">${sub}</span>`
                        : nothing}
                    </div>
                  </div>

                  <ha-icon-button
                    class="edit-icon"
                    .title=${this.hass?.localize?.('ui.common.edit') || 'Edit'}
                    @click=${() => this._editItem(index)}
                  >
                    <ha-svg-icon .path=${EDIT_ICON}></ha-svg-icon>
                  </ha-icon-button>

                  <ha-icon-button
                    class="remove-icon"
                    .title=${this.hass?.localize?.('ui.common.delete') || 'Delete'}
                    @click=${() => this._removeItem(index)}
                  >
                    <ha-svg-icon .path=${DELETE_ICON}></ha-svg-icon>
                  </ha-icon-button>
                </div>
              `;
            })}
          </div>
        </ha-sortable>

        <ha-button
          appearance="filled"
          size="s"
          variant="brand"
          class="add-btn"
          @click=${this._addItem}
        >
          <ha-svg-icon slot="start" .path=${PLUS_ICON}></ha-svg-icon>
          ${this.hass?.localize?.('ui.common.add') || 'Add'}
        </ha-button>
      </div>
    `;
  }
}

if (!customElements.get('lc-shortcuts-editor')) {
  customElements.define('lc-shortcuts-editor', LandroidShortcutsEditor);
}