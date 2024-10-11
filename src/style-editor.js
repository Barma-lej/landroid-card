import { css } from 'lit';

const style = css`
  .entities {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }

  .entities ha-formfield {
    display: block;
    margin-bottom: 10px;
    margin-left: 10px;
  }

  ha-textfield,
  ha-select {
    width: 100%;
  }

  .entities .column {
    width: 49%;
  }

  .side-by-side ha-formfield,
  .entities ha-form-string {
    width: 50%;
  }

  .side-by-side {
    display: flex;
    align-items: flex-end;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .option {
    display: flex;
    align-items: center;
  }
`;

export default style;
