/* global HTMLElement, customElements */

const UPDATE_DURATION = 1000

export const randomVal = (digits, min = 0, max = 9) => ((Math.random() * (max - min) + min)).toFixed(digits)
const points = Array(parseInt(randomVal(0, 3, 10)))

export const generateData = max => ({
  max,
  points: points.fill().reduce((res, _curr, index) => {
    // const randomLabelFilling = [...Array(Math.ceil(Math.random() * 3))].map((value) => (Math.random() * 1000000).toString(36).replace('.', '')).join('')
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
