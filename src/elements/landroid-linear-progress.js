class LandroidLinearProgress extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 4px;
          overflow: hidden;
        }

        #progress {
          width: 0;
          height: 100%;
          background-color: var(--mdc-theme-primary, #6200ee);
          transition: width 0.3s ease;
        }
      </style>
      <div id="progress"></div>
    `;

    this.progressElement = this.shadowRoot.getElementById('progress');
  }

  static get observedAttributes() {
    return ['progress'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'progress') {
      this.setProgressBarWidth(newValue);
    }
  }

  setProgressBarWidth(progress) {
    const parsedProgress = parseFloat(progress);
    const clampedProgress = isNaN(parsedProgress)
      ? 0
      : Math.min(100, Math.max(0, parsedProgress));
    this.progressElement.style.width = `${clampedProgress}%`;
  }
}

customElements.define('landroid-linear-progress', LandroidLinearProgress);
