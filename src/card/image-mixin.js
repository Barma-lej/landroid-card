// Всё визуальное: камера, режимы изображения ('ha' / bundled / url),
// стандартный HA status-image, предзагрузка и синхронизация анимаций.
// Миксин: `this` — экземпляр карты (LitElement).

import { html, nothing } from 'lit';
import * as consts from '../constants';
import { defaultConfig } from '../defaults';
import { resolveImageMode, resolveHaStateImageTag } from '../helpers';
import defaultImage from '../landroid.svg';

export const ImageMixin = (superClass) =>
  class extends superClass {
    /**
     * The state of the camera entity specified in the config.
     *
     * @return {import('home-assistant').State | undefined}
     */
    get camera() {
      return this.hass?.states[this.config.camera];
    }

    get cameraView() {
      return this.config?.camera_view ?? defaultConfig.camera_view;
    }

    get cameraControls() {
      return this.config?.camera_controls ?? defaultConfig.camera_controls;
    }

    get cameraMuted() {
      return this.config?.camera_muted ?? defaultConfig.camera_muted;
    }

    /**
     * Image rendering mode: 'ha' (standard animated HA element),
     * 'bundled' (landroid.svg) or 'url' (user image / media-source).
     *
     * @return {'ha'|'bundled'|'url'} The resolved image mode.
     */
    get imageMode() {
      return resolveImageMode(this.config?.image);
    }

    /**
     * Tag of the standard HA status image element for the entity domain.
     *
     * @return {string} 'ha-state-control-vacuum-status' or
     *   'ha-state-control-lawn_mower-status'.
     */
    get haStateImageTag() {
      return resolveHaStateImageTag(this.config?.entity);
    }

    get image() {
      // Бандл-SVG — доступен всегда
      if (this.imageMode === 'bundled') {
        return defaultImage;
      }

      // Пользовательское изображение (URL или резолвленный media-source)
      if (this._resolvedImage) {
        return this._resolvedImage;
      }

      // Запасной вариант, пока media-source резолвится (и для preview в режиме 'ha')
      return defaultImage;
    }

    /**
     * Image size in pixels: `image_size` (1-8) × 50.
     * defaults is 4 (4 * 50 = 200 px)
     *

     * @return {number} The size of the image in pixels.
     */
    get imageSize() {
      return (this.config?.image_size ?? defaultConfig.image_size) * 50;
    }

    /**
     * CSS style string to position the image on the left or not.
     *
     * @return {string}
     */
    get imageLeft() {
      return (this.config?.image_left ?? defaultConfig.image_left)
        ? 'float: left;'
        : '';
    }

    /**
     * Renders the camera or image based on the provided state.
     *
     * @param {string} state - The state used as a CSS class.
     * @return {TemplateResult|nothing}
     */
    renderCameraOrImage(state) {
      if (this.compactView) {
        return nothing;
      }

      const cameraEntity = this.hass?.states[this.config.camera];
      if (cameraEntity) {
        return html`
          <ha-camera-stream
            style="height: ${this.imageSize}px; ${this.imageLeft}"
            class="camera"
            .hass=${this.hass}
            .stateObj=${cameraEntity}
            .cameraView=${this.cameraView}
            .controls=${this.cameraControls}
            .muted=${this.cameraMuted}
            @click=${this.handleMore}
            data-entity-id=${this.config.camera}
          ></ha-camera-stream>
        `;
      }

      if (this.imageMode === 'ha') {
        return this.renderHaStateImage();
      }

      if (this.image) {
        return html`
          <div class="landroid-wrapper ${this.showAnimation ? state : ''}">
            <img
              style="height: ${this.imageSize}px; ${this.imageLeft}"
              class="landroid ${this.showAnimation ? state : ''}"
              src="${this.image}"
              @click=${this.handleMore}
            />
          </div>
        `;
      }

      return nothing;
    }

    /**
     * Renders the standard animated Home Assistant status image
     * (`ha-state-control-vacuum-status` / `ha-state-control-lawn_mower-status`).
     * Falls back to the bundled SVG while the element is not registered
     * (HA < 2026.5 or the preload is still in flight).
     *
     * @return {TemplateResult|nothing}
     */
    renderHaStateImage() {
      const tag = this.haStateImageTag;
      if (!this.entity) {
        return nothing;
      }

      if (!customElements.get(tag)) {
        // Элемент регистрируется HA лениво — запускаем предзагрузку
        // (идемпотентно) и показываем бандл-SVG, пока он не появится
        this._preloadHaStateImage();
        return this.renderBundledImage('docked');
      }

      // Элемент HA имеет фиксированный размер 200×200 внутри своего shadow DOM,
      // поэтому масштабируем его трансформом под настроенный размер изображения
      const scale = this.imageSize / 200;
      return html`
        <div
          class="ha-state-image"
          style="height: ${this.imageSize}px; ${this.imageLeft}"
          @click=${this.handleMore}
        >
          <div class="ha-state-image-scale" style="transform: scale(${scale});">
            ${tag === consts.HA_STATE_IMAGE_TAGS.vacuum
              ? html`
                  <ha-state-control-vacuum-status
                    .stateObj=${this.entity}
                  ></ha-state-control-vacuum-status>
                `
              : html`
                  <ha-state-control-lawn_mower-status
                    .stateObj=${this.entity}
                  ></ha-state-control-lawn_mower-status>
                `}
          </div>
        </div>
      `;
    }

    /**
     * Renders the bundled landroid.svg (fallback and `image: 'default'`).
     *
     * @param {string} state - The state used as a CSS class.
     * @return {TemplateResult}
     */
    renderBundledImage(state) {
      return html`
        <div class="landroid-wrapper ${this.showAnimation ? state : ''}">
          <img
            style="height: ${this.imageSize}px; ${this.imageLeft}"
            class="landroid ${this.showAnimation ? state : ''}"
            src="${defaultImage}"
            @click=${this.handleMore}
          />
        </div>
      `;
    }

    /**
     * Preloads the HA status image element without opening the more-info
     * dialog. `window.loadCardHelpers()` is the official runtime helper for
     * custom cards; `importMoreInfoControl(domain)` triggers HA's own lazy
     * chunk import which registers the status element (no UI side effects).
     *
     * @return {void}
     */
    async _preloadHaStateImage() {
      const tag = this.haStateImageTag;
      if (customElements.get(tag)) {
        return;
      }

      // Запускаем ленивый импорт чанка HA (идемпотентно). Если элемент так и не
      // зарегистрировался (например, loadCardHelpers ещё не появился на момент
      // первого рендера), через 2 с снимаем блокировку и даём повторить на
      // следующем рендере.
      if (!this.__haImagePreload) {
        this.__haImagePreload = true;
        try {
          const helpers = await window.loadCardHelpers?.();
          helpers?.importMoreInfoControl?.(
            tag === consts.HA_STATE_IMAGE_TAGS.vacuum ? 'vacuum' : 'lawn_mower',
          );
        } catch (err) {
          console.warn('LANDROID-CARD: HA state image preload failed', err);
        } finally {
          setTimeout(() => {
            this.__haImagePreload = false;
          }, 2000);
        }
      }

      // Слушаем регистрацию БЕЗ таймаута: когда бы HA ни определил элемент,
      // перерисовываемся через реактивное свойство (shouldUpdate отменяет
      // «пустые» обновления от голого requestUpdate()).
      if (!this.__haImageWatch) {
        this.__haImageWatch = true;
        customElements
          .whenDefined(tag)
          .then(() => {
            this._haStateImageReady = true;
          })
          .catch(() => {});
      }
    }

    /**
     * Applies `show_animation` to the HA status image: pauses/resumes its CSS
     * animations via the Web Animations API (`getAnimations({subtree: true})`
     * covers the element's shadow DOM).
     *
     * @return {void}
     */
    _syncHaAnimations() {
      if (this.imageMode !== 'ha') {
        return;
      }
      const host = this.renderRoot?.querySelector('.ha-state-image');
      if (!host?.getAnimations) {
        return;
      }
      for (const animation of host.getAnimations({ subtree: true })) {
        if (animation instanceof CSSAnimation) {
          if (this.showAnimation) {
            animation.play();
          } else {
            animation.pause();
          }
        }
      }
    }

    /**
     * Resolves the user image (URL or media-source://) into `_resolvedImage`.
     * Вызывается из willUpdate() основного класса.
     *
     * @param {Map} changedProps - Map of changed properties.
     * @return {void}
     */
    async _resolveMediaImage(changedProps) {
      if (
        !changedProps.has('config') &&
        !(changedProps.has('hass') && !this._resolvedImage)
      ) {
        return;
      }

      const rawImage = this.config?.image;

      // Резолвим только пользовательские URL; режимам 'ha' и 'default' это не нужно
      if (this.imageMode !== 'url') {
        this._resolvedImage = null;
        return;
      }

      if (rawImage.startsWith('media-source')) {
        if (changedProps.has('config')) {
          this._resolvedImage = undefined;
        }
        try {
          // Резолвим media-source в HTTP-URL
          const result = await this.hass.callWS({
            type: 'media_source/resolve_media',
            media_content_id: rawImage,
          });
          this._resolvedImage = result.url; // Получаем путь вида /api/media_source/...
        } catch (err) {
          console.warn('Landroid Card: Failed to resolve media image', err);
        }
      } else {
        // Обычная строка (например, /local/my_image.svg)
        this._resolvedImage = rawImage;
      }
    }
  };
