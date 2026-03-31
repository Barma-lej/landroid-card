import { css } from 'lit';

const style = css`
  .entities {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  .entities ha-formfield {
    display: block;
    margin-bottom: 10px;
    margin-left: 10px;
  }

  ha-textfield,
  ha-select,
  ha-selector{
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
`;

export default style;
