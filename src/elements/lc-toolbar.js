import { LitElement, html, nothing, css } from 'lit';
import * as consts from '../constants';
import { supportsFeature } from '../helpers';
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
        border-top: var(--lc-toolbar-border, 1px solid var(--lc-divider-color));
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
      hass: { type: Object },
      state: { type: String },
      domain: { type: String },
      supportedFeatures: { type: Number },
      entityId: { type: String },
      edgecutEntityId: { type: String },
      showEdgecut: { type: Boolean },
      showToolbar: { type: Boolean },
      settingsEntity: { type: Object },
      showConfigCard: { type: Boolean },
      shortcuts: { type: Array },
      dailyProgress: { type: Object },
    };
  }

  /**
   * Проверяет supported_features для текущего домена.
   * Если битмаска не задана (0/undefined — старые интеграции),
   * кнопки не скрываем (обратная совместимость).
   */
  _can(feature) {
    return supportsFeature(this.domain, this.supportedFeatures, feature);
  }

  _renderButtonsForState() {
    const { state, showEdgecut } = this;

    const startBtn = (label) =>
      this._can('START') || this._can('START_MOWING')
        ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_START}></lc-button>`
        : nothing;
    const pauseBtn = (label) =>
      this._can('PAUSE')
        ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_PAUSE}></lc-button>`
        : nothing;
    const dockBtn = (label) =>
      this._can('DOCK') || this._can('RETURN_HOME')
        ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_DOCK}></lc-button>`
        : nothing;
    const stopBtn = (label) =>
      this._can('STOP')
      ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_STOP}></lc-button>`
      : nothing;
    const locateBtn = (label) =>
      this._can('LOCATE')
        ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_LOCATE}></lc-button>`
        : nothing;
    const cleanSpotBtn = (label) =>
      this._can('CLEAN_SPOT')
        ? html`<lc-button .label=${label} .entityId=${this.entityId} action=${consts.ACTION_CLEAN_SPOT}></lc-button>`
        : nothing;
    const edgecutBtn = (label) =>
      showEdgecut && this.edgecutEntityId
        ? html`<lc-button .label=${label} .entityId=${this.edgecutEntityId} action=${consts.ACTION_EDGECUT}></lc-button>`
        : nothing;

    switch (state) {
      case consts.STATE_MOWING:
      case consts.STATE_EDGECUT:
      case consts.STATE_SEARCHING_ZONE:
      case consts.STATE_STARTING:
      case consts.STATE_ZONING:
      case consts.STATE_ON:
      case consts.STATE_CLEANING:
        return html`${pauseBtn(true)}${stopBtn(true)}${dockBtn(true)}${locateBtn(true)}`;

      case consts.STATE_PAUSED:
        return html`${startBtn(false)}${edgecutBtn(false)}${stopBtn(false)}${dockBtn(false)}${locateBtn(false)}${cleanSpotBtn(false)}`;

      case consts.STATE_DOCKED:
      case consts.STATE_IDLE:
      case consts.STATE_RAINDELAY:
        return html`${startBtn(false)}${edgecutBtn(false)}${locateBtn(false)}${cleanSpotBtn(false)}`;

      case consts.STATE_RETURNING:
        return html`${pauseBtn(false)}${stopBtn(false)}${locateBtn(false)}`;

      case consts.STATE_ERROR:
      case consts.STATE_ESCAPED_DIGITAL_FENCE:
        return html`${dockBtn(false)}${stopBtn(false)}${locateBtn(false)}`;

      default:
        return html`${startBtn(false)}${edgecutBtn(false)}`;
    }
  }

  _renderShortcuts() {
    const shortcuts = this.shortcuts ?? [];
    return shortcuts.map(({ name, icon, action, service, service_data }) => {
      // Обратная совместимость: старый формат → новый
      const resolvedAction =
        action ??
        (service
          ? {
              action: 'perform-action',
              perform_action: service,
              target: service_data?.entity_id
                ? { entity_id: service_data.entity_id }
                : undefined,
              data: Object.fromEntries(
                Object.entries(service_data ?? {}).filter(
                  ([k]) => k !== 'entity_id',
                ),
              ),
            }
          : null);

      if (!resolvedAction) return nothing;

      return html`
        <ha-icon-button
          label="${name}"
          @click="${() =>
            this.dispatchEvent(
              new CustomEvent('lc-shortcut', {
                detail: { action: resolvedAction },
                bubbles: true,
                composed: true,
              }),
            )}"
        >
          <ha-icon icon="${icon}"></ha-icon>
        </ha-icon-button>
      `;
    });
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
                @click="${() =>
                  this.dispatchEvent(
                    new CustomEvent('lc-toggle-config', {
                      bubbles: true,
                      composed: true,
                    }),
                  )}"
              >
                <ha-icon icon="mdi:tools"></ha-icon>
              </ha-icon-button>
            `
          : nothing}
        ${dp
          ? html`
              <lc-linear-progress
                title="${dp.attributes
                  .friendly_name}: ${this.hass.formatEntityState(dp)}"
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
