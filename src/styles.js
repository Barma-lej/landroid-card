import { css } from 'lit';

const styles = css`
  :host {
    --lc-background: var(--lc-card-background, var(--ha-card-background, var(--card-background-color, white)));
    --lc-primary-text-color: var(--primary-text-color);
    --lc-secondary-text-color: var(--secondary-text-color);
    --lc-icon-color: var(--secondary-text-color);
    --lc-toolbar-background: var(--lc-background);
    --lc-toolbar-text-color: var(--secondary-text-color);
    --lc-toolbar-icon-color: var(--secondary-text-color);
    --lc-divider-color: var(--entities-divider-color, var(--divider-color));
    --lc-spacing: 4px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    background: var(--lc-background);
    box-shadow: var(--ha-card-box-shadow, none);
    box-sizing: border-box;
    border-radius: var(--ha-card-border-radius, 12px);
    border-width: var(--ha-card-border-width, 1px);
    border-style: solid;
    border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
    transition: all 0.3s ease-out 0s;
    position: relative;
  }

  ha-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: var(--lc-background);
    /* flex: 1;
    position: relative; */
    overflow: hidden;
  }

  .preview {
    /* background: var(--lc-background); */
    position: relative;
    text-align: center;

    &.not-available {
      filter: grayscale(1);
    }
  }

  .tips {
    display: flex;
    gap: var(--lc-spacing);
    flex-grow: 1;
    flex-wrap: wrap;
    padding: var(--lc-spacing);
    justify-content: space-between;
    align-items: center;

    & .tip {
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      box-sizing: border-box;

      /* Скругление под стиль ha-button */
      border-radius: var(--ha-button-border-radius, var(--ha-button-radius, 9999px));
      padding: 2px 10px;

      /* Переменные цвета ripple при клике и наведении */
      --ha-ripple-color: var(--secondary-text-color);
      --ha-ripple-hover-opacity: 0.08;
      --ha-ripple-pressed-opacity: 0.16;

      & div {
        display: inline-block;
        vertical-align: middle;
        padding: 0 2px;
        user-select: none;
      }

      & state-badge {
        width: unset;
        pointer-events: none;
      }
    }
  }

  .camera {
    max-width: 95%;
    image-rendering: crisp-edges;
    cursor: pointer;
  }

   /* Стандартное HA-изображение статуса */
  .ha-state-image {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 8px;
  }

  .ha-state-image-scale {
    transform-origin: center center;
  }

  @keyframes mowing {
    0% { transform: rotate(0) translate(0); }
    5% { transform: rotate(0) translate(0, -5px); }
    10% { transform: rotate(0) translate(0, 5px); }
    15% { transform: rotate(0) translate(0); }
    /* Turn left */
    20% { transform: rotate(10deg) translate(0); }
    25% { transform: rotate(10deg) translate(0, -5px); }
    30% { transform: rotate(10deg) translate(0, 5px); }
    35% { transform: rotate(10deg) translate(0); }
    40% { transform: rotate(0) translate(0); }
    /* Turn right */
    45% { transform: rotate(-10deg) translate(0); }
    50% { transform: rotate(-10deg) translate(0, -5px); }
    55% { transform: rotate(-10deg) translate(0, 5px); }
    60% { transform: rotate(-10deg) translate(0); }
    70% { transform: rotate(0deg) translate(0); }
    /* Staying still */
    100% { transform: rotate(0deg); }
  }

  @keyframes returning {
    0% { transform: rotate(0); }
    25% { transform: rotate(10deg); }
    50% { transform: rotate(0); }
    75% { transform: rotate(-10deg); }
    100% { transform: rotate(0); }
  }

  .landroid-wrapper {
    display: block; /* Или inline-flex, чтобы контейнер был по размеру картинки */
    position: relative;
    overflow: hidden;
    margin: var(--lc-spacing) auto;
    cursor: pointer;
    border-radius: var(--ha-card-border-radius, 12px);
    max-width: 100%;
  }

  .landroid {
    display: block;
    max-width: 90%;
    max-height: 400px;
    image-rendering: crisp-edges;
    margin: var(--lc-spacing) auto;
    cursor: pointer;
    filter: brightness(0.9);
  }

  .landroid.edgecut,
  .landroid.mowing,
  .landroid.cleaning,
  .landroid.starting,
  .landroid.zoning {
    animation: mowing 5s linear infinite;
  }

  .landroid.returning,
  .landroid.searching_zone {
    animation: returning 2s linear infinite;
  }

  .landroid.idle,
  .landroid.paused {
    opacity: 100%;
  }

  .landroid.docked,
  .landroid.rain_delayed {
    opacity: 50%;
  }

  .landroid.error,
  .landroid.escaped_digital_fence {
    opacity: 25%;
  }

  .metadata {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: var(--lc-spacing) auto;
    padding: 6px 14px;
    border-radius: var(--ha-card-border-radius, 12px);

    /* Чтобы дочерние элементы не мешали клику на контейнер */
    & .landroid-name,
    & .status,
    & .status-text {
      pointer-events: none;
      user-select: none;
      cursor: pointer;
    }
  }

  .landroid-name {
    text-align: center;
    font-weight: bold;
    color: var(--lc-primary-text-color);
    font-size: 16px;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    direction: ltr;
    margin-top: 2px;
  }

  .status-text {
    color: var(--lc-secondary-text-color);
    /* white-space: nowrap; */
    text-overflow: ellipsis;
    overflow: hidden;
    /* margin-left: calc(28px + var(--lc-spacing)); */ /* size + margin of spinner */ /* There is no spinner in this case */
  }

  .status-text.status-error {
    color: var(--error-color);
  }

  .status ha-circular-progress {
    --mdc-theme-primary: var(--lc-secondary-text-color) !important;
    margin-left: var(--lc-spacing);
  }

  .not-available .offline {
    text-align: center;
    color: var(--lc-primary-text-color);
    font-size: 16px;
  }
`;

export default styles;
