var stack = (function() {
  var stack = {},
      event = d3.dispatch("activate", "deactivate"),
      section = d3.selectAll("section"),
      self = d3.select(window),
      body = document.body,
      root = document.documentElement,
      timeout,
      duration = 250,
      ease = "cubic-in-out",
      screenY,
      size,
      yActual,
      yFloor,
      yTarget,
      yActive = -1,
      yMax,
      yOffset,
      n = section[0].length;

  // Invert the z-index so the earliest slides are on top.
  section.classed("stack", true).style("z-index", function(d, i) { return n - i; });

  // Detect the slide height (by showing an active slide).
  section.classed("active", true);
  size = section.node().getBoundingClientRect().height;
  section.classed("active", false);

  // Sets the stack position.
  stack.position = function(y1) {
    var y0 = body.scrollTop / size;
    if (arguments.length < 1) return y0;

    // clamp and round
    if (y1 >= n) y1 = n - 1;
    else if (y1 < 0) y1 = Math.max(0, n + y1);
    y1 = Math.floor(y1);

    if (y0 - y1) {
      self.on("scroll.stack", null);
      leap(y1);
      d3.select(body).transition()
          .duration(duration)
          .ease(ease)
          .tween("scrollTop", tween(yTarget = y1))
          .each("end", function() { yTarget = null; self.on("scroll.stack", scroll); });
    }

    location.replace("#" + y1);

    return stack;
  };

  // Don't do anything fancy for iOS.
  if (section.style("display") == "block") return;

  self
      .on("keydown.stack", keydown)
      .on("resize.stack", resize)
      .on("scroll.stack", scroll)
      .on("mousemove.stack", snap)
      .on("hashchange.stack", hashchange);

  resize();
  hashchange();
  scroll();

  // if scrolling up, jump to edge of previous slide
  function leap(yNew) {
    if ((yActual < n - 1) && (yActual == yFloor) && (yNew < yActual)) {
      yActual -= .5 - yOffset / size / 2;
      scrollTo(0, yActual * size);
      reactivate();
      return true;
    }
  }

  function reactivate() {
    var yNewActive = Math.floor(yActual) + (yActual % 1 ? .5 : 0);
    if (yNewActive !== yActive) {
      var yNewActives = {};
      yNewActives[Math.floor(yNewActive)] = 1;
      yNewActives[Math.ceil(yNewActive)] = 1;
      if (yActive >= 0) {
        var yOldActives = {};
        yOldActives[Math.floor(yActive)] = 1;
        yOldActives[Math.ceil(yActive)] = 1;
        for (var i in yOldActives) {
          if (i in yNewActives) delete yNewActives[i];
          else event.deactivate.call(section[0][+i], +i);
        }
      }
      for (var i in yNewActives) {
        event.activate.call(section[0][+i], +i);
      }
      yActive = yNewActive;
    }
  }

  function resize() {
    yOffset = (window.innerHeight - size) / 2;
    yMax = 1 + yOffset / size;

    d3.select(body)
        .style("margin-top", yOffset + "px")
        .style("margin-bottom", yOffset + "px")
        .style("height", (n - .5) * size + yOffset + "px");
  }

  function hashchange() {
    var hash = +location.hash.slice(1);
    if (!isNaN(hash) && hash !== yFloor) stack.position(hash);
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
    if (yTarget == null) yTarget = (delta > 0 ? Math.floor : Math.ceil)(yActual == yFloor ? yFloor : yActual + (.5 - yOffset / size / 2));
    stack.position(yTarget = Math.max(0, Math.min(n - 1, yTarget + delta)));
    d3.event.preventDefault();
  }

  function scroll() {
    // Detect whether to scroll with documentElement or body.
    if (body !== root && root.scrollTop) body = root;

    var yNew = Math.max(0, body.scrollTop / size);
    if (yNew >= n - 1.51 + yOffset / size) yNew = n - 1;

    // if scrolling up, jump to edge of previous slide
    if (leap(yNew)) return;

    var yNewFloor = Math.max(0, Math.floor(yActual = yNew)),
        yError = Math.min(yMax, (yActual % 1) * 2);

    if (yFloor != yNewFloor) {
      location.replace("#" + yNewFloor);
      yFloor = yNewFloor;
    }

    section
        .classed("active", false);

    d3.select(section[0][yFloor])
        .style("-webkit-transform", yError ? "translate3d(0," + (-yError * size) + "px,0)" : null)
        .style("-o-transform", yError ? "translate(0," + (-yError * size) + "px)" : null)
        .style("-moz-transform", yError ? "translate(0," + (-yError * size) + "px)" : null)
        .style("transform", yError ? "translate(0," + (-yError * size) + "px)" : null)
        .classed("active", yError != yMax);

    d3.select(section[0][yFloor + 1])
        .style("-webkit-transform", yError ? "translate3d(0,0,0)" : null)
        .style("-o-transform", yError ? "translate(0,0)" : null)
        .style("-moz-transform", yError ? "translate(0,0)" : null)
        .style("transform", yError ? "translate(0,0)" : null)
        .classed("active", yError > 0);

    reactivate();
  }

  function snap() {
    var y = d3.event.clientY;
    if (y === screenY) return; // ignore move on scroll
    screenY = y;

    if (yTarget != null) return; // don't snap if already snapping

    var y0 = stack.position(),
        y1 = Math.max(0, Math.round(y0 + .25));

    // if we're before the first slide, or after the last slide, do nothing
    if (y0 <= 0 || y0 >= n - 1.51 + yOffset / size) return;

    // if the previous slide is not visible, immediate jump
    if (y1 > y0 && y1 - y0 < .5 - yOffset / size) scrollTo(0, y1 * size);

    // else transition
    else if (y1 !== y0) stack.position(y1);
  }

  function tween(y) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, y * size);
      return function(t) { scrollTo(0, i(t)); scroll(); };
    };
  }

  stack.duration = function(_) {
    if (!arguments.length) return duration;
    duration = _;
    return stack;
  };

  stack.ease = function(_) {
    if (!arguments.length) return ease;
    ease = _;
    return stack;
  };

  d3.rebind(stack, event, "on");

  return stack;
})();
