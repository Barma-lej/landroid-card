import { css } from 'lit';

const style = css`
  .entities {
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
  }

  .entities ha-formfield {
    display: block;
    margin-bottom: 10px;
    margin-left: 10px;
  }

  .checkbox-options {
    display: flex;
  }

  mwc-select {
    width: 100%;
  }

  .checkbox-options ha-formfield,
  .entities mwc-switch,
  .entities ha-form-string {
    /* padding-right: 2%; */
    width: 50%;
  }

  .checkbox-options ha-formfield {
    margin-top: 10px;
  }

  .overall-config {
    margin-bottom: 20px;
  }
  /* landroid */
  .card-config paper-dropdown-menu {
    width: 100%;
  }

  .option {
    display: flex;
    align-items: center;
  }

  .option ha-switch {
    margin-right: 10px;
  }
`;

export default style;
