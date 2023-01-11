// the factor leads to the center line of our graphs pointing upwards
const PI_DIRECTION_FACTOR = 1.5 * Math.PI

export const toRadians = (degrees) => degrees * (Math.PI / 180)
export const edgeLength = (angleFactor, radius) => (angleFactor * radius)

// we have to draw a lot of lines, with specific angles
// and need to transpose those to x,y coordinates (or distances
// on the respective axes. For that purpose we use the edgeLengthX/Y Methods)
//
// The idea behind that is that we can assume right angular triangles
// with a known length (c in the diagram below).
// To draw the proper lines with our 2D Lib (twojs), we need to
// have the length for a,b (length on our x and y axes).
//
//  |        /|
//  |      /  |
//  |   c/    |a
//  |  /      |
//  |/α_______|_______
//        b
export const edgeLengthX = (angle, radius) => {
  return edgeLength(Math.cos(toRadians(angle) + PI_DIRECTION_FACTOR), radius)
}

export const edgeLengthY = (angle, radius) => {
  return edgeLength(Math.sin(toRadians(angle) + PI_DIRECTION_FACTOR), radius)
}
