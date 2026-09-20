import { LitElement, html, css, nothing } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { DOMAIN_STATES, COMMON_STATES, STATE_UNAVAILABLE } from '../constants';
import localize from '../localize';

const DRAG_ICON = 'M21 11H3V9H21V11M21 13H3V15H21V13Z';
const EDIT_ICON = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
const DELETE_ICON = 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z';
const PLUS_ICON = 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';

export class LandroidStatsEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      config: { type: Object },
      selectedState: { type: String },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .stats-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
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
      .badge-content state-badge {
        --mdc-icon-size: 20px;
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

  get _domain() {
    return this.config?.entity?.split('.')[0] || 'lawn_mower';
  }

  get _activeState() {
    return this.selectedState || 'default';
  }

  _getStateOptions() {
    const statesObj = (DOMAIN_STATES && DOMAIN_STATES[this._domain]) || COMMON_STATES || {};
    const options = [
      { value: 'default', label: `${localize('editor.default') || 'Default'} (fallback)` },
    ];

    for (const val of Object.values(statesObj)) {
      if (val === STATE_UNAVAILABLE) continue;

      const label =
        this.hass?.localize?.(`component.${this._domain}.entity_component._.state.${val}`) ||
        localize(`state.${val}`) ||
        val.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

      options.push({ value: val, label });
    }
    return options;
  }

  _handleStateSelect(ev) {
    fireEvent(this, 'stats-state-changed', { value: ev.detail.value });
  }

  _editItem(index) {
    const stateKey = this._activeState;
    const item = this.config?.stats?.[stateKey]?.[index] || {};

    this.dispatchEvent(
      new CustomEvent('open-stat-editor', {
        detail: {
          subKey: stateKey,
          index,
          item,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  _addItem() {
    const stateKey = this._activeState;
    const stats = { ...(this.config?.stats || {}) };
    const list = Array.isArray(stats[stateKey]) ? [...stats[stateKey]] : [];

    list.push({ entity: '', name: '', unit: '' });
    stats[stateKey] = list;

    fireEvent(this, 'config-changed', { config: { ...this.config, stats } });
    this._editItem(list.length - 1);
  }

  _removeItem(index) {
    const stateKey = this._activeState;
    const stats = { ...(this.config?.stats || {}) };
    if (!Array.isArray(stats[stateKey])) return;

    const list = [...stats[stateKey]];
    list.splice(index, 1);

    const newConfig = { ...this.config };
    if (list.length === 0) {
      delete stats[stateKey];
    } else {
      stats[stateKey] = list;
    }

    if (Object.keys(stats).length === 0) {
      delete newConfig.stats;
    } else {
      newConfig.stats = stats;
    }

    fireEvent(this, 'config-changed', { config: newConfig });
  }

  render() {
    if (!this.hass || !this.config) return nothing;

    const activeState = this._activeState;
    const stats = this.config.stats || {};
    const items = Array.isArray(stats[activeState]) ? stats[activeState] : [];

    return html`
      <div class="stats-container">
        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              options: this._getStateOptions(),
            },
          }}
          .label=${this.hass?.localize?.('ui.dialogs.entity_registry.editor.state') || 'State'}
          .value=${activeState}
          @value-changed=${this._handleStateSelect}
        ></ha-selector>

        <ha-sortable
          handle-selector=".handle"
          @item-moved=${(e) => {
            const { oldIndex, newIndex } = e.detail;
            const curStats = { ...(this.config?.stats || {}) };
            const list = [...(curStats[activeState] || [])];
            list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
            curStats[activeState] = list;
            fireEvent(this, 'config-changed', { config: { ...this.config, stats: curStats } });
          }}
        >
          <div class="badges">
            ${items.map((item, index) => {
              const entityObj = item.entity ? this.hass?.states?.[item.entity] : null;
              const title = item.name || entityObj?.attributes?.friendly_name || item.entity || `#${index + 1}`;
              const sub = item.unit ? `${item.entity || ''} (${item.unit})` : item.entity || '';

              return html`
                <div class="badge">
                  <div class="handle">
                    <ha-svg-icon .path=${DRAG_ICON}></ha-svg-icon>
                  </div>

                  <div class="badge-content" @click=${() => this._editItem(index)}>
                    ${item.entity
                      ? html`
                          <state-badge
                            .hass=${this.hass}
                            .stateObj=${entityObj}
                            .stateColor=${true}
                          ></state-badge>
                        `
                      : nothing}
                    <div>
                      <span class="primary-text">${title}</span>
                      ${sub ? html`<span class="secondary-text">${sub}</span>` : nothing}
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

        <ha-button appearance="filled" size="s" variant="brand" class="add-btn" @click=${this._addItem}>
          <ha-svg-icon slot="start" .path=${PLUS_ICON}></ha-svg-icon>
          ${localize('editor.add_stat') || 'Add Stat'}
        </ha-button>
      </div>
    `;
  }
}

if (!customElements.get('lc-stats-editor')) {
  customElements.define('lc-stats-editor', LandroidStatsEditor);
}