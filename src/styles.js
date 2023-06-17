import { css } from 'lit';

const styles = css`
  .entity {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .entity-name {
    font-weight: bold;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-left: 16px;
    margin-right: 8px;
    flex: 1 1 30%;
  }

  .entity-state {
    margin-top: 4px;
  }

  :host {
    /* --lc-background: var( --ha-card-background, var(--card-background-color, white) ); */
    --lc-primary-text-color: var(--primary-text-color);
    --lc-secondary-text-color: var(--secondary-text-color);
    --lc-icon-color: var(--secondary-text-color);
    --lc-toolbar-background: var(--lc-background);
    --lc-toolbar-text-color: var(--secondary-text-color);
    --lc-toolbar-icon-color: var(--secondary-text-color);
    --lc-divider-color: var(--entities-divider-color, var(--divider-color));
    --lc-spacing: 10px;
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    background: var(--ha-card-background, var(--card-background-color, #fff));
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
    /* flex: 1;
    position: relative;
    overflow: hidden; */
  }

  .preview {
    background: var(--lc-background);
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
    gap: var(--lc-spacing);
    flex-grow: 1;
    flex-wrap: wrap;
    padding: var(--lc-spacing);
    justify-content: space-between;

    & .tip {
      cursor: pointer;
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
    color: var(--lc-secondary-text-color);
    /* white-space: nowrap; */
    text-overflow: ellipsis;
    overflow: hidden;
    margin-left: calc(28px + var(--lc-spacing)); /* size + margin of spinner */
  }

  .status mwc-circular-progress {
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

  /* .configbar, */
  .toolbar {
    background: var(--lc-toolbar-background);
    min-height: 30px;
    display: flex;
    flex-direction: row;
    flex-flow: row wrap;
    flex-wrap: wrap;
    justify-content: space-evenly;
    padding: 5px;
    border-top: 1px solid var(--lc-divider-color);
  }

  .configbar ha-icon-button,
  .toolbar ha-icon-button {
    color: var(--lc-toolbar-text-color);
    flex-direction: column;
    width: 44px;
    height: 44px;
    --mdc-icon-button-size: 44px;
  }

  .configbar ha-button,
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

  /* .configbar ha-icon,
  .configbar ha-icon-button ha-icon, */
  .toolbar ha-icon,
  .toolbar ha-icon-button ha-icon {
    color: var(--lc-toolbar-icon-color);
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
    font-weight: bold;
  }

  .second-item {
    margin-left: var(--mdc-list-side-padding, 16px);
  }

  /* Configbar */

  .configbar {
    border-top: 1px solid var(--lc-divider-color);
    transition: max-height 0.2s ease-in-out 0s;
  }

  /* Input number row */
  .configcard {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--lc-spacing);
  }

  #states {
    flex: 1 1 0%;
  }

  #states > :first-child {
    margin-top: 0px;
  }

  #states > div {
    position: relative;
  }

  #states > * {
    margin: 8px 0px;
  }

  #states > div > * {
    overflow: clip visible;
  }

  .row {
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .icon-badge {
    flex: 0 0 40px;
    line-height: 40px;
    text-align: center;
  }

  .info,
  .info > * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .info {
    margin-left: 16px;
    margin-right: 8px;
    flex: 1 1 30%;
  }

  /* Input and state */
  .flex {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-grow: 2;
  }

  .slider {
    flex-grow: 2;
    width: 100px;
    max-width: 200px;
  }

  .label {
    font-weight: bold;
    margin-right: 8px;
  }

  .select-dropdown {
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--primary-color, #6200ee);
  }

  .select-container {
    margin-bottom: 16px;
  }

  .select-label {
    font-weight: bold;
    margin-bottom: 8px;
  }
  /* End Input number row */
`;

export default styles;
