var stack = (function() {
  var stack = {},
      section = d3.selectAll("section"),
      self = d3.select(window),
      body = document.body,
      root = body,
      timeout,
      duration = 750,
      screenX,
      screenY,
      size,
      yActual,
      yFloor,
      yTarget,
      yMax,
      yOffset,
      n = section[0].length;

  // Detect whether to scroll with documentElement or body.
  body.style.height = window.innerHeight + 1 + "px";
  body.scrollTop = 1;
  if (!body.scrollTop) root = document.documentElement;
  else body.scrollTop = 0;
  body.style.height = "auto";

  // Invert the z-index so the earliest slides are on top.
  section.classed("stack", true).style("z-index", function(d, i) { return n - i; });

  // Detect the slide height (by showing an active slide).
  section.classed("active", true);
  size = section.node().getBoundingClientRect().height;
  section.classed("active", false);

  // Sets the stack position.
  stack.position = function(y1) {
    var y0 = root.scrollTop / size;
    if (arguments.length < 1) return y0;

    // clamp and round
    if (y1 >= n) y1 = n - 1;
    else if (y1 < 0) y1 = Math.max(0, n + y1);
    y1 = Math.floor(y1);

    if (y0 - y1) {
      self.on("scroll.stack", null);
      leap(y1);
      d3.select(root).transition()
          .duration(duration)
          .tween("scrollTop", tween(yTarget = y1))
          .each("end", function() { yTarget = null; self.on("scroll.stack", scroll); });
    }

    return stack;
  };

  // Don't do anything fancy for iOS.
  if (section.style("display") == "block") return;

  self
      .on("keydown.stack", keydown)
      .on("resize.stack", resize)
      .on("scroll.stack", scroll)
      .on("mousemove.stack", snap);

  resize();
  scroll();

  // if scrolling up, jump to edge of previous slide
  function leap(yNew) {
    if ((yActual == yFloor) && (yNew < yActual)) {
      yFloor--;
      yActual -= .5 - yOffset / size / 2;
      root.scrollTop = yActual * size;
      return true;
    }
  }

  function resize() {
    yOffset = (window.innerHeight - size) / 2;
    yMax = 1 + yOffset / size;

    d3.select("body")
        .style("margin-top", yOffset + "px")
        .style("margin-bottom", yOffset + "px")
        .style("height", (n - .5) * size + yOffset + "px");
  }

  function keydown() {
    var delta;
    switch (d3.event.keyCode) {
      case 39: // right arrow
      if (d3.event.metaKey) return;
      case 40: // down arrow
      case 34: // page down
      delta = d3.event.metaKey ? Infinity : 1; break;
      case 37: // left arrow
      if (d3.event.metaKey) return;
      case 38: // up arrow
      case 33: // page up
      delta = d3.event.metaKey ? -Infinity : -1; break;
      case 32: // space
      delta = d3.event.shiftKey ? -1 : 1;
      break;
      default: return;
    }
    if (timeout) timeout = clearTimeout(timeout);
    if (yTarget == null) {
      yTarget = delta > 0
          ? Math.floor(yActual + (.5 - yOffset / size / 2))
          : Math.ceil(yActual - (.5 - yOffset / size / 2));
    }
    stack.position(yTarget = Math.max(0, Math.min(n - 1, yTarget + delta)));
    d3.event.preventDefault();
  }

  function scroll() {
    var yNew = Math.max(0, root.scrollTop / size);

    // if scrolling up, jump to edge of previous slide
    if (leap(yNew)) return;

    yActual = yNew;
    yFloor = Math.max(0, Math.min(n, Math.floor(yActual)));
    var yError = Math.min(yMax, (yActual % 1) * 2);

    section
        .classed("active", false);

    d3.select(section[0][yFloor])
        .style("-webkit-transform", yError ? "translate3d(0," + (-yError * size) + "px,0)" : null)
        .style("-moz-transform", yError ? "translate(0," + (-yError * size) + "px)" : null)
        .classed("active", yError != yMax);

    d3.select(section[0][yFloor + 1])
        .style("-webkit-transform", yError ? "translate3d(0,0,0)" : null)
        .style("-moz-transform", yError ? "translate(0,0,0)" : null)
        .classed("active", yError > 0);
  }

  function snap() {
    var x = d3.event.screenX, y = d3.event.screenY;
    if (x === screenX && y === screenY) return; // ignore move on scroll
    screenX = x, screenY = y;

    if (yTarget != null) return; // don't snap if already snapping

    var y0 = stack.position(),
        y1 = Math.max(0, Math.round(y0 + .25));

    // if we're before the first slide, or after the last slide, do nothing
    if (y0 <= 0 || y0 >= n - 1.5 + yOffset / size) return;

    // if the previous slide is not visible, immediate jump
    if (y1 > y0 && y1 - y0 < .5 - yOffset / size) root.scrollTop = y1 * size;

    // else transition
    else stack.position(y1);
  }

  function tween(y) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, y * size);
      return function(t) { this.scrollTop = i(t); scroll(); };
    };
  }

  return stack;
})();
