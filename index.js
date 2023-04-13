/* global Two, HTMLElement, customElements */

import { StellarScale } from './stellar-scale.js'
import { StellarGraph } from './stellar-graph.js'

// Data Example: (Simple Label / Value Object)
// {
//   // determines the maximal range for the input values (e.g. 0 to 100 in this example)
//   max: 100,
//   // points are the actual values displayed on the graph, described by a label each.
//   points: {
//     'label 0': 3,
//     'label 1': 87.8,
//     'label 2': 23.8,
//     'label 3': 22.7,
//     'label 4': 32.6
//   }
// }

// Data Example: (Alternative Data Structure)
// {
//   // determines the maximal range for the input values (e.g. 0 to 100 in this example)
//   max: 100,
//   // points are the actual values displayed on the graph, described by a label each.
//   points: {
//     'id': { value: 3.1, shortText: 'smth. about 20 chars', longText: 'longer text (about max 250)' }
//     'id': { value: 87.5, shortText: '', longText: '' }
//     'id': { value: 23.3, shortText: '', longText: '' }
//     'id': { value: 22.4, shortText: '', longText: '' }
//     'id': { value: 32.9, shortText: '', longText: '' }
//   }
// }

export class StellarChart extends HTMLElement {
  constructor () {
    super()
    this.two = new Two({ fitted: true, autostart: true })
    this.scale = undefined
    this.graph = undefined
    this.data = undefined
  }

  async connectedCallback () {
    this.two.appendTo(this)

    try {
      this.data = this.hasAttribute('data') ? JSON.parse(this.getAttribute('data')) : {}
    } catch (e) {
      this.data = {}
      console.log('failed to load init data from data-Attribute:', e.message)
    }

    await this.draw(this.data)
    this.resize()
    this.resizeListener = () => this.resize()

    window.addEventListener('resize', this.resizeListener)
  }

  disconnectedCallback () {
    window.removeEventListener('resize', this.resizeListener)
  }

  async draw (data) {
    this.datapoints = normaliseDatapointFormat(data.points)

    if (!this.scale) {
      this.scale = this.drawScale(data)
    }
    if (!this.graph) {
      this.graph = await this.drawGraph(data)
    }
  }

  drawScale ({ max }) {
    if (!this.datapoints) { return }

    const labels = this.datapoints.map(point => point.label)
    const scale = new StellarScale(this.two, labels, { max })
    scale.draw()
    return scale
  }

  async drawGraph ({ max }) {
    if (!this.datapoints) { return }

    const graph = new StellarGraph(this.two, this.scale, { max })
    await graph.draw(this.datapoints)

    return graph
  }

  async update (data) {
    if (!data?.points) {
      throw new Error('updating the graph with invalid data:', 'points property is missing!')
    }

    const newPoints = normaliseDatapointFormat(data.points)
    const currentPoints = this.datapoints

    // redraw the graph if the number of points has changed
    if (!currentPoints || newPoints.length !== currentPoints.length) {
      this.data = data
      this.scale?.remove()
      this.graph?.remove()
      this.scale = undefined
      this.graph = undefined

      await this.draw(data)
    }

    this.scale.update({ max: data.max })
    await this.graph.update(newPoints)
  }

  get centerX () {
    return this.two.width / 2
  }

  get centerY () {
    return this.two.height / 2
  }

  resize () {
    this.two.fit('fittet')

    this.two.scene.position.set(this.centerX, this.centerY)
  }
}

customElements.define('stellar-chart', StellarChart)

function normaliseDatapointFormat (datapoints) {
  const result = []

  for (const [label, value] of Object.entries(datapoints)) {
    if (typeof value === 'number') {
      result.push({ label, value })
    } else if (typeof value === 'object') {
      result.push({ label, value: value.value })
    }
  }

  return result
}
