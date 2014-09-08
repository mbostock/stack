function stack() {
  var stack = {},
      size = [1280, 720],
      fontSize = 32,
      sectionHeight,
      windowHeight,
      dispatch = d3.dispatch("scroll", "activate", "deactivate"),
      touchy = "ontouchstart" in document,
      resize = touchy ? resizeTouchy : resizeNoTouchy,
      i = NaN,
      y = 0,
      yt,
      scrollRatio = 1 / 6;

  var section = d3.selectAll("section")
      .style("box-sizing", "border-box")
      .style("line-height", "1.35em")
      .each(initialize);

  var n = section.size();

  var body = d3.select("body")
      .style("margin", 0)
      .style("padding", 0)
      .style("background", "#333");

  if (touchy) {
    section
        .style("position", "relative");

    d3.select(window)
        .on("resize.stack", resize)
        .each(resize);
  } else {
    var background = d3.select("body").insert("div", "section")
        .style("background", "#000")
        .style("box-shadow", "0 8px 16px rgba(0,0,0,.3)")
        .style("padding", "1px 0")
        .style("margin-top", "-1px")
        .style("z-index", 0);

    section
        .style("display", "none")
        .style("opacity", 0)
        .style("z-index", 0);

    var sectionAndBackground = d3.selectAll(section[0].concat(background.node()))
        .style("position", "fixed")
        .style("left", 0)
        .style("top", 0)
        .style("width", "100%");

    var indicator = d3.select("body").append("div")
        .attr("class", "indicator")
      .selectAll("div")
        .data(d3.range(section.size()))
      .enter().append("div")
        .style("position", "absolute")
        .style("z-index", 10)
        .style("left", 0)
        .style("width", "3px")
        .style("background", "linear-gradient(to top,black,white)");

    var sectionPrevious = d3.select(null),
        sectionCurrent = d3.select(section[0][0]),
        sectionNext = d3.select(section[0][1]);

    d3.select(window)
        .on("resize.stack", resize)
        .on("scroll.stack", reposition)
        .on("keydown.stack", keydown)
        .each(resize);

    d3.timer(function() {
      reposition();
      return true;
    });
  }

  function dispatchEvent(event, i) {
    var target = section[0][i], sourceEvent = event.sourceEvent = d3.event;
    try {
      d3.event = event;
      dispatch[event.type].call(target, target.__data__, i);
    } finally {
      d3.event = sourceEvent;
    }
  }

  function initialize(d, i) {
    this.__stack__ = {index: i, active: false};
  }

  function activate() {
    if (!this.__stack__.active) {
      this.__stack__.active = true;
      dispatchEvent({type: "activate"}, this.__stack__.index);
    }
  }

  function deactivate() {
    if (this.__stack__.active) {
      this.__stack__.active = false;
      dispatchEvent({type: "deactivate"}, this.__stack__.index);
    }
  }

  function resizeTouchy() {
    var marginBottom = 20;

    sectionHeight = size[1] / size[0] * innerWidth;
    windowHeight = innerHeight;

    section
        .style("height", sectionHeight + "px")
        .style("box-shadow", "0 4px 4px rgba(0,0,0,.3)")
      .filter(function(d, i) { return i < n - 1; })
        .style("margin-bottom", marginBottom + "px");

    body
        .style("font-size", innerWidth / size[0] * fontSize + "px");
  }

  function resizeNoTouchy() {
    if (sectionHeight) var y0 = y;

    sectionHeight = size[1] / size[0] * innerWidth;
    windowHeight = innerHeight;

    sectionAndBackground
        .style("top", (windowHeight - sectionHeight) / 2 + "px")
        .style("height", sectionHeight + "px");

    indicator
        .style("top", function(i) { return (i + (1 - scrollRatio) / 2) * windowHeight + "px"; })
        .style("height", windowHeight * scrollRatio + "px");

    body
        .style("font-size", innerWidth / size[0] * fontSize + "px")
        .style("height", windowHeight * n + "px");

    // Preserve the current scroll position on resize.
    if (!isNaN(y0)) scrollTo(0, (y = y0) * windowHeight);
  }

  function reposition() {
    var y1 = pageYOffset / windowHeight,
        i1 = Math.max(0, Math.min(n - 1, Math.floor(y1 + (1 + scrollRatio) / 2)));

    if (i !== i1) {
      if (i1 === i + 1) { // advance one
        sectionPrevious.interrupt().style("display", "none").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionPrevious = sectionCurrent.interrupt().style("opacity", 1).style("z-index", 1);
        sectionPrevious.transition().each("end", deactivate);
        sectionCurrent = sectionNext.interrupt().style("opacity", 0).style("z-index", 2).each(activate);
        sectionCurrent.transition().style("opacity", 1);
        sectionNext = d3.select(section[0][i1 + 1]).interrupt().style("display", "block").style("opacity", 0).style("z-index", 0);
      } else if (i1 === i - 1) { // rewind one
        sectionNext.interrupt().style("display", "none").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionNext = sectionCurrent.interrupt().style("opacity", 1).style("z-index", 1);
        sectionNext.transition().each("end", deactivate);
        sectionCurrent = sectionPrevious.interrupt().style("opacity", 0).style("z-index", 2).each(activate);
        sectionCurrent.transition().style("opacity", 1);
        sectionPrevious = d3.select(section[0][i1 - 1]).interrupt().style("display", "block").style("opacity", 0).style("z-index", 0);
      } else { // skip
        sectionPrevious.interrupt().style("display", "none").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionCurrent.interrupt().style("display", "none").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionNext.interrupt().style("display", "none").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionPrevious = d3.select(section[0][i1 - 1]).interrupt().style("display", "block").style("opacity", 0).style("z-index", 0).each(deactivate);
        sectionCurrent = d3.select(section[0][i1]).interrupt().style("display", "block").style("opacity", 1).style("z-index", 2).each(activate);
        sectionNext = d3.select(section[0][i1 + 1]).interrupt().style("display", "block").style("opacity", 0).style("z-index", 0).each(deactivate);
      }
      i = i1;
    }

    dispatchEvent({type: "scroll", offset: y = y1}, i);
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

    var y0 = isNaN(yt) ? y : yt;

    yt = Math.max(0, Math.min(n - 1, (delta > 0
        ? Math.floor(y0 + (1 + scrollRatio) / 2)
        : Math.ceil(y0 - (1 - scrollRatio) / 2)) + delta));

    d3.select(document.documentElement)
        .interrupt()
      .transition()
        .duration(500)
        .tween("scroll", function() {
          var i = d3.interpolateNumber(pageYOffset, yt * windowHeight);
          return function(t) { scrollTo(0, i(t)); };
        })
        .each("end", function() { yt = NaN; });

    d3.event.preventDefault();
  }

  stack.size = function(_) {
    return arguments.length ? (size = [+_[0], +_[1]], resize(), stack) : size;
  };

  stack.scrollRatio = function(_) {
    return arguments.length ? (scrollRatio = +_, resize(), stack) : scrollRatio;
  };

  stack.fontSize = function(_) {
    return arguments.length ? (fontSize = +_, resize(), stack) : fontSize;
  };

  d3.rebind(stack, dispatch, "on");

  return stack;
}
