import { LitElement, html, nothing, css } from 'lit';
import * as consts from '../constants';
import localize from '../localize';
import './lc-button';
import './lc-linear-progress';

class LandroidToolbar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: contents;
      }

      .toolbar {
        min-height: 30px;
        display: flex;
        flex-direction: row;
        flex-flow: row wrap;
        flex-wrap: wrap;
        justify-content: space-evenly;
        padding: 5px;
        border-top: 1px solid var(--lc-divider-color);
      }

      .toolbar ha-icon-button {
        color: var(--lc-toolbar-text-color);
        flex-direction: column;
      }

      .toolbar ha-icon-button ha-icon {
        display: flex;
        align-items: center;
      }

      .toolbar ha-button {
        color: var(--lc-toolbar-text-color);
        display: flex;
        align-items: center;
        margin-right: 5px;
      }

      .toolbar ha-button ha-icon {
        margin-right: 5px;
        color: var(--lc-toolbar-icon-color);
      }

      .toolbar ha-button span {
        color: var(--lc-toolbar-text-color);
        display: flex;
        align-items: center;
      }

      .toolbar ha-icon,
      .toolbar ha-icon-button ha-icon {
        color: var(--lc-toolbar-icon-color);
        display: flex;
      }

      .fill-gap {
        flex-grow: 1;
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.style.display = 'contents';
  }

  static get properties() {
    return {
      hass:          { type: Object },
      state:         { type: String },
      showEdgecut:   { type: Boolean },
      showToolbar:   { type: Boolean },
      settingsEntity: { type: Object },
      showConfigCard: { type: Boolean },
      shortcuts:     { type: Array },
      dailyProgress: { type: Object },
    };
  }

  _renderButtonsForState() {
    const { state, showEdgecut } = this;
    switch (state) {
      case consts.STATE_EDGECUT:
      case consts.STATE_INITIALIZING:
      case consts.STATE_MOWING:
      case consts.STATE_SEARCHING_ZONE:
      case consts.STATE_STARTING:
      case consts.STATE_ZONING:
        return html`
          <lc-button action="${consts.ACTION_PAUSE}" .label="${true}"></lc-button>
          <lc-button action="${consts.ACTION_DOCK}"  .label="${true}"></lc-button>
        `;

      case consts.STATE_PAUSED:
        return html`
          <lc-button action="${consts.ACTION_MOWING}"  .label="${true}"></lc-button>
          ${showEdgecut ? html`<lc-button action="${consts.ACTION_EDGECUT}" .label="${true}"></lc-button>` : nothing}
          <lc-button action="${consts.ACTION_DOCK}"    .label="${true}"></lc-button>
        `;

      case consts.STATE_RETURNING:
        return html`
          <lc-button action="${consts.ACTION_MOWING}"></lc-button>
          <lc-button action="${consts.ACTION_PAUSE}"></lc-button>
        `;

      default:
        return html`
          <lc-button action="${consts.ACTION_MOWING}"></lc-button>
          ${showEdgecut ? html`<lc-button action="${consts.ACTION_EDGECUT}"></lc-button>` : nothing}
          ${state === 'idle' ? html`<lc-button action="${consts.ACTION_DOCK}"></lc-button>` : nothing}
        `;
    }
  }

  _renderShortcuts() {
    const shortcuts = this.shortcuts ?? [];
    return html`
      ${shortcuts.map(({ name, service, icon, service_data }) => html`
        <ha-icon-button
          label="${name}"
          @click="${() => this.dispatchEvent(new CustomEvent('lc-shortcut', {
            detail: { service, service_data },
            bubbles: true,
            composed: true,
          }))}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </ha-icon-button>
      `)}
    `;
  }

  render() {
    if (!this.showToolbar) return nothing;

    const dp = this.dailyProgress;

    return html`
      <div class="toolbar">
        ${this._renderButtonsForState()}
        <div class="fill-gap"></div>
        ${this._renderShortcuts()}
        ${this.settingsEntity
          ? html`
              <ha-icon-button
                label="${localize('action.config')}"
                @click="${() => this.dispatchEvent(new CustomEvent('lc-toggle-config', { bubbles: true, composed: true }))}"
              >
                <ha-icon icon="mdi:tools"></ha-icon>
              </ha-icon-button>
            `
          : nothing}
        ${dp
          ? html`
              <lc-linear-progress
                title="${dp.attributes.friendly_name}: ${this.hass.formatEntityState(dp)}"
                aria-hidden="true"
                role="progressbar"
                progress="${dp.state || 0}"
              ></lc-linear-progress>
            `
          : nothing}
      </div>
    `;
  }
}

customElements.define('lc-toolbar', LandroidToolbar);
export default LandroidToolbar;