(function() {

var section = d3.selectAll("section"),
    self = d3.select(window),
    timeout,
    size = 800,
    snapping,
    max,
    n = section[0].length;

self
    .on("resize", resize)
    .on("scroll", scroll);

resize();
scroll();

section.style("z-index", function(d, i) { return n - i; });

function resize() {
  var offset = (window.innerHeight - size) / 2;

  max = 1 + offset / size;

  d3.select("body")
      .style("margin-top", offset + "px")
      .style("margin-bottom", offset + "px")
      .style("height", (n - .5) * size + offset + "px");
}

function scroll() {
  var y = (document.documentElement.scrollTop || document.body.scrollTop) / size,
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
  var y = document.body.scrollTop / size,
      dy = Math.min(max, (y % 1) * 2);

//   snapping = true;
//   document.body.scrollTop += 50;
}

})();
