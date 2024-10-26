import { LitElement, html, css, nothing } from 'lit';
import { hasConfigOrEntityChanged, } from 'custom-card-helpers'; 

class LandroidConfigCard extends LitElement {
  static properties = {
    hass: { type: Object },
    config: { type: Object },
    deviceName: { type: String },
  };

  /**
   * Lifecycle method to handle the component being connected to the DOM.
   *
   * This method is called when the component is connected to the DOM. It is the
   * opposite of `disconnectedCallback`, and is called when the component is
   * added to the DOM. This is a good place to set up any initial state or
   * perform any setup that needs to happen only once.
   *
   * @return {void} This function does not return anything.
   */
  connectedCallback() {
    super.connectedCallback();
  }

  /**
   * Lifecycle method to handle the component being disconnected from the DOM.
   *
   * This method is called when the component is disconnected from the DOM. It
   * is the opposite of `connectedCallback`, and is called when the component is
   * removed from the DOM.
   *
   * @see https://lit.dev/docs/components/lifecycle/#disconnectedcallback
   */
  disconnectedCallback() {
    super.disconnectedCallback();
  }

  /**
   * Lifecycle method that is called after the component has been rendered for the first time.
   *
   * This method sets the `_firstRendered` property to `true`, indicating that the component
   * has completed its first render. It can be used to perform any setup or initialization
   * that depends on the component being fully rendered.
   *
   * @return {void} This function does not return anything.
   */
  firstUpdated() {
    this._firstRendered = true;
  }

  /**
   * Lifecycle method to determine if the component should update when its
   * properties change.
   *
   * This method will return true if the component's configuration or any of its
   * entities have changed. Otherwise, it will return false.
   *
   * @param {Object} changedProps - An object with information about which
   * properties have changed.
   * @return {boolean} True if the component should update, false otherwise.
   */
  shouldUpdate(changedProps) {
    return hasConfigOrEntityChanged(this, changedProps);
  }

  /**
   * Styles for the component.
   *
   * The styles are scoped to the component and are used to style the
   * component's host element. The styles are defined using LitElement's
   * `css` tag function.
   *
   * @return {CSSResult} The styles for the component.
   */
  static get styles() {
    return css`
      :host {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: var(--lc-spacing);
        border-top: 1px solid var(--lc-divider-color);
        border-bottom: 1px solid var(--lc-divider-color);
      }

      /* hui-entities-card */
      #states {
        flex: 1 1 0%;
      }

      #states > * {
        margin: 8px 0px;
      }

      #states > :first-child {
        margin-top: 0px;
      }

      #states > *:last-child {
        margin-bottom: 0;
      }

      #states > div > * {
        overflow: clip visible;
      }

      #states > div {
        position: relative;
      }

      .icon {
        padding: 0px 18px 0px 8px;
      }

      /* hui-input-number-entity-row */
      .flex {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-grow: 2;
      }

      .state {
        min-width: 45px;
        text-align: end;
      }

      .slider {
        flex-grow: 2;
        width: 100px;
        max-width: 200px;
      }

      ha-textfield {
        text-align: end;
      }

      ha-slider {
        width: 100%;
        max-width: 200px;
      }

      /* hui-input-select-entity-row */
      ha-select {
        width: 100%;
        --ha-select-min-width: 0;
      }
    `;
  }

