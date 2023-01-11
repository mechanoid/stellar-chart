/* global Two */

import { edgeLengthX, edgeLengthY } from './geometric-helpers.js'

// The actual graph we want to draw to out scale
export class StellarGraph {
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
