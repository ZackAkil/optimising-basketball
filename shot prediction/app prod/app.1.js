


class CanvasScreen {
  constructor(elementId, width, height) {
    this.elementId = elementId
    this.element = document.querySelector("#" + this.elementId)
    this.ctx = this.element.getContext('2d')

    this.width = width
    this.height = height
  }

  getImage() {
    return this.ctx.getImageData(0, 0, this.width, this.height)
  }

  setImage(image) {
    this.ctx.putImageData(image, 0, 0)
  }

  drawCross(x_ratio, y_ratio) {
    var x = x_ratio * this.width
    var y = y_ratio * this.height

    this.ctx.beginPath()
    this.ctx.moveTo(x, 0)
    this.ctx.lineTo(x, this.height)
    this.ctx.moveTo(0, y)
    this.ctx.lineTo(this.width, y)
    this.ctx.strokeStyle = "red"
    this.ctx.lineWidth = 5
    this.ctx.stroke()
  }
}