  /**
   * Renders the configuration card UI based on the provided entities.
   *
   * This function checks if the configuration is valid and iterates over the
   * entities to render corresponding components based on their domain type,
   * such as button, number, select, or switch. If the entity's domain is not
   * recognized, it returns nothing. The rendered entities are wrapped in a
   * container with the class "entitiescard".
   *
   * @return {TemplateResult|nothing} The rendered configuration card UI or
   * nothing if the configuration or entities are not provided.
   */
  render() {
    if (!this.config || !this.config.entities) return nothing;

    const entities = this.config.entities.map((entityId) => {
      const domain = entityId.split('.')[0];

      switch (domain) {
        case 'button':
          return this.renderButtonEntity(entityId);
        case 'number':
          return this.renderNumberEntity(entityId);
        case 'select':
          return this.renderSelectEntity(entityId);
        case 'switch':
          return this.renderToggleSwitchEntity(entityId);
        default:
          return nothing;
      }
    });

    return html`
      <div class="entitiescard">
        <div id="states" class="card-content">
          ${entities}
        </div>
      </div>
    `;
  }

/**
 * Renders a button entity row for the provided entity ID.
 *
 * This function retrieves the state object for the given entity ID from Home Assistant,
 * checks if the entity is available, and constructs a configuration object containing
 * the entity ID, a friendly name (excluding the device name), and an icon for display.
 * It returns a lit-html template rendering a generic entity row with a button that,
 * when clicked, triggers the `pressButton` method for the entity. The button is disabled
 * if the entity is unavailable.
 *
 * @param {string} entityId - The ID of the entity to be rendered.
 * @return {TemplateResult|nothing} A lit-html template rendering the button entity row,
 * or `nothing` if the entity is unavailable.
 */
  renderButtonEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    const config = {
      entity: entityId,
      name: stateObj.attributes.friendly_name.replace(`${this.deviceName} `, ''),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        <mwc-button
          @click=${(e) => this.pressButton(e, entityId)}
          .disabled=${stateObj.state === 'unavailable'}
        >
          ${this.hass.localize('ui.card.button.press')}
        </mwc-button>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Renders a number entity row for the provided entity ID.
   *
   * This function retrieves the state object for the given entity ID from Home Assistant,
   * checks if the entity is available, and constructs a configuration object containing
   * the entity ID, a friendly name (excluding the device name), and an icon for display.
   * It returns a lit-html template rendering a generic entity row with either a slider
   * (if the entity is a slider or an auto entity with 256 or fewer steps) or a textfield
   * (otherwise). The slider or textfield is disabled if the entity is unavailable. The
   * value of the slider or textfield is the state of the entity, and the unit of measurement
   * is used as the suffix. When the slider or textfield value changes, the method
   * `numberValueChanged` is called with the event and the state object as arguments.
   *
   * @param {string} entityId - The ID of the entity to be rendered.
   * @return {TemplateResult|nothing} A lit-html template rendering the number entity row,
   * or `nothing` if the entity is unavailable.
   */
  renderNumberEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    const config = {
      entity: entityId,
      name: stateObj.attributes.friendly_name.replace(`${this.deviceName} `, ''),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
      ${stateObj.attributes.mode === 'slider' ||
        (stateObj.attributes.mode === 'auto' &&
          (Number(stateObj.attributes.max) - Number(stateObj.attributes.min)) /
            Number(stateObj.attributes.step) <=
            256)
          ? html`
              <ha-slider
                labeled
                .disabled=${stateObj.state === 'unavailable'}
                .min=${Number(stateObj.attributes.min)}
                .max=${Number(stateObj.attributes.max)}
                .step=${Number(stateObj.attributes.step)}
                .value=${Number(stateObj.state)}
                @change=${(e) => this.numberValueChanged(e, stateObj)}
              ></ha-slider>
              <span class="state">
                ${this.hass.formatEntityState(stateObj)}
              </span>
            `
          : html`
              <div class="flex state">
                <ha-textfield
                  autoValidate
                  .disabled=${stateObj.state === 'unavailable'}
                  pattern="[0-9]+([\\.][0-9]+)?"
                  .step=${Number(stateObj.attributes.step)}
                  .min=${Number(stateObj.attributes.min)}
                  .max=${Number(stateObj.attributes.max)}
                  .value=${stateObj.state}
                  .suffix=${stateObj.attributes.unit_of_measurement}
                  type="number"
                  @change=${(e) => this.numberValueChanged(e, stateObj)}
                ></ha-textfield>
              </div>
            `}
      </hui-generic-entity-row>
    `;
  }

  /**
   * Renders a select entity element for the given entityId.
   *
   * @param {string} entityId - The entityId to render a select element for.
   * @return {TemplateResult} The rendered element as a TemplateResult.
   */
  renderSelectEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    const config = {
      entity: entityId,
      name: stateObj.attributes.friendly_name.replace(`${this.deviceName} `, ''),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config} hideName>
        <ha-select
          .label=${config.name}
          .value=${stateObj.state}
          .disabled=${stateObj.state === 'unavailable'}
          naturalMenuWidth
          @selected=${(e) => this.selectedChanged(e, stateObj)}
          @closed=${(e) => e.stopPropagation()}
          @click=${(e) => e.stopPropagation()}
        >
          ${stateObj.attributes.options
            ? stateObj.attributes.options.map(
                (option) => html`
                  <mwc-list-item .value=${option}>
                    ${this.hass.formatEntityState(stateObj, option)}
                  </mwc-list-item>
                  `,
              )
              : ''}
        </ha-select>
      </hui-generic-entity-row>
      `;
      // ${this.hass.localize(`ui.components.entity.entity-picker.options.${option}`)}
  }

  /**
   * Renders a toggle switch for the given entity ID.
   *
   * @param {string} entityId - The ID of the entity to be rendered.
   * @return {TemplateResult} The rendered toggle switch entity row, or `nothing` if the entity is unavailable.
   */
  renderToggleSwitchEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    const config = {
      entity: entityId,
      name: stateObj.attributes.friendly_name.replace(`${this.deviceName} `, ''),
      icon: stateObj.attributes.icon,
    };

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        <ha-switch
          .label=${stateObj.name}
          .checked=${stateObj.state === 'on'}
          .disabled=${stateObj.state === 'unavailable'}
          @change=${(e) => this.toggleChanged(e, stateObj)}
        ></ha-switch>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Triggers a press action for the specified button entity.
   *
   * This function stops the event propagation and calls the Home Assistant
   * service to perform a press action on the button entity identified by
   * the provided entity ID.
   *
   * @param {Event} e - The event object associated with the button press.
   * @param {string} entity_id - The ID of the button entity to be pressed.
   */
  pressButton(e, entity_id) {
    e.stopPropagation();
    this.hass.callService("button", "press", {
      entity_id,
    });
  }

  /**
   * Handles a change in the value of a number input element
   *
   * This function is called when the user changes the value of a number input
   * element associated with a number entity. It checks if the new value is
   * different from the current state of the entity, and if so, calls the Home
   * Assistant service to update the state of the entity.
   *
   * @param {Event} e - The event object associated with the input change.
   * @param {Object} stateObj - The entity object with the state to be updated.
   */
  numberValueChanged(e, stateObj) {
    if (e.target.value !== stateObj.state) {
      this.hass.callService('number', 'set_value', {
        entity_id: stateObj.entity_id,
        value: e.target.value,
      });
    }
  }

  /**
   * Handles a change in the value of a select input element
   *
   * This function is called when the user changes the value of a select input
   * element associated with a select entity. It checks if the new value is
   * different from the current state of the entity and if the new value is
   * included in the list of options for the entity. If the new value is valid,
   * it calls the Home Assistant service to update the state of the entity.
   *
   * @param {Event} e - The event object associated with the input change.
   * @param {Object} stateObj - The entity object with the state to be updated.
   */
  selectedChanged(e, stateObj) {
    const option = e.target.value;
    if (
      option === stateObj.state ||
      !stateObj.attributes.options.includes(option)
    ) {
      return;
    }

    this.hass.callService('select', 'select_option', {
      entity_id: [stateObj.entity_id],
      option,
    });
  }

  /**
   * Handles a change in the value of a toggle input element
   *
   * This function is called when the user changes the value of a toggle input
   * element associated with a toggle entity. It checks if the new value is
   * different from the current state of the entity, and if so, it calls the
   * Home Assistant service to update the state of the entity.
   *
   * @param {Event} e - The event object associated with the input change.
   * @param {Object} stateObj - The entity object with the state to be updated.
   */
  toggleChanged(e, stateObj) {
    const newState = e.target.checked;
    if (newState === stateObj.state) return;
    this.hass.callService('switch', newState ? 'turn_on' : 'turn_off', {
      entity_id: [stateObj.entity_id],
    }).then(() => {
      this.requestUpdate();
    });
  }

}

customElements.define('lc-config-card', LandroidConfigCard);
