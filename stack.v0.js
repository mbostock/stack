var stack = (function() {
  var stack = {},
      section = d3.selectAll("section"),
      self = d3.select(window),
      root = document.body,
      timeout,
      duration = 750,
      size,
      yActual,
      yFloor,
      yTarget,
      yMax,
      yOffset,
      n = section[0].length;

  // Detect whether to scroll with documentElement or body.
  root.scrollTop = 1;
  if (!root.scrollTop) root = document.documentElement;
  else root.scrollTop = 0;

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
      d3.select(root).transition()
          .duration(duration)
          .tween("scrollTop", tween(y1))
          .each("end", function() { yTarget = null; self.on("scroll.stack", scroll); });
    }

    return stack;
  };

  // Don't do anything fancy for iOS.
  if (section.style("display") == "block") return;

  self
      .on("keydown.stack", keydown)
      .on("resize.stack", resize)
      .on("scroll.stack", scroll);

  resize();
  scroll();

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
      case 40: // down arrow
      case 34: // page down
      case 39: // right arrow
      delta = d3.event.metaKey ? Infinity : 1; break;
      case 38: // up arrow
      case 33: // page up
      case 37: // left arrow
      delta = d3.event.metaKey ? -Infinity : -1; break;
      case 32: // space
      delta = d3.event.shiftKey ? -1 : 1;
      break;
      default: return;
    }
    if (yTarget == null) yTarget = Math.round(yActual + .25);
    stack.position(yTarget = Math.max(0, Math.min(n - 1, yTarget + delta)));
    d3.event.preventDefault();
  }

  function scroll() {
    var yNew = root.scrollTop / size;

    // if scrolling up, jump to edge of previous slide
    if ((yActual == yFloor) && (yNew < yActual)) {
      yFloor--;
      yActual -= .5 - yOffset / size / 2;
      return root.scrollTop = yActual * size;
    }

    yActual = yNew;
    yFloor = Math.max(0, Math.min(n, Math.floor(yActual)));

    var yError = Math.min(yMax, (yActual % 1) * 2);

    section
        .classed("active", false);

    d3.select(section[0][yFloor])
        .style("-webkit-transform", "translate3d(0," + (-yError * size) + "px,0)")
        .style("-moz-transform", "translate(0," + (-yError * size) + "px)")
        .style("opacity", null)
        .classed("active", yError != yMax);

    d3.select(section[0][yFloor + 1])
        .style("-webkit-transform", null)
        .style("-moz-transform", null)
        .style("opacity", yError)
        .classed("active", true);

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(snap, 250);
  }

  function snap() {
    var y0 = stack.position(),
        y1 = Math.max(0, Math.round(y0 + .25));

    // immediate jump if the previous slide is not visible; else transition
    if (y1 > y0 && y1 - y0 < .5 - yOffset / size / 2) root.scrollTop = y1 * size;
    else stack.position(y1);

    snapped = true;
  }

  function tween(y) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, y * size);
      return function(t) { this.scrollTop = i(t); scroll(); };
    };
  }

  return stack;
})();
