
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

const ACTIVE_PIXEL_VALUE = 255

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

  getDataPoints() {
    var frame = this.getImage().data
    var x = Array();
    var y = Array();
    var acutal_index = 0;
    for (var i = 0; i < this.height; i++) {

      for (var j = 0; j < this.width; j++) {

        if (frame[acutal_index] == ACTIVE_PIXEL_VALUE) {
          x.push(j);
          y.push(i);
        }
        acutal_index += 4;
      }
    }
    return { "x": x, "y": y }
  }

  getCroppedDataPoints(fromX, fromY) {
    var frame = this.getImage().data
    var x = Array()
    var y = Array()
    var acutal_index = 0;

    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        if (frame[acutal_index] == ACTIVE_PIXEL_VALUE) {
          if ((j < fromX) & (i < fromY)) {
            x.push(fromX - j);
            y.push(fromY - i);
          }
        }
        acutal_index += 4;
      }
    }

    return { "x": x, "y": y }
  }


}

class DeltaCanvas extends CanvasScreen {
  constructor(elementId, width, height, threshold = 20) {
    super(elementId, width, height)

    this.oldFrame = null
    this.threshold = threshold
    this.deltaFrame = this.ctx.createImageData(this.width, this.height)
    for (var i = 0; i < this.deltaFrame.data.length; i++) {
      this.deltaFrame.data[i] = ACTIVE_PIXEL_VALUE
    }
  }

  addFrame(frame) {

    if (!this.oldFrame) {
      this.oldFrame = frame
    } else {

      for (var i = 0; i < frame.length; i += 4) {
        // cast to binary delta
        if (Math.abs(this.oldFrame[i] - frame[i]) > this.threshold) {
          this.deltaFrame.data[i] = ACTIVE_PIXEL_VALUE;
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


    this.trailLength = trailLength
    this.trailFrames = new Array()

    this.trailFrame = new Array(4 * width * height)
    for (var i = 0; i < this.trailFrame.length; i += 4) {
      this.trailFrame[i] = 0
      this.trailFrame[i + 1] = 0
      this.trailFrame[i + 2] = 0
    }

    this.trailImage = this.ctx.createImageData(this.width, this.height)
    for (var i = 0; i < this.trailImage.data.length; i += 4) {
      this.trailImage.data[i] = ACTIVE_PIXEL_VALUE
      this.trailImage.data[i + 1] = ACTIVE_PIXEL_VALUE
      this.trailImage.data[i + 2] = ACTIVE_PIXEL_VALUE
      this.trailImage.data[i + 3] = ACTIVE_PIXEL_VALUE
    }
  }

  addFrame(frame) {

    for (var i = 0; i < frame.length; i += 4) {
      this.trailFrame[i] += frame[i]
      this.trailFrame[i + 1] = this.trailFrame[i]
      this.trailFrame[i + 2] = this.trailFrame[i]
      this.trailFrame[i + 3] = ACTIVE_PIXEL_VALUE
    }

    this.trailFrames.push(frame);


    if (this.trailFrames.length > this.trailLength) {
      var subtracter = this.trailFrames.shift()

      for (var i = 0; i < frame.length; i += 4) {
        this.trailFrame[i] -= subtracter[i]
        this.trailFrame[i + 1] = this.trailFrame[i]
        this.trailFrame[i + 2] = this.trailFrame[i]
        this.trailFrame[i + 3] = ACTIVE_PIXEL_VALUE
      }
    }
  }

  displayCurrentTrailFrame() {

    for (var i = 0; i < this.trailImage.data.length; i += 4) {
      this.trailImage.data[i] = Math.min(ACTIVE_PIXEL_VALUE, this.trailFrame[i])
      this.trailImage.data[i + 1] = this.trailImage.data[i]
      this.trailImage.data[i + 2] = this.trailImage.data[i]
      this.trailImage.data[i + 3] = ACTIVE_PIXEL_VALUE
    }

    this.setImage(this.trailImage)
  }
}