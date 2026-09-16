import { LitElement, html, nothing, css } from 'lit';

class LandroidStats extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      stats: { attribute: false },
      state: { type: String },
      _rendered: { state: true },
    };
  }

  static get styles() {
    return css`
      :host {
        display: contents;
      }
      .stats {
        border-top: 1px solid var(--lc-divider-color);
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;
        padding: var(--lc-spacing) 0;
        color: var(--lc-secondary-text-color);
        overflow: clip;
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
      .stats-title {
        color: var(--lc-secondary-text-color);
        font-size: 12px;
        text-transform: capitalize;
      }
    `;
  }

  constructor() {
    super();
    this._rendered = {};
    this._unsubscribes = new Map();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupSubscriptions();
  }

  _cleanupSubscriptions() {
    for (const unsubPromise of this._unsubscribes.values()) {
      unsubPromise.then((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    }
    this._unsubscribes.clear();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      changedProperties.has('stats') ||
      changedProperties.has('state') ||
      changedProperties.has('hass')
    ) {
      this._updateSubscriptions();
    }
  }

  /**
   * Возвращает активный список статов для текущего состояния:
   * 1. Приоритет: группа по текущему state (например, 'mowing')
   * 2. Fallback: группа 'default'
   */
  _getActiveStats() {
    if (!this.stats || typeof this.stats !== 'object') return [];

    const currentState = this.state || 'default';
    const stateItems = this.stats[currentState];

    if (Array.isArray(stateItems) && stateItems.length > 0) {
      return stateItems;
    }

    const defaultItems = this.stats['default'];
    return Array.isArray(defaultItems) ? defaultItems : [];
  }

  _updateSubscriptions() {
    if (!this.hass?.connection) return;

    const activeList = this._getActiveStats();
    const activeKeys = new Set();

    activeList.forEach((item, index) => {
      const entityId = item.entity || item.entity_id;
      const template = item.template || item.value_template;
      const key = `${entityId || 'stat'}_${index}`;
      activeKeys.add(key);

      if (!template) return;

      // Если подписка уже существует для этого ключа — не пересоздаём её
      if (this._unsubscribes.has(key)) return;

      const entityState = entityId ? this.hass.states[entityId] : null;
      const val = item.attribute && entityState?.attributes
        ? entityState.attributes[item.attribute]
        : entityState?.state;

      const unsubPromise = this.hass.connection.subscribeMessage(
        (msg) => {
          this._rendered = {
            ...this._rendered,
            [key]: msg.result,
          };
        },
        {
          type: 'render_template',
          template: template,
          variables: {
            value: val,
            entity: entityId,
          },
        }
      );

      this._unsubscribes.set(key, unsubPromise);
    });

    // Отписываемся от элементов, которые перестали показываться
    for (const [key, unsubPromise] of this._unsubscribes.entries()) {
      if (!activeKeys.has(key)) {
        unsubPromise.then((unsub) => {
          if (typeof unsub === 'function') unsub();
        });
        this._unsubscribes.delete(key);
      }
    }
  }

  _handleMore(entityId) {
    if (!entityId) return;

    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId },
      })
    );
  }

  render() {
    const items = this._getActiveStats();
    if (!items.length) return nothing;

    return html`
      <div class="stats">
        ${items.map((item, index) => {
          const entityId = item.entity || item.entity_id;
          const template = item.template || item.value_template;
          const key = `${entityId || 'stat'}_${index}`;
          const title = item.name ?? item.subtitle ?? '';
          const unit = item.unit || '';

          const entityState = entityId ? this.hass?.states[entityId] : null;
          const rawValue = item.attribute && entityState?.attributes
            ? entityState.attributes[item.attribute]
            : entityState?.state;

          const displayValue = template
            ? (this._rendered[key] !== undefined ? this._rendered[key] : (rawValue ?? '-'))
            : (rawValue ?? '-');

          return html`
            <div
              class="stats-block"
              data-entity-id=${entityId || ''}
              @click=${() => this._handleMore(entityId)}
            >
              <span class="stats-value">${displayValue} ${unit}</span>
              ${title ? html`<div class="stats-title">${title}</div>` : nothing}
            </div>
          `;
        })}
      </div>
    `;
  }
}

if (!customElements.get('lc-stats')) {
  customElements.define('lc-stats', LandroidStats);
}