
class Watcher {
  constructor() {
    this.watchList = Array()
  }

  updateWatchers() {
    this.watchList.forEach(function (screen) {
      screen.watchUpdate()
    });
  }

  addWatcher(watcher) {
    this.watchList.push(watcher)
  }

  watchUpdate() {
    console.log("updated watchers")
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
    this.updateWatchers()
  }

  getImage() {
    return this.ctx.getImageData(0, 0, this.width, this.height)
  }

  setImage(image) {
    this.ctx.putImageData(image, 0, 0)
    this.updateWatchers()
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
  constructor(elementId, width, height, threshold = 20) {
    super(elementId, width, height)

    this.oldFrame = null
    this.threshold = threshold
    this.deltaFrame = this.ctx.createImageData(this.width, this.height)
  }

  addFrame(frame) {

    if (!this.oldFrame) {
      this.oldFrame = frame.slice()
      for (var i = 0; i < frame.length; i++) {
        this.deltaFrame.data[i] = this.oldFrame[i];
      }
    } else {

      for (var i = 0; i < frame.length; i += 4) {
        // grayscale by isolating the red channel
        if (Math.abs(this.oldFrame[i] - frame[i]) > this.threshold) {
          this.deltaFrame.data[i] = 255;
        } else {
          this.deltaFrame.data[i] = 0;
        }
        this.deltaFrame.data[i + 1] = this.deltaFrame.data[i]; // green
        this.deltaFrame.data[i + 2] = this.deltaFrame.data[i]; // blue
      }
      this.oldFrame = frame
    }
    this.displayCurrentDelta()
  }


  displayCurrentDelta() {
    this.setImage(this.deltaFrame)
  }
}

class TrailCanvas extends CanvasScreen {
  constructor(elementId, width, height, trailLength = 75) {
    super(elementId, width, height)

    this.trailFrame = null
    this.trailLength = trailLength
  }

  addFrame(frame) {
    if (!this.oldFrame) {
      oldFrame = frame
    }
  }


  displayNewFrame() {

    console.log("add trail")
  }
}