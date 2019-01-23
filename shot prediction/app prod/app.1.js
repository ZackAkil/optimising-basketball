
class Watcher{
  constructor(){
    this.watchList = Array()
  }

  updateWatchers(){
    this.watchList.forEach(function(screen) {
      screen.watchChange()
    });
  }

  addWatcher(watcher){
    this.watchList.push(watcher)
  }

  watchUpdate(){
    console.log("Do something")
  }

}


class CanvasScreen extends Watcher {
  constructor(elementId, width, height) {
    super()

    this.elementId = elementId
    this.element = document.querySelector("#" + this.elementId)
    this.ctx = this.element.getContext('2d')

    this.width = width
    this.height = height
  }

  drawVideo(videoElement) {
    this.ctx.drawImage(videoElement, 0, 0, this.width, this.height)
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

  getGrayScaleImage() {
    var image = this.getImage()
    var data = image.data
    for (var i = 0; i < data.length; i += 4) {
      // grayscale by isolating the red channel
      data[i + 1] = data[i] // green
      data[i + 2] = data[i] // blue
    }
    return image
  }
}

class DeltaCanvas extends CanvasScreen {
  constructor(elementId, width, height) {
      super(elementId, width, height)

      this.oldFrame = null
  }

  displayNewFrame(){
    console.log("hahah")
  }
}

class TrailCanvas extends CanvasScreen {
  constructor(elementId, width, height) {
      super(elementId, width, height)

      this.trailFrame = null
  }

  displayNewFrame(){
    console.log("add trail")
  }
}