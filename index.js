/* global Two, HTMLElement, customElements */

import { StellarScale } from './stellar-scale.js'
import { StellarGraph } from './stellar-graph.js'

// Data Example:
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

export class StellarChart extends HTMLElement {
  constructor () {
    super()
    this.two = new Two({ fitted: true, autostart: true })
    this.scale = undefined
    this.graph = undefined
    this.data = undefined
  }

  connectedCallback () {
    this.two.appendTo(this)

    try {
      this.data = this.hasAttribute('data') ? JSON.parse(this.getAttribute('data')) : {}
    } catch (e) {
      this.data = {}
      console.log('failed to load init data from data-Attribute:', e.message)
    }

    this.draw(this.data)
    this.resize()
    this.resizeListener = () => this.resize()

    window.addEventListener('resize', this.resizeListener)
  }

  disconnectedCallback () {
    window.removeEventListener('resize', this.resizeListener)
  }

  draw (data) {
    if (!this.scale) {
      this.scale = this.drawScale(data)
    }
    if (!this.graph) {
      this.graph = this.drawGraph(data)
    }
  }

  drawScale (data) {
    if (!data.points) { return }

    const labels = data?.points ? Object.keys(data.points) : []
    const scale = new StellarScale(this.two, labels, { max: data.max })
    scale.draw()
    return scale
  }

  drawGraph (data) {
    if (!data.points) { return }

    const datapoints = data?.points ? Object.values(data.points) : []
    const graph = new StellarGraph(this.two, this.scale, { max: data.max })
    graph.draw(datapoints)
    return graph
  }

  update (data) {
    if (!data?.points) {
      throw new Error('updating the graph with invalid data:', 'points property is missing!')
    }

    if (!this.data?.points || Object.keys(data.points).length !== Object.keys(this.data.points).length) {
      this.data = data
      this.scale?.remove()
      this.graph?.remove()
      this.scale = undefined
      this.graph = undefined

      this.draw(data)
    }

    this.scale.update({ max: data.max })
    this.graph.update(Object.values(data.points))
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
