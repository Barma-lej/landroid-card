import { LitElement, html, css, nothing } from 'lit';

class LandroidConfigCard extends LitElement {
  static properties = {
    hass: { type: Object },
    config: { type: Object },
    deviceName: { type: String },
  };

  /**
   * Lifecycle method to update the component when it is connected to the DOM.
   *
   * Calls the LitElement `connectedCallback` method.
   *
   * @return {void} This function does not return anything.
   * @see https://lit.dev/docs/components/lifecycle/#connectedcallback
   */
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('hass-updated', () => this.requestUpdate());
  }

  /**
   * Lifecycle method to clean up when the component is disconnected from the DOM.
   *
   * Calls the LitElement `disconnectedCallback` method.
   *
   * @return {void} This function does not return anything.
   * @see https://lit.dev/docs/components/lifecycle/#disconnectedcallback
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('hass-updated', () => this.requestUpdate());
  }

  /**
   * Lifecycle method to update the component after the first render.
   *
   * This function is called automatically by LitElement after the component
   * has been rendered for the first time. It sets the `_firstRendered` property
   * of the component to `true`, indicating that the component has been rendered
   * at least once.
   *
   * @return {void} This function does not return a value.
   * @see https://lit.dev/docs/components/lifecycle/#firstupdated
   */
  firstUpdated() {
    this._firstRendered = true;
  }

  /**
   * Lifecycle method to indicate if the component should update.
   *
   * This method is called every time a property of the component changes.
   * It is used to determine if the component should re-render when a property
   * value changes.
   *
   * @param {Map} changedProps - Map of changed properties.
   *
   * @return {void} This function does not return a value.
   * @see https://lit.dev/docs/components/lifecycle/#updated
   */
  updated(changedProps) {
    if (changedProps.has('hass')) {
      console.log('Объект hass обновлен:', this.hass);
      this.requestUpdate(); // Обновляем компонент при каждом изменении `hass`
    }
  }

  /**
   * Lifecycle method to indicate if the component should update.
   *
   * This method is called by LitElement whenever a property of the component
   * changes. It returns `true` if the component should update, and `false`
   * otherwise.
   *
   * We update the component if the `hass`, `config`, or `deviceName` properties
   * change.
   *
   * @param {Map} changedProps - Map of changed properties.
   * @return {boolean} True if the component should update, false otherwise.
   * @see https://lit.dev/docs/components/lifecycle/#shouldupdate
   */
  shouldUpdate(changedProps) {
    return (
      changedProps.has('hass') ||
      changedProps.has('config') ||
      changedProps.has('deviceName')
    );
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
        padding: var(--lc-spacing);
        border-top: 1px solid var(--lc-divider-color);
      }

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

      ha-select {
        width: 100%;
      }
    `;
  }

  /**
   * Renders the UI for the LandroidConfigCard component based on the current configuration.
   *
   * This function checks if the configuration and its entities are present.
   * It then maps over the entities and renders the appropriate elements
   * depending on the domain of each entity (button, number, select, switch).
   * The rendered elements are wrapped inside a div with the id "states".
   *
   * @return {TemplateResult|nothing} The rendered HTML template or `nothing` if no config is available.
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
      <div id="states">
        ${entities}
      </div>
    `;
  }

  /**
   * Renders a button for a given button entity in the LandroidConfigCard UI.
   *
   * @param {string} entityId - The ID of the button entity to be rendered.
   * @return {TemplateResult|nothing} The rendered HTML template for the button or `nothing` if the entity is unavailable.
   */
  renderButtonEntity(entityId) {
    const stateObj = this.hass?.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${this.configForEntity(entityId)}>
        <mwc-button
          @click=${() => this.pressButton(entityId)}
          .disabled=${stateObj.state === 'unavailable'}
        >
          ${this.hass.localize('ui.card.button.press')}
        </mwc-button>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Renders a number input for a given number entity in the LandroidConfigCard UI.
   *
   * @param {string} entityId - The ID of the number entity to be rendered.
   * @return {TemplateResult|nothing} The rendered HTML template for the number input
   *   or `nothing` if the entity is unavailable.
   */
  renderNumberEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${this.configForEntity(entityId)}>
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
   * Renders a select for a given entity in the UI.
   *
   * @param {string} entityId - The entity to render a select for.
   * @return {TemplateResult} The rendered select as a TemplateResult.
   */
  renderSelectEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;
    const config = this.configForEntity(entityId);

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
  }

  /**
   * Renders a toggle switch for a given entity in the UI.
   *
   * @param {string} entityId - The entity to render a toggle switch for.
   * @return {TemplateResult} The rendered toggle switch as a TemplateResult.
   */
  renderToggleSwitchEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable') return nothing;

    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${this.configForEntity(entityId)}>
        <ha-switch
          .checked=${stateObj.state === 'on'}
          @change=${(e) => this.toggleChanged(e, stateObj)}
        ></ha-switch>
      </hui-generic-entity-row>
    `;
  }

  /**
   * Generates a configuration object for a given entity.
   *
   * @param {string} entityId - The ID of the entity to generate the configuration for.
   * @return {Object} A configuration object containing the entity ID, 
   *                  the entity's name without the device name, and the entity's icon.
   */
  configForEntity(entityId) {
    const stateObj = this.hass.states[entityId];
    return {
      entity: entityId,
      name: stateObj.attributes.friendly_name.replace(`${this.deviceName} `, ''),
      icon: stateObj.attributes.icon,
    };
  }

  /**
   * Invokes the 'press' service call for a button entity.
   *
   * @param {string} entityId - The ID of the button entity to be pressed.
   * @return {void} This function does not return anything.
   */
  pressButton(entityId) {
    this.hass.callService("button", "press", { entity_id: entityId });
    this.requestUpdate();
  }

  /**
   * Invokes the 'set_value' service call for a number entity
   * if the value of the input element is different from the current state of the entity.
   *
   * @param {Event} e - The event that triggered this function.
   * @param {Object} stateObj - The state object of the entity.
   * @return {void} This function does not return anything.
   */
  numberValueChanged(e, stateObj) {
    const value = e.target.value;
    if (value !== stateObj.state) {
      this.hass.callService("number", "set_value", {
        entity_id: stateObj.entity_id,
        value,
      });
      this.requestUpdate();
    }
  }

  /**
   * Handles the change event for a select element in the UI, updating the entity state if a new option is selected.
   *
   * @param {Event} e - The event triggered by the select element.
   * @param {Object} stateObj - The state object of the entity.
   * @return {void} This function does not return anything.
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
    this.requestUpdate();
  }

  /**
   * Handles the change event for a switch element in the UI, updating the entity state if the switch is toggled.
   *
   * @param {Event} e - The event triggered by the switch element.
   * @param {Object} stateObj - The state object of the entity.
   * @return {void} This function does not return anything.
   */
  toggleChanged(e, stateObj) {
    const newState = e.target.checked ? "on" : "off";
    if (newState !== stateObj.state) {
      this.hass.callService("switch", newState === "on" ? "turn_on" : "turn_off", {
        entity_id: stateObj.entity_id,
      });
      this.requestUpdate();
    }
  }

}

customElements.define('lc-config-card', LandroidConfigCard);
