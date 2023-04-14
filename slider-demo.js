/* global HTMLElement, customElements */

import { generateData, randomVal } from './demo.js'

const sliderTemplate = (dataSources = []) => {
  const listId = `slider-demo-list-${Math.ceil((Math.random() * 1_000_000) + 1_000_000)}`
  return `
  <stellar-slider-demo>
    <datalist id="${listId}">
      ${dataSources.map(d => `<option value="${d.id}">${d.name}</option>`)}
    </datalist>

    <input type="range" list="${listId}" min="0" max="${dataSources.length - 1}" step="1" />
  </stellar-slider-demo>
`
}

const CACHE = {}

class SliderDemoController extends HTMLElement {
  constructor () {
    super()

    const dataSourceList = Array(parseInt(randomVal(0, 3, 10))).fill()

    this.dataSources = dataSourceList.map((d, index) => ({
      id: index,
      name: `Dataset ${index}`
    }))

    this.currentDataSource = this.dataSources[0]
  }

  async connectedCallback () {
    this.stellarChart = this.querySelector('stellar-chart')
    const sliderSnippet = sliderTemplate(this.dataSources)

    this.insertAdjacentHTML('afterbegin', '<h1></h1>')
    this.headline = this.querySelector('h1')

    this.insertAdjacentHTML('afterbegin', sliderSnippet)
    this.slider = this.querySelector('stellar-slider-demo')

    await this.update()

    this.slider.addEventListener('change', async (e) => {
      const sourceId = e.target.value
      if (this.dataSources[sourceId]) {
        this.currentDataSource = this.dataSources[sourceId]
        await this.update()
      } else {
        console.log('unknown datasource id')
      }
    })
  }

  async update () {
    this.headline.textContent = this.currentDataSource.name
    const data = await this.retrieve(this.currentDataSource)
    await this.stellarChart.update(data)
  }

  async retrieve (datasource) {
    if (CACHE[datasource.id]) return CACHE[datasource.id]

    return new Promise((resolve, _reject) => {
      setTimeout(() => resolve(generateData(100)), Math.ceil(Math.random() * 500))
    }).then(result => {
      CACHE[datasource.id] = result
      return result
    })
  }
}

customElements.define('stellar-slider-demo-controller', SliderDemoController)
