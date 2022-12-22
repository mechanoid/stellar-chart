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

const randomVal = (digits, min = 0, max = 9) => ((Math.random() * (9 - min) + min)).toFixed(digits)
const pointCount = Array(parseInt(randomVal(0, 3, 10)))

export const generateData = (min, max) => ({
  min,
  max,
  points: pointCount.fill().reduce((res, _curr, index) => {
    res[`label ${index}`] = parseFloat(randomVal(1, min, max))
    return res
  }, {})
})

class StellarScale {
  static scaleCount = 10
  static scaleDistance = 30

  constructor (two, labels = []) {
    this.two = two
    this.labels = labels
    this.sectorAngle = 360 / this.labels.length
  }

  draw () {
    const axes = this.labels.map((_label, index) => this.two.makeLine(
      0,
      0,
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount)
    ))

    const edges = Array(StellarScale.scaleCount).fill().flatMap((_, ringNumber) => this.labels.map((_label, index) => this.two.makeLine(
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthX(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1))
    )))

    const axesGroup = this.two.makeGroup(...axes)
    axesGroup.linewidth = 2
    axesGroup.stroke = '#ECECEC'
    axes.forEach(d => {
      d.dashes = [4, 5]
    })

    const edgesGroup = this.two.makeGroup(...edges)
    edgesGroup.stroke = '#b1b1b1'
    edges.forEach(d => {
      d.dashes = [4, 5]
    })
  }

  get scaleFactor () {
    return StellarScale.scaleDistance
  }
}

class StellarGraph {
  constructor (two, scale) {
    this.two = two
    this.scale = scale
    this.flareLines = []
    this.flares = []
    this.updates = 0
  }

  draw (datapoints = []) {
    this.datapoints = datapoints
    this.sectorAngle = 360 / datapoints.length

    this.flares = datapoints.map((d, index) => this.flare(this.sectorAngle * index, d * this.scale.scaleFactor))
    this.flareGroup = this.groupFlares(this.flares)

    this.two.bind('update', () => {
      if (!this.updating) return
      this.flares.forEach((f, index) => {
        const v = f.vertices[1]
        const d = v.destination
        v.x += (d.x - v.x) * v.drag
        v.y += (d.y - v.y) * v.drag
      })
    }).play()
  }

  update (datapoints = []) {
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
}

export class StellarChart extends HTMLElement {
  constructor () {
    super()
    this.two = new Two({ fitted: true, autostart: true })
  }

  connectedCallback () {
    this.two.appendTo(this)
    const data = generateData(1, 10)
    this.draw(data)
    this.resize()

    this.resizeListener = () => this.resize()
    window.addEventListener('resize', this.resizeListener)
  }

  disconnectedCallback () {
    window.removeEventListener('resize', this.resizeListener)
  }

  draw (data) {
    this.drawScale(data)
    this.drawGraph(data)
    this.two.update()
  }

  drawScale (data) {
    this.scale = new StellarScale(this.two, Object.keys(data.points), { centerX: this.centerX, centerY: this.centerY })
    this.scale.draw()
  }

  drawGraph (data) {
    this.graph = new StellarGraph(this.two, this.scale, { centerX: this.centerX, centerY: this.centerY })
    this.graph.draw(Object.values(data.points))
  }

  update (data) {
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
