// Действия карты: вызовы сервисов HA, пользовательские actions, more-info.
// Миксин: `this` — экземпляр карты (LitElement).

import { fireEvent } from 'custom-card-helpers';
import * as consts from '../constants';
import { resolveService } from '../helpers';
import { version } from '../../package.json';

export const ActionsMixin = (superClass) =>
  class extends superClass {
    /**
     * Handles the "More Info" action for a given entity.
     * If the `entityId` is an instance of an Event, it retrieves the `entityId`
     * from the `dataset` of the event's current target.
     *
     * @param {string|Event} [entityId=this.entity?.entity_id] - The ID of the entity.
     * @returns {void}
     */
    handleMore(entityId = this.entity?.entity_id) {
      // Если вызвано из обработчика клика (Lit передаёт Event)
      if (entityId instanceof Event) {
        entityId =
          entityId.currentTarget?.dataset?.entityId ?? this.entity?.entity_id;
      }

      if (!entityId) {
        console.error('handleMore: entityId is null or undefined');
        return;
      }

      fireEvent(
        this,
        'hass-more-info',
        { entityId },
        { bubbles: false, composed: true },
      );
    }

    _handleCustomEvent(e) {
      this.handleMore(e.detail?.entityId);
    }

    /**
     * Calls a HA service and handles errors gracefully.
     * Дефолтные сервисы заданы для lawn_mower — ремапим под домен сущности.
     * Пользовательские сервисы (actions:/shortcuts:) идут через callAction.
     *
     * @param {Event} e
     * @param {string} service - e.g. 'lawn_mower.start_mowing'
     * @param {Object} serviceData
     */
    async callService(e, service, serviceData = {}) {
      let [domain, name] = service.split('.');

      if (
        domain === consts.LAWNMOWER_SERVICE &&
        this.entityDomain !== consts.LAWNMOWER_SERVICE
      ) {
        name = resolveService(this.entityDomain, name);
        domain = this.entityDomain;
      }

      const { isRequest = false, ...service_data } = serviceData;

      try {
        await this.hass.callService(domain, name, service_data);
      } catch (err) {
        console.error(
          `%c LANDROID-CARD %c ${version} `,
          'color: white; background: #ec6a36; font-weight: 700;',
          'color: #ec6a36; background: white; font-weight: 700;',
          `Service call ${service} failed:`,
          err,
        );
        this.requestInProgress = false;
        return;
      }

      if (isRequest) {
        this.requestInProgress = true;
        this.requestUpdate();
      }
    }

    /**
     * Calls a service based on the action parameter and the actions config object.
     *
     * @param {string} action - e.g. `start_mowing`, `edgecut`, `pause`, `dock`.
     * @param {Object} [params] - An object of options.
     * @param {string} [params.defaultService] - Service to call if the action
     *   is not found in the actions config object.
     */
    async handleAction(e, action, params = {}) {
      try {
        const actions = this.config.actions || {};
        const { defaultService = action, ...service_data } = params;
        delete service_data.action;
        actions[action]
          ? await this.callAction(actions[action])
          : await this.callService(e, defaultService, service_data);
      } catch (err) {
        console.error('LANDROID-CARD: handleAction failed:', err);
        fireEvent(this, 'hass-notification', {
          message: `Landroid Card: ${err?.message ?? String(err)}`,
        });
      }
    }

    /**
     * Calls a service based on the action parameter.
     * Supports: `perform-action`, `navigate`, `url`, `more-info`.
     *
     * @param {Object} action - The action object.
     * @return {void}
     */
    async callAction(action) {
      if (!action?.action) return;

      switch (action.action) {
        case 'perform-action': {
          if (!action.perform_action) return;
          const [domain, service] = action.perform_action.split('.');
          try {
            await this.hass.callService(
              domain,
              service,
              action.data ?? {},
              action.target,
            );
          } catch (err) {
            console.error(
              `LANDROID-CARD: perform-action ${action.perform_action} failed:`,
              err,
            );
          }
          break;
        }

        case 'navigate':
          window.history.pushState(null, '', action.navigation_path);
          fireEvent(window, 'location-changed');
          break;

        case 'url':
          window.open(
            action.url_path,
            action.url_target ?? '_blank',
            'noopener,noreferrer',
          );
          break;

        case 'more-info':
          this.handleMore(action.entity);
          break;

        default:
          console.warn(`LANDROID-CARD: Unknown action type: ${action.action}`);
      }
    }
  };
