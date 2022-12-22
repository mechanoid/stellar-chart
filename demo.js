/* global HTMLElement, customElements */

import { generateData } from './index.js'

class DemoChartController extends HTMLElement {
  connectedCallback () {
    this.stellarChart = this.querySelector('stellar-chart')
    let i = 0
    function update () {
      i++
      console.log('update', i)
      const data = generateData(1, 10)
      this.stellarChart.update(data)

      if (i < 10) {
        setTimeout(update.bind(this), 2000)
      }
    }

    setTimeout(update.bind(this), 2000)
  }
}

customElements.define('stellar-demo-chart-controller', DemoChartController)
