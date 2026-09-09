// Шаблоны фрагментов карты: чистые функции (card, ...) => TemplateResult.
// `card` — экземпляр LandroidCard. Обработчики событий (@click=${card.handleMore})
// не требуют bind: Lit вызывает слушателя с this = host-компонент.

import { html, nothing } from 'lit';
import * as consts from '../constants';
import { isObject, wifiStrengthToQuality } from '../helpers';
import localize from '../localize';

/**
 * Renders the name of the robot.
 *
 * @param {LandroidCard} card
 * @return {TemplateResult|nothing}
 */
export function renderCardName(card) {
  if (!card.showName || !card.entity) return nothing;

  const name = card.entity.attributes?.friendly_name || card.entity.entity_id;

  return html`
    <div class="landroid-name" title=${name} @click=${card.handleMore}>
      ${name}
    </div>
  `;
}

/**
 * Renders the status line of the robot.
 * Опциональные Landroid-сенсоры (зона, party mode, lock, rain delay, ошибка)
 * добавляются только если найдены — для vacuum и других интеграций строка
 * остаётся просто локализованным состоянием.
 *
 * @param {LandroidCard} card
 * @return {TemplateResult|nothing}
 */
export function renderCardStatus(card) {
  if (!card.showStatus) return nothing;

  const state = card.entity?.state;

  // Все опциональные сущности — если нет, просто undefined
  const zoneSensor = card.getEntityByTranslationKey(consts.TK_SELECT_ZONE);
  const partyMode = card.getEntityByTranslationKey(consts.TK_SWITCH_PARTY);
  const lockMode = card.getEntityByTranslationKey(consts.TK_SWITCH_LOCK);
  const errorSensor = card.getEntityByTranslationKey(consts.TK_SENSOR_ERROR);

  const hasError =
    isObject(errorSensor) &&
    errorSensor.state !== 'no_error' &&
    errorSensor.state !== consts.STATE_UNAVAILABLE;

  let localizedStatus = card.hass.formatEntityState(card.entity) || 'Unknown';

  // rain delay — только если есть сенсор дождя
  if (state === consts.STATE_RAINDELAY) {
    const rainSensor = card.getEntityByTranslationKey(
      consts.TK_SENSOR_RAINDELAY,
    );
    if (isObject(rainSensor) && rainSensor.state !== consts.STATE_UNAVAILABLE) {
      localizedStatus += ` (${card.hass.formatEntityState(rainSensor)})`;
    }
  }

  // зона — только если есть сенсор зоны
  if (state === consts.STATE_MOWING && isObject(zoneSensor)) {
    localizedStatus += ` - ${localize('attr.zone')} ${zoneSensor.state}`;
  }

  // расписание — только если есть next_schedule И party mode выключен (или отсутствует)
  if (
    (state === consts.STATE_DOCKED || state === consts.STATE_IDLE) &&
    partyMode?.state !== 'on'
  ) {
    const nextScheduledStart = card.getEntityByTranslationKey(
      consts.TK_SENSOR_NEXT_SCHEDULE,
    );
    if (isObject(nextScheduledStart)) {
      const nextDate = new Date(nextScheduledStart.state);
      if (!isNaN(nextDate.getTime()) && Date.now() < nextDate.getTime()) {
        localizedStatus += ` - ${card.getEntityName(
          nextScheduledStart.entity_id,
        )} ${card.hass.formatEntityState(nextScheduledStart)}`;
      }
    }
  }

  // party mode и lock — только если сущность есть и включена
  if (partyMode?.state === 'on') {
    localizedStatus += ` - ${card.getEntityName(partyMode.entity_id)}`;
  }
  if (lockMode?.state === 'on') {
    localizedStatus += ` - ${card.getEntityName(lockMode.entity_id)}`;
  }

  // ошибка — только если есть сенсор ошибки
  if (hasError && state !== consts.STATE_RAINDELAY) {
    localizedStatus += ` - ${card.hass.formatEntityState(errorSensor)}`;
  }

  return html`
    <div class="status" @click=${card.handleMore} title=${localizedStatus}>
      <span class="status-text ${hasError ? 'status-error' : ''}"
        >${localizedStatus}</span
      >
      <ha-circular-progress
        .indeterminate=${card.requestInProgress}
        size="small"
      ></ha-circular-progress>
    </div>
  `;
}

/**
 * Renders a tip button for a given card type.
 * labelPosition: none = 0, left = 1, right = 2.
 * entities может содержать объектные строки (type: 'attribute' для battery
 * fallback) — entity_id достаём из обоих форматов, а для attribute-строки
 * показываем значение атрибута, а не состояние.
 *
 * @param {LandroidCard} card
 * @param {string} cardType - The card type ('info' | 'statistics' | 'battery').
 * @return {TemplateResult|nothing}
 */
export function renderTipButton(card, cardType) {
  const cardData = card.cardEntities[cardType];
  if (!cardData) {
    return nothing;
  }

  const first = cardData.entities?.[0];
  const entityId = typeof first === 'string' ? first : first?.entity;
  if (!entityId) {
    return nothing;
  }

  const entity = card.getPatchedStateObj(entityId);
  if (!entity) {
    return nothing;
  }

  const title = card.getEntityName(entityId);

  const isAttrRow = typeof first !== 'string' && first?.type === 'attribute';
  const attrValue = isAttrRow ? entity.attributes?.[first.attribute] : null;

  const translationKey = card.hass.entities?.[entityId]?.translation_key;
  const state =
    translationKey === consts.TK_SENSOR_WIFI
      ? wifiStrengthToQuality(entity.state)
      : isAttrRow && attrValue != null
        ? `${attrValue}${first.suffix ?? ''}`
        : card.hass.formatEntityState(entity);

  const labelContent = html`<div .title="${title}: ${state}">${state}</div>`;

  return html`
    <div
      class="tip"
      @click=${card._toggleCardVisibility}
      data-card-type=${cardType}
    >
      ${cardData.labelPosition === 1 ? labelContent : ''}
      <state-badge
        .hass=${card.hass}
        .stateObj=${entity}
        .title=${`${title}: ${state}`}
        .stateColor=${true}
      ></state-badge>
      ${cardData.labelPosition === 2 ? labelContent : ''}
    </div>
  `;
}
