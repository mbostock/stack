function stack() {
  var stack = {},
      size = [1280, 720],
      fontSize = 32,
      sectionHeight,
      windowHeight,
      dispatch = d3.dispatch("scroll", "activate", "deactivate"),
      i = NaN,
      y = 0,
      yt,
      scrollRatio = 1 / 4;

  var background = d3.select("body").insert("div", "section")
      .style("box-shadow", "0 8px 16px rgba(0,0,0,.3)");

  var section = d3.selectAll("section")
      .style("display", "none")
      .style("box-sizing", "border-box")
      .style("line-height", "1.35em");

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
      .style("left", 0)
      .style("width", "3px")
      .style("background", "linear-gradient(to top,transparent,white)");

  var sectionCurrent = d3.select(section[0][0]).style("display", "block"),
      sectionNext = d3.select(section[0][1]).style("display", "block");

  var n = section.size();

  var body = d3.select("body")
      .style("margin", 0)
      .style("padding", 0)
      .style("background", "#333");

  d3.select(window)
      .on("resize.stack", resize)
      .on("scroll.stack", reposition)
      .on("keydown.stack", keydown)
      .each(resize);

  d3.timer(function() {
    reposition();
    return true;
  });

  function resize() {
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
        i1 = Math.max(0, Math.min(n - 1, Math.floor(y1)));

    if (i !== i1) {
      if (i1 === i + 1) { // advance one
        sectionCurrent.style("display", "none");
        sectionCurrent = sectionNext;
        sectionNext = d3.select(section[0][i1 + 1]);
        dispatch.deactivate.call(stack, i);
        dispatch.activate.call(stack, i1 + 1);
      } else if (i1 === i - 1) { // rewind one
        sectionNext.style("display", "none");
        sectionNext = sectionCurrent;
        sectionCurrent = d3.select(section[0][i1]);
        dispatch.deactivate.call(stack, i + 1);
        dispatch.activate.call(stack, i1);
      } else { // skip
        sectionCurrent.style("display", "none");
        sectionNext.style("display", "none");
        sectionCurrent = d3.select(section[0][i1]);
        sectionNext = d3.select(section[0][i1 + 1]);
        if (!isNaN(i)) dispatch.deactivate.call(stack, i + 1), dispatch.deactivate.call(stack, i);
        dispatch.activate.call(stack, i1), dispatch.activate.call(stack, i1 + 1);
      }
      sectionCurrent.style("display", "block").style("opacity", 1);
      sectionNext.style("display", "block");
      i = i1;
    }

    if (y1 - i1 > (1 - scrollRatio) / 2) {
      sectionNext.style("display", "block").style("opacity", Math.min(1, (y1 - i1 - (1 - scrollRatio) / 2) / scrollRatio));
    } else {
      sectionNext.style("display", "none");
    }

    dispatch.scroll.call(stack, y = y1);
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
        ? Math.floor(y0 + (1 - scrollRatio) / 2)
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
