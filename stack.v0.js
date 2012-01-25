var stack = (function() {
  var stack = {},
      section = d3.selectAll("section"),
      self = d3.select(window),
      root = document.body,
      timeout,
      duration = 750,
      size = 800,
      snapping,
      offset,
      max,
      n = section[0].length;

  // Detect whether to scroll with documentElement or body.
  root.scrollTop = 1;
  if (!root.scrollTop) root = document.documentElement;
  else root.scrollTop = 0;

  section
      .classed("stack", true)
      .style("z-index", function(d, i) { return n - i; });

  // TODO Do something magical with touch events.
  if (section.style("display") == "block") return;

  self
      .on("resize.stack", resize)
      .on("scroll.stack", scroll);

  resize();
  scroll();

  stack.position = function(x1) {
    if (arguments.length < 1) return root.scrollTop / size;

    x1 = Math.floor(x1);
    if (x1 >= section[0].length) x1 = section[0].length - 1;
    else if (x1 < 0) x1 = Math.max(0, section[0].length + x1);
    var x0 = root.scrollTop / size;
    if (x1 > x0) x1 -= .49 - offset / size / 2;

    d3.select(root).transition().duration(duration).tween("scrollTop", tween(x1));
    return stack;
  };

  function resize() {
    offset = (window.innerHeight - size) / 2;
    max = 1 + offset / size;

    d3.select("body")
        .style("margin-top", offset + "px")
        .style("margin-bottom", offset + "px")
        .style("height", (n - .5) * size + offset + "px");
  }

  function scroll() {
    var y = root.scrollTop / size,
        dy = Math.min(max, (y % 1) * 2),
        i = Math.max(0, Math.min(n, Math.floor(y)));

    var prev = d3.select(section[0][i]),
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
    if (!snapping) timeout = setTimeout(snap, 500);
    snapping = false;
  }

  function snap() {
//     var y = root.scrollTop / size,
//         dy = Math.min(max, (y % 1) * 2);
  //   snapping = true;
  //   document.body.scrollTop += 50;
  }

  function tween(x) {
    return function() {
      var i = d3.interpolateNumber(this.scrollTop, x * size);
      return function(t) { this.scrollTop = i(t); };
    };
  }

  return stack;
})();
