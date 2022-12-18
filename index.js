/* global Two, HTMLElement, customElements */

const PI_DIRECTION_FACTOR = 1.5 * Math.PI
const toRadians = (degrees) => degrees * (Math.PI / 180)
const edgeLength = (angleFactor, radius, centerCorrection) => (angleFactor * radius) + centerCorrection

const randomVal = (digits, min = 0, max = 9) => ((Math.random() * (9 - min) + min)).toFixed(digits)
const pointCount = Array(parseInt(randomVal(0, 3, 10)))

const data = {
  min: 0,
  max: 9,
  step: 1,
  points: pointCount.fill().reduce((res, _curr, index) => {
    res[`label ${index}`] = parseFloat(randomVal())
    return res
  }, {})
}

class StellarScale {
  static scaleCount = 10
  static scaleDistance = 30

  constructor (two, labels = [], { centerX, centerY }) {
    this.two = two
    this.labels = labels
    this.centerX = centerX
    this.centerY = centerY
    this.center = [this.centerX, this.centerY]
    this.sectorAngle = 360 / this.labels.length
  }

  draw () {
    const axes = this.labels.map((_label, index) => this.two.makeLine(
      ...this.center,
      this.edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount),
      this.edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount)
    ))

    const edges = Array(StellarScale.scaleCount).fill().flatMap((_, ringNumber) => this.labels.map((_label, index) => this.two.makeLine(
      this.edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      this.edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      this.edgeLengthX(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1)),
      this.edgeLengthY(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1))
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

  edgeLengthX (angle, radius) {
    return edgeLength(Math.cos(toRadians(angle) + PI_DIRECTION_FACTOR), radius, this.centerX)
  }

  edgeLengthY (angle, radius) {
    return edgeLength(Math.sin(toRadians(angle) + PI_DIRECTION_FACTOR), radius, this.centerY)
  }

  get scaleFactor () {
    // return (StellarScale.scaleCount * StellarScale.scaleDistance) / 100
    return StellarScale.scaleDistance
  }
}

class StellarGraph {
  constructor (two, scale, { centerX, centerY }) {
    this.two = two
    this.scale = scale
    this.flareLines = []
    this.flares = []
    this.centerX = centerX
    this.centerY = centerY
    this.center = [this.centerX, this.centerY]
  }

  draw (datapoints = []) {
    console.log(datapoints)
    this.sectorAngle = 360 / datapoints.length

    this.flares = datapoints.map((d, index) => this.flare(
      this.edgeLengthX(this.sectorAngle * index, d * this.scale.scaleFactor),
      this.edgeLengthY(this.sectorAngle * index, d * this.scale.scaleFactor),
      d * this.scale.scaleFactor,
      this.sectorAngle * index
    ))
    this.flareGroup = this.two.makeGroup(...this.flares)
    this.flareGroup.stroke = '#F14E50'
    this.flareGroup.fill = '#F77B7D'
  }

  edgeLengthX (angle, radius) {
    return edgeLength(Math.cos(toRadians(angle) + PI_DIRECTION_FACTOR), radius, this.centerX)
  }

  edgeLengthY (angle, radius) {
    return edgeLength(Math.sin(toRadians(angle) + PI_DIRECTION_FACTOR), radius, this.centerY)
  }

  flare (x, y, radius, angle) {
    const widthFactor = 2
    return this.two.makeArcSegment(x, y, radius, 0, toRadians(angle - widthFactor) - PI_DIRECTION_FACTOR, toRadians(angle + widthFactor) - PI_DIRECTION_FACTOR)
  }
}

class StellarChart extends HTMLElement {
  constructor () {
    super()
    this.two = new Two({ fitted: true })
  }

  connectedCallback () {
    this.two.appendTo(this)
    this.draw()
  }

  draw () {
    this.centerX = this.two.width / 2
    this.centerY = this.two.height / 2

    this.scale = new StellarScale(this.two, Object.keys(data.points), { centerX: this.centerX, centerY: this.centerY })
    this.scale.draw()
    this.graph = new StellarGraph(this.two, this.scale, { centerX: this.centerX, centerY: this.centerY })
    this.graph.draw(Object.values(data.points))

    this.two.update()
  }
}

customElements.define('stellar-chart', StellarChart)
