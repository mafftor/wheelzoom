/*!
	Wheelzoom 4.0.1
	license: MIT
	http://www.jacklmoore.com/wheelzoom
*/
window.wheelzoom = (function () {
  var defaults = {
    zoom: 0.1,
    maxZoom: false,
    initialZoom: 1,
    initialX: 0.5,
    initialY: 0.5,
    maxMultiplier: 3,
    acceptableMoving: 10,
    mouseMoveNoZoom: false,
  };

  var main = function (img, options) {
    if (!img || !img.nodeName || img.nodeName !== "IMG") {
      return;
    }

    var settings = {};
    var width;
    var height;
    var bgWidth;
    var bgHeight;
    var bgPosX;
    var bgPosY;
    var previousEvent;
    var transparentSpaceFiller;
    var multiplier = 1;
    var mouseDownDone;
    var moveX;
    var moveY;
    var mouseMove = false;

    function setSrcToBackground(img) {
      img.style.backgroundRepeat = "no-repeat";
      img.style.backgroundImage = 'url("' + img.src + '")';
      transparentSpaceFiller =
        "data:image/svg+xml;base64," +
        window.btoa(
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            img.naturalWidth +
            '" height="' +
            img.naturalHeight +
            '"></svg>'
        );
      img.src = transparentSpaceFiller;
    }

    function updateBgStyle() {
      if (bgPosX > 0) {
        bgPosX = 0;
      } else if (bgPosX < width - bgWidth) {
        bgPosX = width - bgWidth;
      }

      if (bgPosY > 0) {
        bgPosY = 0;
      } else if (bgPosY < height - bgHeight) {
        bgPosY = height - bgHeight;
      }

      img.style.backgroundSize = bgWidth + "px " + bgHeight + "px";
      img.style.backgroundPosition = bgPosX + "px " + bgPosY + "px";
    }

    function reset() {
      bgWidth = width;
      bgHeight = height;
      bgPosX = bgPosY = 0;
      updateBgStyle();
    }

    function onwheel(e) {
      var deltaY = 0;

      e.preventDefault();

      if (e.deltaY) {
        // FireFox 17+ (IE9+, Chrome 31+?)
        deltaY = e.deltaY;
      } else if (e.wheelDelta) {
        deltaY = -e.wheelDelta;
      }

      var offset = getCursorPosition(e);
      var bgRatio = getCursorRatio(offset);

      // Update the bg size:
      if (deltaY < 0) {
        bgWidth += bgWidth * settings.zoom;
        bgHeight += bgHeight * settings.zoom;
      } else {
        bgWidth -= bgWidth * settings.zoom;
        bgHeight -= bgHeight * settings.zoom;
      }

      if (settings.maxZoom) {
        bgWidth = Math.min(width * settings.maxZoom, bgWidth);
        bgHeight = Math.min(height * settings.maxZoom, bgHeight);
      }

      // Take the percent offset and apply it to the new size:
      bgPosX = offset.X - bgWidth * bgRatio.X;
      bgPosY = offset.Y - bgHeight * bgRatio.Y;

      moveY = bgPosY;
      moveX = bgPosX;
      // Prevent zooming out beyond the starting size
      if (bgWidth <= width || bgHeight <= height) {
        reset();
      } else {
        updateBgStyle();
      }
    }

    function multiply(e) {
      if (mouseMove) {
        if (blockMoveZoom()) {
          return false;
        }
      }
      // assure that does not zoom if holding the click
      if (mouseHoldTimeout) {
        clearTimeout(mouseHoldTimeout);
        mouseHoldTimeout = null;
      }
      if (mouseDownDone) {
        mouseDownDone = false;
        return;
      }

      function blockMoveZoom() {
        // if mouseMoveNozoom = true don't zoom
        if (settings.mouseMoveNoZoom) {
          return true;
        } else {
          // if mouse moves more than acceptableMoving don't zoom
          if (
            moveX - bgPosX > settings.acceptableMoving ||
            moveY - bgPosY > settings.acceptableMoving ||
            moveX - bgPosX < -settings.acceptableMoving ||
            moveY - bgPosY < -settings.acceptableMoving
          ) {
            return true;
          }
        }
        return false;
      }

      addEventListener;
      multiplier = settings.maxMultiplier < multiplier ? 1 : multiplier + 1;

      var offset = getCursorPosition(e);
      var bgRatio = getCursorRatio(offset);

      // Update the bg size:
      bgWidth = width * multiplier;
      bgHeight = height * multiplier;

      if (settings.maxZoom) {
        bgWidth = Math.min(width * settings.maxZoom, bgWidth);
        bgHeight = Math.min(height * settings.maxZoom, bgHeight);
      }

      // Take the percent offset and apply it to the new size:
      bgPosX = offset.X - bgWidth * bgRatio.X;
      bgPosY = offset.Y - bgHeight * bgRatio.Y;

      // Prevent zooming out beyond the starting size
      if (bgWidth <= width || bgHeight <= height) {
        reset();
      } else {
        updateBgStyle();
      }
    }

    // Use the previous offset to get the percent offset between the bg edge and cursor:
    function getCursorRatio(offset) {
      var bgCursor = getCursorOffset(offset);

      return {
        X: bgCursor.X / bgWidth,
        Y: bgCursor.Y / bgHeight,
      };
    }

    // Record the offset between the bg edge and cursor:
    function getCursorOffset(offset) {
      return {
        X: offset.X - bgPosX,
        Y: offset.Y - bgPosY,
      };
    }

    // As far as I know, there is no good cross-browser way to get the cursor position relative to the event target.
    // We have to calculate the target element's position relative to the document, and subtrack that from the
    // cursor's position relative to the document.
    function getCursorPosition(e) {
      var rect = img.getBoundingClientRect();
      var offsetX = e.pageX - rect.left - window.pageXOffset;
      var offsetY = e.pageY - rect.top - window.pageYOffset;

      return {
        X: offsetX,
        Y: offsetY,
      };
    }

    function drag(e) {
      mouseMove = true;
      e.preventDefault();
      bgPosX += e.pageX - previousEvent.pageX;
      bgPosY += e.pageY - previousEvent.pageY;
      previousEvent = e;
      updateBgStyle();
    }

    function removeDrag() {
      document.removeEventListener("mouseup", removeDrag);
      document.removeEventListener("mousemove", drag);
    }

    // Make the background draggable
    function draggable(e) {
      // if mousedown for more than 300ms
      // the multiply function does not get called
      mouseHoldTimeout = setTimeout(() => {
        mouseDownDone = true;
      }, 300);
      e.preventDefault();
      previousEvent = e;
      moveY = bgPosY;
      moveX = bgPosX;
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", removeDrag);
    }

    function load() {
      var initial = Math.max(settings.initialZoom, 1);

      if (img.src === transparentSpaceFiller) return;

      var computedStyle = window.getComputedStyle(img, null);

      width = parseInt(computedStyle.width, 10);
      height = parseInt(computedStyle.height, 10);
      bgWidth = width * initial;
      bgHeight = height * initial;
      bgPosX = -(bgWidth - width) * settings.initialX;
      bgPosY = -(bgHeight - height) * settings.initialY;

      setSrcToBackground(img);

      img.style.backgroundSize = bgWidth + "px " + bgHeight + "px";
      img.style.backgroundPosition = bgPosX + "px " + bgPosY + "px";
      img.addEventListener("wheelzoom.reset", reset);

      img.addEventListener("wheel", onwheel);
      img.addEventListener("mousedown", draggable);
      img.addEventListener("click", multiply);
    }

    var destroy = function (originalProperties) {
      img.removeEventListener("wheelzoom.destroy", destroy);
      img.removeEventListener("wheelzoom.reset", reset);
      img.removeEventListener("load", load);
      img.removeEventListener("mouseup", removeDrag);
      img.removeEventListener("mousemove", drag);
      img.removeEventListener("mousedown", draggable);
      img.removeEventListener("wheel", onwheel);

      img.style.backgroundImage = originalProperties.backgroundImage;
      img.style.backgroundRepeat = originalProperties.backgroundRepeat;
      img.src = originalProperties.src;
    }.bind(null, {
      backgroundImage: img.style.backgroundImage,
      backgroundRepeat: img.style.backgroundRepeat,
      src: img.src,
    });

    img.addEventListener("wheelzoom.destroy", destroy);

    options = options || {};

    Object.keys(defaults).forEach(function (key) {
      settings[key] = options[key] !== undefined ? options[key] : defaults[key];
    });

    if (img.complete) {
      load();
    }

    img.addEventListener("load", load);
  };

  // Do nothing in IE9 or below
  if (typeof window.btoa !== "function") {
    return function (elements) {
      return elements;
    };
  } else {
    return function (elements, options) {
      if (elements && elements.length) {
        Array.prototype.forEach.call(elements, main, options);
      } else if (elements && elements.nodeName) {
        main(elements, options);
      }
      return elements;
    };
  }
})();

// initialize the script
wheelzoom(document.querySelectorAll("img.zoom"), {
  maxMultiplier: 5,
});
