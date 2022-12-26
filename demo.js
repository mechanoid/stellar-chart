/* global HTMLElement, customElements */

const UPDATE_DURATION = 1000

const randomVal = (digits, min = 0, max = 9) => ((Math.random() * (max - min) + min)).toFixed(digits)
const pointCount = Array(parseInt(randomVal(0, 3, 10)))

const generateData = max => ({
  max,
  points: pointCount.fill().reduce((res, _curr, index) => {
    res[`label ${index}`] = parseFloat(randomVal(1, 0, max))
    return res
  }, {})
})

class DemoChartController extends HTMLElement {
  connectedCallback () {
    this.stellarChart = this.querySelector('stellar-chart')
    const max = Math.ceil(Math.random() * 1000)

    function update () {
      const data = generateData(max)

      this.stellarChart.update(data)

      setTimeout(update.bind(this), UPDATE_DURATION)
    }

    setTimeout(update.bind(this), UPDATE_DURATION)
  }
}

customElements.define('stellar-demo-chart-controller', DemoChartController)
