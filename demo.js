/* global HTMLElement, customElements */

const UPDATE_DURATION = 1000

const randomVal = (digits, min = 0, max = 9) => ((Math.random() * (9 - min) + min)).toFixed(digits)
const pointCount = Array(parseInt(randomVal(0, 3, 10)))

const generateData = (min, max) => ({
  min,
  max,
  points: pointCount.fill().reduce((res, _curr, index) => {
    res[`label ${index}`] = parseFloat(randomVal(1, min, max))
    return res
  }, {})
})

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
