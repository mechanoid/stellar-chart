import { edgeLengthX, edgeLengthY, toRadians } from './geometric-helpers.js'

export class StellarScale {
  static scaleCount = 10 // number of scale lines we want to show
  static scaleDistance = 30 // distance between lines, we display

  constructor (two, labels = [], { max = 9 }) {
    this.two = two
    this.labels = labels
    this.max = max

    // depending on the number of properties the graph displays,
    // we split the full circle around coordinate system by the
    // number of labels to show.
    //
    // Example for 6 Labels (with sectorAngle α):
    //          L1   L2   L3
    //           \    |    /
    //            \   |   /
    //             \  |  /
    // ____________α\α|α/α_____________
    //             α/α|α\α
    //              / | \
    //             /  |  \
    //            /   |   \
    //           L6   L5   L4
    this.sectorAngle = 360 / this.labels.length
  }

  draw () {
    // Axes are the lines drawn from center to the outer limits of our scale.
    // The axes are aligned directly to the sectorAngle of the respective label
    // (label 0 = sectorAngle * 0, label 1 = sectorAngle * 1, ...)
    this.axes = this.labels.map((_label, index) => this.two.makeLine(
      0,
      0,
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount)
    ))

    // The edges are the connections between the axes, and are arranged as "rings" (actually polygons)
    // around the center of the graph.
    this.edges = Array(StellarScale.scaleCount).fill().flatMap((_, ringNumber) => this.labels.map((_label, index) => this.two.makeLine(
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthX(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1))
    )))

    // the labels are the actual text nodes arranged and displayed beside the axes.
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

    this.labels.forEach(l => {
      l.size = 12
    })
  }

  // the scaleFactor determines the drawing scale factor for given values,
  // on the scale. Essentially it is a mapping of arbitrary values to our scale dimensions.
  // (We have 10 rings each placed at scale distance from each other, by default our maximal
  // scale distance is 300 (10 * 30))
  //
  // If we want to show values e.g. from 0 to 1000 on our scale, we need them
  // to be transposed to our scale granularity of 300.
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
