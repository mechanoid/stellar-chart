import { edgeLengthX, edgeLengthY } from './geometric-helpers.js'
import { rendered } from './index.js'

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

  async draw () {
    this.drawAxes()
    this.drawEdges()
    await this.drawLabels()
  }

  // Axes are the lines drawn from center to the outer limits of our scale.
  // The axes are aligned directly to the sectorAngle of the respective label
  // (label 0 = sectorAngle * 0, label 1 = sectorAngle * 1, ...)
  drawAxes () {
    this.axes = this.labels.map((_label, index) => this.two.makeLine(
      0,
      0,
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * StellarScale.scaleCount)
    ))

    this.axesGroup = this.two.makeGroup(...this.axes)
    this.axesGroup.linewidth = 2
    this.axesGroup.stroke = '#ECECEC'

    for (const d of this.axes) {
      d.dashes = [4, 5]
    }
  }

  // the labels are the actual text nodes arranged and displayed beside the axes.
  async drawLabels () {
    this.labels = await Promise.all(this.labels.map(async (label, index) => {
      const lines = splitByWidth(label)
      const distanceFromCenter = StellarScale.scaleDistance * (10 + (this.sectorAngle * index < 45 || this.sectorAngle * index > 315 ? 1 * (lines.length - 1) : 0))

      const text = this.two.makeText(
        '',
        0,
        0
      ) // compute text first to get the length, then adjust x, y for the right distance from center

      await rendered(text.renderer)
      const element = text.renderer.elem
      for (const line of lines) {
        const tspan = createLine(line)
        await element.appendChild(tspan)
      }

      const { width } = element.getBoundingClientRect()
      let distanceCorrectionX = 0
      if (
        ((this.sectorAngle * index) > 30 && (this.sectorAngle * index) < 150) ||
        ((this.sectorAngle * index) > 210 && (this.sectorAngle * index) < 330)) {
        distanceCorrectionX = width / 2
      }

      console.log(distanceCorrectionX)
      text.translation.x = edgeLengthX(this.sectorAngle * index, distanceFromCenter + distanceCorrectionX) - edgeLengthX((this.sectorAngle * index), 0)
      text.translation.y = edgeLengthY(this.sectorAngle * index, distanceFromCenter) - edgeLengthY((this.sectorAngle * index), 0)

      // label styling
      text.size = 12
      return text
    }))

    this.labelsGroup = this.two.makeGroup(...this.labels)
  }

  // The edges are the connections between the axes, and are arranged as "rings" (actually polygons)
  // around the center of the graph.
  drawEdges () {
    this.edges = Array(StellarScale.scaleCount).fill().flatMap((_, ringNumber) => this.labels.map((_label, index) => this.two.makeLine(
      edgeLengthX(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * index, StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthX(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1)),
      edgeLengthY(this.sectorAngle * (index + 1), StellarScale.scaleDistance * (ringNumber + 1))
    )))

    this.edgesGroup = this.two.makeGroup(...this.edges)
    this.edgesGroup.stroke = '#b1b1b1'
    this.edges.forEach(d => {
      d.dashes = [4, 5]
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

function splitByWidth (text, charCountPerLine = 30) {
  const lines = []
  const words = text.split(' ')
  let currentLine = ''

  for (const word of words) { // TODO: use Intl.Segmenter
    if (currentLine.length + word.length <= charCountPerLine) {
      currentLine += `${word} `
    } else if (currentLine.length + word.length > charCountPerLine) {
      lines.push(currentLine.trim())
      currentLine = `${word} `
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.trim())
  }

  return lines
}

function createLine (line) {
  const svgns = 'http://www.w3.org/2000/svg'
  const lineElement = document.createElementNS(svgns, 'tspan')
  lineElement.setAttributeNS(null, 'dy', '1.2em')
  lineElement.setAttributeNS(null, 'x', '0')
  lineElement.setAttributeNS(svgns, 'height', '15px')
  lineElement.setAttributeNS(svgns, 'width', '100px')
  lineElement.setAttributeNS(svgns, 'font-family', 'serif')
  lineElement.setAttributeNS(svgns, 'line-height', '17')
  lineElement.setAttributeNS(svgns, 'text-anchor', 'middle')
  lineElement.setAttributeNS(svgns, 'dominant-baseline', 'middle')
  lineElement.setAttributeNS(svgns, 'alignment-baseline', 'middle')
  lineElement.setAttributeNS(svgns, 'font-style', 'normal')
  lineElement.setAttributeNS(svgns, 'font-weight', '500')
  lineElement.setAttributeNS(svgns, 'fill', '#000')
  lineElement.setAttributeNS(svgns, 'stroke', 'transparent')
  lineElement.setAttributeNS(svgns, 'stroke-width', '1')
  lineElement.setAttributeNS(svgns, 'opacity', '1')
  lineElement.setAttributeNS(svgns, 'visibility', 'visible')
  const textNode = document.createTextNode(line)
  lineElement.appendChild(textNode)
  return lineElement
}
