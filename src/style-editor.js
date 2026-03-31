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

  /* Равные колонки */
  .entities .column {
    flex: 1;
  }

  /* Пропорция 1:2 */
  .entities .column4 {
    flex: 1;
  }

  .entities .column8 {
    flex: 2;
  }

  .side-by-side ha-formfield,
  .entities ha-form-string {
    width: 50%;
  }

  .side-by-side {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .option {
    display: flex;
    align-items: center;
  }
`;

export default style;
