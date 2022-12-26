/* global Two, HTMLElement, customElements */

const PI_DIRECTION_FACTOR = 1.5 * Math.PI

const toRadians = (degrees) => degrees * (Math.PI / 180)
const edgeLength = (angleFactor, radius) => (angleFactor * radius)

const edgeLengthX = (angle, radius) => {
  return edgeLength(Math.cos(toRadians(angle) + PI_DIRECTION_FACTOR), radius)
}

const edgeLengthY = (angle, radius) => {
  return edgeLength(Math.sin(toRadians(angle) + PI_DIRECTION_FACTOR), radius)
}

class StellarScale {
  static scaleCount = 10
  static scaleDistance = 30

  constructor (two, labels = [], { max = 9 }) {
    this.two = two
    this.labels = labels
    this.max = max
    this.sectorAngle = 360 / this.labels.length
  }

  draw () {
    this.axes = this.labels.map((_label, index) => this.two.makeLine(
      0,
      0,
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount)
    ))

    this.edges = Array(StellarScale.scaleCount).fill().flatMap((_, ringNumber) => this.labels.map((_label, index) => this.two.makeLine(
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthX(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1))
    )))

    this.labels = this.labels.map((label, index) => {
      const text = this.two.makeText(
        label,
        0,
        0
      ) // compute text first to get the length, then adjust x, y for the right distance from center
      const { width } = text.getBoundingClientRect()
      const distanceFromCenter = StellarScale.scaleDistance * 3

      text.translation.x = edgeLengthX(this.sectorAngle * index, distanceFromCenter + (width / 2)) - edgeLengthX((this.sectorAngle * index) + 90, 15)
      text.translation.y = edgeLengthY(this.sectorAngle * index, distanceFromCenter + (width / 2)) - edgeLengthY((this.sectorAngle * index) + 90, 15)

      const rotationAngle = this.sectorAngle * index

      text.rotation = toRadians(rotationAngle) - Math.PI / 2 * (rotationAngle > 180 ? -1 : 1)
      return text
    })

    this.axesGroup = this.two.makeGroup(...this.axes)
    this.axesGroup.linewidth = 2
    this.axesGroup.stroke = '#ECECEC'

    this.axes.forEach(d => {
      d.dashes = [4, 5]
    })

    this.edgesGroup = this.two.makeGroup(...this.edges)
    this.edgesGroup.stroke = '#b1b1b1'
    this.edges.forEach(d => {
      d.dashes = [4, 5]
    })

    this.labelsGroup = this.two.makeGroup(...this.labels)
    // this.labelsGroup.stroke = '#b1b1b1'

    this.labels.forEach(l => {
      l.size = 12
    })
  }

  get scaleFactor () {
    const scaleMaxLength = StellarScale.scaleDistance * 10
    const scaleFactor = (scaleMaxLength / this.max)
    return scaleFactor
  }

  remove () {
    this.axes.forEach(x => x.remove())
    this.edges.forEach(x => x.remove())
    this.labels.forEach(x => x.remove())
    this.axesGroup?.remove()
    this.edgesGroup?.remove()
    this.labelsGroup?.remove()
  }

  update ({ max }) {
    this.max = max
  }
}

class StellarGraph {
  constructor (two, scale, { max = 9 }) {
    this.two = two
    this.scale = scale
    this.max = max
    this.flareLines = []
    this.flares = []
    this.updates = 0
  }

  draw (datapoints = []) {
    if (datapoints?.length <= 0) { return }

    this.datapoints = datapoints
    this.sectorAngle = 360 / datapoints.length

    this.flares = datapoints.map((d, index) => this.flare(this.sectorAngle * index, d * this.scale.scaleFactor))
    this.flareGroup = this.groupFlares(this.flares)

    this.updateHandler = () => {
      if (!this.updating) return

      this.flares.forEach((f, index) => {
        const v = f.vertices[1]
        const d = v.destination
        v.x += (d.x - v.x) * v.drag
        v.y += (d.y - v.y) * v.drag
      })
    }
    this.two.bind('update', this.updateHandler).play()
  }

  update (datapoints = []) {
    if (!this.datapoints) {
      return this.draw(datapoints)
    }

    this.beforeDatapoints = this.datapoints
    this.datapoints = datapoints
    this.flares.forEach(f => f.remove())
    this.flares = this.beforeDatapoints.map((d, index) => this.flare(this.sectorAngle * index, d * this.scale.scaleFactor))
    this.flareGroup = this.groupFlares(this.flares)

    this.datapoints.forEach((d, index) => {
      const flare = this.flares[index]
      const center = flare.center().position
      const v = flare.vertices[1]

      v.destination = new Two.Vector(
        edgeLengthX(this.sectorAngle * index, d * this.scale.scaleFactor) - center.x,
        edgeLengthY(this.sectorAngle * index, d * this.scale.scaleFactor) - center.y
      )
      v.drag = 0.125
    })

    this.updating = true
  }

  groupFlares (flares) {
    const flareGroup = this.two.makeGroup(...flares)
    flareGroup.stroke = '#F14E50'
    flareGroup.fill = '#F77B7D'
    return flareGroup
  }

  flare (angle, length) {
    const widthFactor = 5
    const x1 = edgeLengthX(angle - 90, widthFactor)
    const y1 = edgeLengthY(angle - 90, widthFactor)
    const x2 = edgeLengthX(angle, length)
    const y2 = edgeLengthY(angle, length)
    const x3 = edgeLengthX(angle + 90, widthFactor)
    const y3 = edgeLengthY(angle + 90, widthFactor)

    const flare = this.two.makePath([
      new Two.Anchor(x1, y1), // base-edge 1
      new Two.Anchor(x2, y2), // needle tip
      new Two.Anchor(x3, y3) // base-edge 2
    ])

    flare.closed = true
    flare.curved = false
    flare.automatic = true

    flare.flareLength = length
    return flare
  }

  remove () {
    this.two.unbind('update', this.updateHandler)
    this.flares.forEach(f => f.remove())
    this.flareGroup?.remove()
  }
}

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
