import { LitElement, html, nothing, css } from 'lit';

class LandroidStats extends LitElement {

  static get styles() {
    return css`
      :host {
        display: contents;
      }

      .stats-block {
        cursor: pointer;
        margin: var(--lc-spacing) 0px;
        padding: 0px 2px;
        text-align: center;
        border-right: 1px solid var(--lc-divider-color);
        flex-grow: 1;
      }

      .stats-block:last-of-type {
        border-right: 0px;
      }

      .stats-value {
        color: var(--lc-primary-text-color);
      }

      .stats-subtitle {
        font-size: 12px;
      }
    `;
  }

  static get properties() {
    return {
      hass:       { type: Object },
      stats:      { type: Array },   // уже отфильтрованный список для текущего state
      entityObj:  { type: Object },  // this.entity
    };
  }

  _handleClick(entityId) {
    this.dispatchEvent(
      new CustomEvent('lc-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.stats?.length) return nothing;

    return html`
      ${this.stats.map(({ entity_id, attribute, value_template, unit, subtitle }) => {
        if (!entity_id && !attribute && !value_template) return nothing;

        try {
          const value = entity_id
            ? this.hass.states[entity_id]?.state
            : this.entityObj?.attributes?.[attribute];

          return html`
            <div
              class="stats-block"
              title="${subtitle}"
              @click="${() => this._handleClick(entity_id)}"
            >
              <span class="stats-value">
                <ha-template
                  hass=${this.hass}
                  template=${value_template}
                  value=${value}
                  .variables=${{ value }}
                ></ha-template>
              </span>
              ${unit}
              <div class="stats-subtitle">${subtitle}</div>
            </div>
          `;
        } catch (e) {
          console.warn(e);
          return nothing;
        }
      })}
    `;
  }
}

customElements.define('lc-stats', LandroidStats);
export default LandroidStats;