import { css } from 'lit';

const styles = css`
  :host {
    --lc-background: var(
      --ha-card-background,
      var(--card-background-color, white)
    );
    --lc-primary-text-color: var(--primary-text-color);
    --lc-secondary-text-color: var(--secondary-text-color);
    --lc-icon-color: var(--secondary-text-color);
    /* --lc-toolbar-background: var(--lc-background); */
    --lc-toolbar-text-color: var(--secondary-text-color);
    --lc-toolbar-icon-color: var(--secondary-text-color);
    --lc-divider-color: var(--entities-divider-color, var(--divider-color));
    --lc-spacing: 10px;
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
    position: relative;
    overflow: hidden; */
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
    align-items: baseline;

    & .tip {
      cursor: pointer;
      & div {
        display: inline-block;
        vertical-align: middle;
        padding: 0 1px;
      }
      & state-badge {
        width: unset;
      }
    }
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
    max-height: 400px;
    image-rendering: crisp-edges;
    margin: var(--lc-spacing) auto;
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

  .landroid.searching_zone,
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

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    direction: ltr;
    cursor: pointer;
  }

  .status-text {
    color: var(--lc-secondary-text-color);
    /* white-space: nowrap; */
    text-overflow: ellipsis;
    overflow: hidden;
    margin-left: calc(28px + var(--lc-spacing)); /* size + margin of spinner */
  }

  .status ha-circular-progress {
    --mdc-theme-primary: var(--lc-secondary-text-color) !important;
    margin-left: var(--lc-spacing);
  }

  .landroid-name {
    text-align: center;
    font-weight: bold;
    color: var(--lc-primary-text-color);
    font-size: 16px;
    cursor: pointer;
  }

  .not-available .offline {
    text-align: center;
    color: var(--lc-primary-text-color);
    font-size: 16px;
  }

  .metadata {
    margin: var(--lc-spacing) auto;
  }

  .stats {
    border-top: 1px solid var(--lc-divider-color);
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    color: var(--lc-secondary-text-color);
  }

  .stats-block {
    cursor: pointer;
    margin: var(--lc-spacing) 0px;
    text-align: center;
    border-right: 1px solid var(--lc-divider-color);
    flex-grow: 1;

    &:last-of-type {
      border-right: 0px;
    }
  }

  .stats-value {
    /* font-size: 20px; */
    color: var(--lc-primary-text-color);
  }

  .stats-subtitle {
    font-size: 12px;
    /* color: var(--lc-primary-text-color); */
  }

  ha-icon {
    color: var(--lc-icon-color);
    cursor: pointer;
  }

  .toolbar {
    /* background: var(--lc-toolbar-background); */
    min-height: 30px;
    display: flex;
    flex-direction: row;
    flex-flow: row wrap;
    flex-wrap: wrap;
    justify-content: space-evenly;
    padding: 5px;
    border-top: 1px solid var(--lc-divider-color);
  }

  .toolbar ha-icon-button {
    color: var(--lc-toolbar-text-color);
    flex-direction: column;
    width: 44px;
    height: 44px;
    --mdc-icon-button-size: 44px;
  }

  .toolbar ha-button {
    color: var(--lc-toolbar-text-color);
    display: flex;
    align-items: center;
    margin-right: 10px;
    padding: 10px;
    /* padding: 15px 10px; */
    cursor: pointer;

    & ha-icon {
      margin-right: 5px;
      color: var(--lc-toolbar-icon-color);
    }
  }

  .toolbar ha-icon,
  .toolbar ha-icon-button ha-icon {
    color: var(--lc-toolbar-icon-color);
    display: flex;
  }

  /* Input number row */
  .entitiescard {
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

export default styles;
