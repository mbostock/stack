var stack = (function() {
  var stack = {},
      section = d3.selectAll("section"),
      self = d3.select(window),
      root = document.body,
      timeout,
      duration = 750,
      size,
      position,
      offset,
      max,
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
  stack.position = function(x1) {
    if (arguments.length < 1) return root.scrollTop / size;
    var x0 = root.scrollTop / size;

    // clamp and round
    if (x1 >= section[0].length) x1 = section[0].length - 1;
    else if (x1 < 0) x1 = Math.max(0, section[0].length + x1);
    x1 = Math.floor(x1);

    if (x0 - x1) {
      self.on("scroll.stack", null);
      d3.select(root).transition()
          .duration(duration)
          .tween("scrollTop", tween(x1))
          .each("end", function() { self.on("scroll.stack", scroll); });
    }

    return stack;
  };

  // TODO Do something magical with touch events.
  if (section.style("display") == "block") return;

  self
      .on("resize.stack", resize)
      .on("scroll.stack", scroll);

  resize();
  scroll();

  function resize() {
    offset = (window.innerHeight - size) / 2;
    max = 1 + offset / size;

    d3.select("body")
        .style("margin-top", offset + "px")
        .style("margin-bottom", offset + "px")
        .style("height", (n - .5) * size + offset + "px");
  }

  function scroll() {
    var y = root.scrollTop / size;

    // if scrolling up, jump to edge of previous slide
    if (!(position % 1) && (y < position)) return root.scrollTop = (position -= .5 - offset / size / 2) * size;

    var dy = Math.min(max, (y % 1) * 2),
        i = Math.max(0, Math.min(n, Math.floor(y))),
        prev = d3.select(section[0][i]),
        next = d3.select(section[0][i + 1]);

    section
        .classed("active", false);

    prev
        .style("-webkit-transform", "translate3d(0," + (-dy * size) + "px,0)")
        .style("-moz-transform", "translate(0," + (-dy * size) + "px)")
        .style("opacity", null)
        .classed("active", dy != max);

    next
        .style("-webkit-transform", null)
        .style("-moz-transform", null)
        .style("opacity", dy)
        .classed("active", true);

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(snap, 250);
  }

  function snap() {
    var x0 = stack.position(),
        x1 = position = Math.max(0, Math.round(x0 + .25));

    // immediate jump if the previous slide is not visible
    if (x1 > x0 && x1 - x0 < .5 - offset / size / 2) return root.scrollTop = x1 * size;

    // otherwise, smooth transition
    stack.position(x1);
  }

  function tween(x) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, x * size);
      return function(t) { this.scrollTop = i(t); scroll(); };
    };
  }

  return stack;
})();
