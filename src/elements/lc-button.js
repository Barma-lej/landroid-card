import { LitElement, html, nothing, css } from 'lit';
import * as consts from '../constants';
import localize from '../localize';

class LandroidButton extends LitElement {
  static get styles() {
    return css`
      :host {
        display: contents;
      }

      .tip {
        cursor: pointer;
      }

      ha-icon {
        color: var(--lc-icon-color);
        cursor: pointer;
      }
    `;
  }

  static get properties() {
    return {
      action: { type: String },
      asIcon: { type: Boolean },
      label: { type: Boolean },
      defaultService: { type: String },
      isRequest: { type: Boolean },
      entityId: { type: String },
    };
  }

  _handleClick() {
    this.dispatchEvent(
      new CustomEvent('lc-action', {
        detail: {
          action: this.action,
          defaultService:
            this.defaultService ?? consts.ACTION_BUTTONS[this.action]?.action,
          entity_id: this.entityId,
          isRequest: this.isRequest ?? true,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.action) return nothing;

    const icon = consts.ACTION_BUTTONS[this.action]?.icon;
    const title = localize(`action.${this.action}`);

    if (this.asIcon) {
      return html`
        <div class="tip" title="${title}" @click="${() => this._handleClick()}">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
      `;
    }

    return this.label
      ? html`
          <ha-button
            appearance="plain"
            @click="${() => this._handleClick()}"
            title="${title}"
          >
            <ha-icon icon="${icon}"></ha-icon>
            <span>${title}</span>
          </ha-button>
        `
      : html`
          <ha-icon-button
            label="${title}"
            @click="${() => this._handleClick()}"
          >
            <ha-icon icon="${icon}"></ha-icon>
          </ha-icon-button>
        `;
  }
}

customElements.define('lc-button', LandroidButton);
export default LandroidButton;
