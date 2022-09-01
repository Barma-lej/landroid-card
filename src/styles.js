import { css } from 'lit';

const styles = css`
  :host {
    --vc-background: var(
      --ha-card-background,
      var(--card-background-color, white)
    );
    --vc-primary-text-color: var(--primary-text-color);
    --vc-secondary-text-color: var(--secondary-text-color);
    --vc-icon-color: var(--secondary-text-color);
    --vc-toolbar-background: var(--vc-background);
    --vc-toolbar-text-color: var(--secondary-text-color);
    --vc-toolbar-icon-color: var(--secondary-text-color);
    --vc-divider-color: var(--entities-divider-color, var(--divider-color));
    --vc-spacing: 10px;

    display: flex;
    flex: 1;
    flex-direction: column;
  }

  ha-card {
    flex-direction: column;
    flex: 1;
    position: relative;
  }

  .preview {
    background: var(--vc-background);
    position: relative;
    text-align: center;

    &.not-available {
      filter: grayscale(1);
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
  }

  #landroidProgress {
    /* display: inline; */
    width: 100%;
    position: relative;
    overflow: hidden;
    --paper-progress-active-color: var(
      --paper-slider-active-color,
      var(--google-blue-700)
    );
    --paper-progress-secondary-color: var(
      --paper-slider-secondary-color,
      var(--google-blue-300)
    );
    --paper-progress-disabled-active-color: var(
      --paper-slider-disabled-active-color,
      var(--paper-grey-400)
    );
    --paper-progress-disabled-secondary-color: var(
      --paper-slider-disabled-secondary-color,
      var(--paper-grey-400)
    );
  }

  .configbar,
  .tips {
    display: flex;
    gap: var(--vc-spacing);
    flex-grow: 1;
    flex-wrap: wrap;
    padding: var(--vc-spacing);
    justify-content: space-between;

    & .tip {
      cursor: pointer;
    }
  }

  .configbar {
    border-top: 1px solid var(--vc-divider-color);
  }

  .camera {
    max-width: 95%;
    image-rendering: crisp-edges;
    cursor: pointer;
  }

  @keyframes mowing {
    0% {
      transform: rotate(0) translate(0);
    }
    5% {
      transform: rotate(0) translate(0, -5px);
    }
    10% {
      transform: rotate(0) translate(0, 5px);
    }
    15% {
      transform: rotate(0) translate(0);
    }
    /* Turn left */
    20% {
      transform: rotate(10deg) translate(0);
    }
    25% {
      transform: rotate(10deg) translate(0, -5px);
    }
    30% {
      transform: rotate(10deg) translate(0, 5px);
    }
    35% {
      transform: rotate(10deg) translate(0);
    }
    40% {
      transform: rotate(0) translate(0);
    }
    /* Turn right */
    45% {
      transform: rotate(-10deg) translate(0);
    }
    50% {
      transform: rotate(-10deg) translate(0, -5px);
    }
    55% {
      transform: rotate(-10deg) translate(0, 5px);
    }
    60% {
      transform: rotate(-10deg) translate(0);
    }
    70% {
      transform: rotate(0deg) translate(0);
    }
    /* Staying still */
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes returning {
    0% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(10deg);
    }
    50% {
      transform: rotate(0);
    }
    75% {
      transform: rotate(-10deg);
    }
    100% {
      transform: rotate(0);
    }
  }

  .landroid {
    display: block;
    max-width: 90%;
    max-height: 200px;
    image-rendering: crisp-edges;
    margin: var(--vc-spacing) auto;
    cursor: pointer;
    filter: brightness(0.9);
  }

  .landroid.on,
  .landroid.auto,
  .landroid.edgecut,
  .landroid.mowing,
  .landroid.starting,
  .landroid.zoning {
    animation: mowing 5s linear infinite;
  }

  .landroid.returning {
    animation: returning 2s linear infinite;
  }

  .landroid.paused {
    opacity: 100%;
  }

  .landroid.docked {
    opacity: 50%;
  }

  .fill-gap {
    flex-grow: 1;
  }

  .more-info ha-icon {
    display: flex;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    direction: ltr;
    cursor: pointer;
  }

  .status-text {
    color: var(--vc-secondary-text-color);
    /* white-space: nowrap; */
    text-overflow: ellipsis;
    overflow: hidden;
    margin-left: calc(28px + var(--vc-spacing)); /* size + margin of spinner */
  }

  .status mwc-circular-progress {
    --mdc-theme-primary: var(--vc-secondary-text-color) !important;
    margin-left: var(--vc-spacing);
  }

  .landroid-name {
    text-align: center;
    font-weight: bold;
    color: var(--vc-primary-text-color);
    font-size: 16px;
    cursor: pointer;
  }

  .not-available .offline {
    text-align: center;
    color: var(--vc-primary-text-color);
    font-size: 16px;
  }

  .metadata {
    margin: var(--vc-spacing) auto;
  }

  .stats {
    border-top: 1px solid var(--vc-divider-color);
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    color: var(--vc-secondary-text-color);
  }

  .stats-block {
    cursor: pointer;
    margin: var(--vc-spacing) 0px;
    text-align: center;
    border-right: 1px solid var(--vc-divider-color);
    flex-grow: 1;

    &:last-of-type {
      border-right: 0px;
    }
  }

  .stats-value {
    /* font-size: 20px; */
    color: var(--vc-primary-text-color);
  }

  .stats-subtitle {
    font-size: 12px;
    /* color: var(--vc-primary-text-color); */
  }

  ha-icon {
    color: var(--vc-icon-color);
    cursor: pointer;
  }

  .toolbar {
    background: var(--vc-toolbar-background);
    min-height: 30px;
    display: flex;
    flex-direction: row;
    flex-flow: row wrap;
    flex-wrap: wrap;
    justify-content: space-evenly;
    padding: 5px;
    border-top: 1px solid var(--vc-divider-color);
  }

  .toolbar ha-icon-button,
  .toolbar mwc-icon-button {
    color: var(--vc-toolbar-text-color);
    flex-direction: column;
    width: 44px;
    height: 44px;
    --mdc-icon-button-size: 44px;
  }

  .toolbar paper-button,
  .toolbar ha-button {
    color: var(--vc-toolbar-text-color);
    display: flex;
    align-items: center;
    margin-right: 10px;
    padding: 10px;
    /* padding: 15px 10px; */
    cursor: pointer;

    & ha-icon {
      margin-right: 5px;
      color: var(--vc-toolbar-icon-color);
    }
  }

  .toolbar ha-icon,
  .toolbar ha-icon-button ha-icon {
    color: var(--vc-toolbar-icon-color);
    display: flex;
  }

  .icon-title {
    display: inline-block;
    vertical-align: middle;
    padding: 0 3px;
    cursor: pointer;
  }

  /* List Item */
  .label {
    color: var(--section-header-text-color, var(--primary-text-color));
    font-weight: 500;
  }

  .second-item {
    margin-left: var(--mdc-list-side-padding, 16px);
  }

  /* Config panel */
  .configpanel {
    transition: max-height 0.2s ease-in-out 0s;
  }

  .card-header,
  :host ::slotted(.card-header) {
    color: var(--ha-card-header-color, --primary-text-color);
    font-family: var(--ha-card-header-font-family, inherit);
    font-size: var(--ha-card-header-font-size, 24px);
    letter-spacing: -0.012em;
    line-height: 48px;
    padding: 12px 16px 16px;
    display: block;
    margin-block: 0px;
    font-weight: normal;
  }

  .card-header .name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export default styles;
