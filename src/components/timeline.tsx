"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * ZoomableTimeline component
 * --------------------------
 * This component creates an interactive, zoomable timeline using D3.
 * The timeline shows random colored blocks (representing events) between a start and end date.
 * You can zoom in/out and pan to explore different time ranges.
 */

const ZoomableTimeline = () => {
  // Refs for SVG and timeline div
  const svgRef = useRef(null);
  const timelineRef = useRef(null);

  // State to store randomly generated colored blocks
  const [colorBlocks, setColorBlocks] = useState([]);

  /** Layout and timeline configuration **/
  const height = 80;
  const marginRight = 30;
  const marginTop = 20;
  const marginBottom = 30;
  const marginLeft = 30;
  const minLabelSpacing = 100;
  const timelineHeight = 28;

  const startDate = new Date(2025, 6, 1);
  const endDate = new Date(2025, 6, 2);

  // Ref to container div (to measure width dynamically)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  /**
   * useLayoutEffect — runs synchronously after all DOM mutations.
   * Used here to measure container width immediately before painting,
   * so SVG sizing is accurate (important for D3 scales).
   */
  useLayoutEffect(() => {
    if (containerRef.current) {
      const newWidth = containerRef.current.offsetWidth;
      setWidth(newWidth);
    }
  }, []);

  /**
   * generateColorBlocks()
   * ---------------------
   * Creates random "event" blocks between startDate and endDate.
   * Each block has:
   *  - start time
   *  - end time
   *  - random color
   *
   * Example:
   * Suppose startDate = July 1, 00:00
   * It may create:
   *   - Block 1: 00:00–03:15 (blue)
   *   - Block 2: 03:15–06:00 (pink)
   *   - ...
   */
  const generateColorBlocks = () => {
    const blocks = [];
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E2",
    ];
    const current = new Date(startDate);

    while (current < endDate) {
      const duration = Math.random() * 3600000 * 4; // 0-4 hours
      const blockEnd = new Date(
        Math.min(current.getTime() + duration, endDate.getTime())
      );

      blocks.push({
        start: new Date(current),
        end: blockEnd,
        color: colors[Math.floor(Math.random() * colors.length)],
      });

      current.setTime(blockEnd.getTime());
    }

    return blocks;
  };

  useEffect(() => {
    setColorBlocks(generateColorBlocks());
  }, []);

  /**
   * D3 drawing logic
   * ----------------
   * Runs when colorBlocks or dimensions are available.
   */
  useEffect(() => {
    if (!svgRef.current || colorBlocks.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    /**
     * Create X scale (time scale)
     * Maps Date → pixel position.
     * Example:
     *   x(startDate) = marginLeft (left side)
     *   x(endDate)   = width - marginRight (right side)
     */
    const x = d3
      .scaleUtc()
      .domain([startDate, endDate])
      .range([marginLeft, width - marginRight]);

    /**
     * Custom Axis Generator
     * Dynamically adjusts tick spacing, format, and interval
     * depending on the zoom level and visible time range.
     *
     * Example:
     *  - If viewing a full year → show monthly ticks.
     *  - If zoomed to 1 day → show hourly ticks.
     *  - If zoomed to 1 hour → show minute ticks.
     */
    const xAxis = (g, x) => {
      const domain = x.domain();
      const range = x.range();
      const spanMs = domain[1] - domain[0];
      const spanHours = spanMs / (1000 * 60 * 60);
      const spanDays = spanHours / 24;
      const pixelWidth = range[1] - range[0];

      // Number of labels that can fit visually
      const maxTicks = Math.floor(pixelWidth / minLabelSpacing);

      /***
       * The logic below selects suitable intervals (years, months, days, hours, minutes)
       * based on how "zoomed in" you are.
       * Example:
       *  - If you're looking at 1-day range → show hourly ticks like "Jul 01 03PM"
       *  - If you're looking at 1-hour range → show minute ticks like "03:15PM"
       */
      let tickInterval, format;

      if (spanDays > 730) {
        const yearInterval = Math.max(1, Math.ceil(spanDays / 365 / maxTicks));
        tickInterval = d3.timeYear.every(yearInterval);
        format = d3.timeFormat("%Y");
      } else if (spanDays > 365) {
        const monthInterval = Math.max(1, Math.ceil(spanDays / 30 / maxTicks));
        tickInterval = d3.timeMonth.every(monthInterval);
        format = d3.timeFormat("%b %Y");
      } else if (spanDays > 60) {
        const monthInterval = Math.max(1, Math.ceil(spanDays / 30 / maxTicks));
        tickInterval = d3.timeMonth.every(monthInterval);
        format = d3.timeFormat("%b %Y");
      } else if (spanDays > 30) {
        const weekInterval = Math.max(1, Math.ceil(spanDays / 7 / maxTicks));
        tickInterval = d3.timeWeek.every(weekInterval);
        format = d3.timeFormat("%b %d");
      } else if (spanDays > 7) {
        const dayInterval = Math.max(1, Math.ceil(spanDays / maxTicks));
        tickInterval = d3.timeDay.every(dayInterval);
        format = d3.timeFormat("%b %d");
      } else if (spanDays > 2) {
        const hourInterval = Math.max(1, Math.ceil(spanHours / maxTicks));
        if (hourInterval >= 12) {
          tickInterval = d3.timeHour.every(12);
        } else if (hourInterval >= 6) {
          tickInterval = d3.timeHour.every(6);
        } else if (hourInterval >= 3) {
          tickInterval = d3.timeHour.every(3);
        } else {
          tickInterval = d3.timeHour.every(1);
        }
        format = d3.timeFormat("%b %d %I%p");
      } else if (spanDays > 1) {
        const hourInterval = Math.max(1, Math.ceil(spanHours / maxTicks));
        if (hourInterval >= 6) {
          tickInterval = d3.timeHour.every(6);
        } else if (hourInterval >= 3) {
          tickInterval = d3.timeHour.every(3);
        } else {
          tickInterval = d3.timeHour.every(1);
        }
        format = d3.timeFormat("%b %d %I%p");
      } else if (spanHours > 6) {
        const hourInterval = Math.max(1, Math.ceil(spanHours / maxTicks));
        if (hourInterval >= 3) {
          tickInterval = d3.timeHour.every(3);
        } else {
          tickInterval = d3.timeHour.every(1);
        }
        format = d3.timeFormat("%I:%M%p");
      } else if (spanHours > 3) {
        const hourInterval = Math.max(1, Math.ceil(spanHours / maxTicks));
        tickInterval = d3.timeHour.every(hourInterval);
        format = d3.timeFormat("%I:%M%p");
      } else if (spanHours > 1) {
        const minuteInterval = Math.max(
          1,
          Math.ceil((spanHours * 60) / maxTicks)
        );
        if (minuteInterval >= 30) {
          tickInterval = d3.timeMinute.every(30);
        } else if (minuteInterval >= 15) {
          tickInterval = d3.timeMinute.every(15);
        } else if (minuteInterval >= 5) {
          tickInterval = d3.timeMinute.every(5);
        } else {
          tickInterval = d3.timeMinute.every(1);
        }
        format = d3.timeFormat("%I:%M%p");
      } else if (spanHours > 0.5) {
        const minuteInterval = Math.max(
          1,
          Math.ceil((spanHours * 60) / maxTicks)
        );
        if (minuteInterval >= 15) {
          tickInterval = d3.timeMinute.every(15);
        } else if (minuteInterval >= 5) {
          tickInterval = d3.timeMinute.every(5);
        } else {
          tickInterval = d3.timeMinute.every(1);
        }
        format = d3.timeFormat("%I:%M%p");
      } else {
        const minuteInterval = Math.max(
          1,
          Math.ceil((spanHours * 60) / maxTicks)
        );
        if (minuteInterval >= 5) {
          tickInterval = d3.timeMinute.every(5);
        } else {
          tickInterval = d3.timeMinute.every(1);
        }
        format = d3.timeFormat("%I:%M%p");
      }

      // Get tick values based on interval
      let tickValues = x.ticks(tickInterval);

      // Ensure start and end are included as ticks
      if (spanDays <= 180 && spanDays > 1) {
        const firstTick = tickValues[0];
        const lastTick = tickValues[tickValues.length - 1];
        const threshold = spanMs * 0.05;

        if (!firstTick || Math.abs(domain[0] - firstTick) > threshold) {
          tickValues.unshift(domain[0]);
        }

        if (!lastTick || Math.abs(domain[1] - lastTick) > threshold) {
          tickValues.push(domain[1]);
        }

        tickValues = tickValues
          .filter((d, i, arr) => i === 0 || Math.abs(d - arr[i - 1]) > 1000)
          .sort((a, b) => a - b);
      }

      // Apply axis
      g.call(
        d3
          .axisBottom(x)
          .tickValues(tickValues)
          .tickSizeOuter(0)
          .tickFormat(format)
      )
        .selectAll("text")
        .attr("y", -10)
        .style("text-anchor", "middle");
    };

    /**
     * D3 Zoom Behavior
     * ----------------
     * Allows zooming in/out and panning horizontally.
     * - `scaleExtent`: how far you can zoom (1x–32x)
     * - `extent`: visible area
     * - `translateExtent`: restricts panning bounds
     *
     * Example:
     *  - Pinch or scroll to zoom in/out.
     *  - Drag left/right to move along timeline.
     */
    const zoom = d3
      .zoom()
      .scaleExtent([1, 32])
      .extent([
        [marginLeft, 0],
        [width - marginRight, height],
      ])
      .translateExtent([
        [marginLeft, -Infinity],
        [width - marginRight, Infinity],
      ])
      .on("zoom", zoomed);

    // Background rectangle for capturing zoom events
    // svg
    //   .append("rect")
    //   .attr("width", width)
    //   .attr("height", height)
    //   .attr("fill", "#fafafa");

    // Create and render bottom axis
    const gx = svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis, x);

    gx.select(".domain").remove();

    /**
     * Function that executes when user zooms
     * Updates the x-scale and redraws both axis and timeline blocks.
     */
    function zoomed(event) {
      const xz = event.transform.rescaleX(x);
      gx.call(xAxis, xz);
      gx.select(".domain").remove();
      updateTimeline(xz);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent") // invisible
      .attr("pointer-events", "all");

    /**
     * Initial zoom — set default view to 2x centered around mid-July 15.
     */
    svg
      .call(zoom)
      .transition()
      .duration(750)
      .call(zoom.scaleTo, 2, [x(new Date(2025, 6, 15)), 0]);

    /**
     * updateTimeline(scale)
     * ----------------------
     * Renders the colored blocks as absolute-positioned <div>s
     * based on scaled (zoomed) start and end positions.
     *
     * Example:
     *   If zoomed in, each block appears wider and fewer are visible.
     */
    function updateTimeline(scale) {
      if (!timelineRef.current) return;

      // Clear existing blocks
      timelineRef.current.innerHTML = "";

      colorBlocks.forEach((block) => {
        const startPos = scale(block.start);
        const endPos = scale(block.end);

        // Calculate positions relative to the scale range
        const leftPos = startPos - marginLeft;
        const blockWidth = endPos - startPos;

        // Only render if block is visible in the viewport
        if (endPos >= marginLeft && startPos <= width - marginRight) {
          const div = document.createElement("div");
          div.style.position = "absolute";
          div.style.left = `${leftPos}px`;
          div.style.width = `${blockWidth}px`;
          div.style.height = "100%";
          div.style.backgroundColor = block.color;
          div.style.borderRight = "1px solid white";
          div.style.boxSizing = "border-box";
          timelineRef.current.appendChild(div);
        }
      });
    }

    // Initial timeline render
    updateTimeline(x);
  }, [colorBlocks]);

  return (
    <div className="flex flex-col items-center p-5 ">
      <div
        className="bg-white p-5 rounded-lg shadow-lg w-full relative"
        ref={containerRef}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "block",
          }}
        />

        <div
          className="absolute top-12"
          style={{
            width: `${width - marginLeft - marginRight - 39}px`,
            height: `${timelineHeight}px`,
            marginLeft: `${marginLeft - 1}px`,
            marginTop: "10px",
            border: "1px solid #ccc",
            overflow: "hidden",
            pointerEvents: "none",
          }}
          ref={timelineRef}
        />
      </div>
    </div>
  );
};

export default ZoomableTimeline;
