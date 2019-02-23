
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

  cropDataPoints(data, fromX, fromY) {
    var x = Array()
    var y = Array()

    for (var i = 0; i < data.x.length; i++) {

      if ((data.x[i] < fromX) & (data.y[i] < fromY)) {
        x.push(fromX - data.x[i])
        y.push(fromY - data.y[i])
      }
    }

    return { "x": x, "y": y }
  }

  getCroppedDataPoints(fromX, fromY) {
    return this.cropDataPoints(this.getDataPoints(), fromX, fromY)
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


class TfJsModel {
  constructor(fileName, callbackOnLoad = null) {
    tf.loadModel(fileName).then((model) => {
      this.model = model
      console.log('loaded model')
      if (callbackOnLoad) {
        callbackOnLoad()
      }
    });
  }

  predict(x) {
    return this.model.predict(x.expandDims()).dataSync()
  }
}


class TrajectoryFinder {

  constructor() {
    this.pi_on_180 = 0.017453292519943295
    this.angle = tf.variable(tf.scalar(55));
    this.power = tf.variable(tf.scalar(55));
    this.y_trans = tf.variable(tf.scalar(0));
  }

  deg2rad(deg) {
    return deg.mul(this.pi_on_180)
  }

  predict(x) {

    return tf.tidy(() => {

      var lhs = x.mul(tf.tan(this.deg2rad(this.angle)))
      var rhs_top = (x.pow(2)).mul(9.81)
      var rhs_bottom = ((this.power.pow(2)).mul(2)).mul(tf.cos(this.deg2rad(this.angle)).pow(2))

      return (lhs.sub(rhs_top.div(rhs_bottom))).add(this.y_trans)
    });
  }

  loss(predictions, labels) {
    // Subtract our labels (actual values) from predictions, square the results,
    // and take the mean.
    const meanSquareError = predictions.sub(labels).square().mean();
    return meanSquareError;
  }

  train(xs, ys, callbackOnFinish = null, numIterations = 300) {

    const learningRate = 5;
    const optimizer = tf.train.adam(learningRate);

    for (let iter = 0; iter < numIterations; iter++) {
      optimizer.minimize(() => {
        const predsYs = this.predict(xs);
        return this.loss(predsYs, ys);
      });
    }
    console.log('finished triaing')

    if (callbackOnFinish){
      console.log('runnig callback inside')
      callbackOnFinish()
    }
  }

  getModelDataPoints(n = 150) {
    var x = Array()
    for (var i = 0; i < n; i++) {
      x.push(i)
    }

    var y = this.predict(tf.tensor(x)).dataSync()
    return { "x": x, "y": y }
  }
}