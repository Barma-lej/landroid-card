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

  .checkbox-options {
    display: flex;
  }

  ha-textfield,
  ha-select {
    width: 100%;
  }

  .entities .column {
    width: 49%;
  }

  .checkbox-options ha-formfield,
  .entities ha-form-string {
    width: 50%;
  }

  .checkbox-options ha-formfield {
    margin-top: 10px;
  }

  .overall-config {
    margin-bottom: 20px;
  }

  .option {
    display: flex;
    align-items: center;
  }
`;

export default style;
