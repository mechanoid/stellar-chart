/* global HTMLElement, customElements */

import { generateData } from './index.js'

const UPDATE_DURATION = 100

class DemoChartController extends HTMLElement {
  connectedCallback () {
    this.stellarChart = this.querySelector('stellar-chart')
    function update () {
      const data = generateData(1, 10)
      this.stellarChart.update(data)

      setTimeout(update.bind(this), UPDATE_DURATION)
    }

    setTimeout(update.bind(this), UPDATE_DURATION)
  }
}

customElements.define('stellar-demo-chart-controller', DemoChartController)
