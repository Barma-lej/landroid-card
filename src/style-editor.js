import { css } from 'lit';

const style = css`
  .entities {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    gap: 8px;
  }

  ha-textfield,
  ha-selector {
    width: 100%;
  }

  .entities .flex-1 {
    flex: 1;
  }

  .entities .flex-2 {
    flex: 2;
  }

  .entities .flex-3 {
    flex: 3;
  }

  .side-by-side {
    display: flex;
    gap: 16px;
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--divider-color);
    margin-bottom: 16px;
    overflow-x: auto;
  }

  .tab {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--secondary-text-color);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    white-space: nowrap;
    user-select: none;
  }

  .tab[active] {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 500;
  }

  .note {
    color: var(--secondary-text-color);
    font-size: 12px;
    margin: 4px 0 8px;
    line-height: 1.4;
  }

  .handle {
    cursor: grab !important;
    padding: 8px 4px;
    color: var(--secondary-text-color);
  }

  .entities {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .entities ha-selector {
    flex: 1;
  }
`;

export default style;
