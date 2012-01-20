(function() {

var section = d3.selectAll("section"),
    self = d3.select(window),
    timeout,
    padding = 40,
    size = 800,
    snapping,
    n = section[0].length;

self
    .on("scroll", scroll)
    .on("resize", resize);

scroll();
resize();

section.style("z-index", function(d, i) { return n - i; });

function resize() {
  d3.select("body")
      .style("margin-top", (window.innerHeight - size) / 2 + "px")
      .style("height", (n - .5) * size + n * padding + "px");
}

function scroll() {
  var y = (document.documentElement.scrollTop || document.body.scrollTop) / (size + padding),
      dy = Math.min(1.1, (y % 1) * 2),
      i = Math.max(0, Math.min(n, Math.floor(y)));

  var prev = d3.select(section[0][i]),
      next = d3.select(section[0][i + 1]);

  section
      .classed("active", false);

  prev
      .style("-webkit-transform", "translate3d(0," + (-dy * size) + "px,0)")
      .style("-moz-transform", "translate(0," + (-dy * size) + "px)")
      .style("opacity", null)
      .classed("active", true);

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
  var y = document.body.scrollTop / (size + padding),
      dy = Math.min(1.1, (y % 1) * 2);

//   snapping = true;
//   document.body.scrollTop += 50;
}

})();
