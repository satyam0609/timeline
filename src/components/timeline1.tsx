"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useResizeObserver } from "@/hooks/useResizeObserver";

/**
 * ZoomableTimeline component
 * --------------------------
 * This component creates an interactive, zoomable timeline using D3.
 * The timeline shows random colored blocks (representing events) between a start and end date.
 * You can zoom in/out and pan to explore different time ranges.
 */

const intervals = [
  {
    key: "5m",
    interval: d3.timeMinute.every(5),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "15m",
    interval: d3.timeMinute.every(15),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "30m",
    interval: d3.timeMinute.every(30),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "1h",
    interval: d3.timeHour.every(1),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "2h",
    interval: d3.timeHour.every(2),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "3h",
    interval: d3.timeHour.every(3),
    format: d3.timeFormat("%I:%M %p"),
  },
  {
    key: "6h",
    interval: d3.timeHour.every(6),
    format: d3.timeFormat("%m/%d %I %p"),
  },
  {
    key: "12h",
    interval: d3.timeHour.every(12),
    format: d3.timeFormat("%m/%d %I %p"),
  },
  {
    key: "1d",
    interval: d3.timeDay.every(1),
    format: d3.timeFormat("%m/%d/%Y"),
  },
  { key: "1w", interval: d3.timeWeek.every(1), format: d3.timeFormat("%b %d") },
  {
    key: "1M",
    interval: d3.timeMonth.every(1),
    format: d3.timeFormat("%b %Y"),
  },
  {
    key: "3M",
    interval: d3.timeMonth.every(3),
    format: d3.timeFormat("%b %Y"),
  },
];

const ZoomableTimeline1 = ({ initialInterval = 4 }) => {
  // Refs for SVG and timeline div
  const svgRef = useRef(null);
  const timelineRef = useRef(null);

  // State to store randomly generated colored blocks
  const [colorBlocks, setColorBlocks] = useState<any>([]);

  /** Layout and timeline configuration **/
  const height = 80;
  const marginRight = 30;
  const marginTop = 20;
  const marginBottom = 30;
  const marginLeft = 30;
  const minLabelSpacing = 100;
  const timelineHeight = 28;

  const startDate = new Date(2025, 6, 1);
  const endDate = new Date(2025, 6, 5);

  // Ref to container div (to measure width dynamically)
  const containerRef = useRef<HTMLDivElement | null>(null);
  // const [width, setWidth] = useState(0);
  const { width } = useResizeObserver(containerRef);

  /**
   * useLayoutEffect — runs synchronously after all DOM mutations.
   * Used here to measure container width immediately before painting,
   * so SVG sizing is accurate (important for D3 scales).
   */
  // useLayoutEffect(() => {
  //   if (containerRef.current) {
  //     const newWidth = containerRef.current.offsetWidth;
  //     setWidth(newWidth);
  //   }
  // }, []);

  // useLayoutEffect(() => {
  //   if (!containerRef.current) return;
  //   const observer = new ResizeObserver((entries) => {
  //     for (const entry of entries) {
  //       setWidth(entry.contentRect.width);
  //     }
  //   });
  //   observer.observe(containerRef.current);
  //   return () => observer.disconnect();
  // }, []);

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

  const getInterval = (spanDays: any) => {
    // Use pixel density per minute or days to choose interval

    if (spanDays > 90) {
      return intervals.find((d) => d.key === "1M")!;
    } else if (spanDays > 30) {
      return intervals.find((d) => d.key === "1w")!;
    } else if (spanDays > 7) {
      return intervals.find((d) => d.key === "1d")!;
    } else if (spanDays > 3) {
      return intervals.find((d) => d.key === "12h")!;
    } else if (spanDays > 1) {
      return intervals.find((d) => d.key === "6h")!;
    } else if (spanDays > 0.6) {
      return intervals.find((d) => d.key === "2h")!;
    } else if (spanDays > 0.3) {
      return intervals.find((d) => d.key === "1h")!;
    } else if (spanDays > 0.1) {
      return intervals.find((d) => d.key === "30m")!;
    } else if (spanDays > 0.03) {
      return intervals.find((d) => d.key === "15m")!;
    } else {
      return intervals.find((d) => d.key === "5m")!;
    }
  };

  /**
   * D3 drawing logic
   * ----------------
   * Runs when colorBlocks or dimensions are available.
   */
  useEffect(() => {
    if (!svgRef.current || colorBlocks.length === 0) return;
    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    console.log({ fullSpanMs, fullWidthPx, basePxPerMs });

    const intervalScales = intervals.map((d) => {
      // Estimate duration in milliseconds
      const durationMs = (() => {
        switch (d.key) {
          case "5m":
            return 5 * 60 * 1000;
          case "15m":
            return 15 * 60 * 1000;
          case "30m":
            return 30 * 60 * 1000;
          case "1h":
            return 60 * 60 * 1000;
          case "2h":
            return 2 * 60 * 60 * 1000;
          case "3h":
            return 3 * 60 * 60 * 1000;
          case "6h":
            return 6 * 60 * 60 * 1000;
          case "12h":
            return 12 * 60 * 60 * 1000;
          case "1d":
            return 24 * 60 * 60 * 1000;
          case "1w":
            return 7 * 24 * 60 * 60 * 1000;
          case "1M":
            return 30 * 24 * 60 * 60 * 1000;
          case "3M":
            return 90 * 24 * 60 * 60 * 1000;
          default:
            return 1 * 60 * 1000;
        }
      })();

      const zoomScale = minLabelSpacing / durationMs / basePxPerMs;
      return { key: d.key, zoomScale: +zoomScale.toFixed(2) };
    });

    console.log(intervalScales, "----intervalScale");
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

    // console.log(x, "------------scale");

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
    const xAxis = (g: any, x: any) => {
      const domain = x.domain();
      const range = x.range();
      const spanMs = domain[1] - domain[0];
      const spanHours = spanMs / (1000 * 60 * 60);
      const spanDays = spanHours / 24;
      const pixelWidth = range[1] - range[0];

      // Number of labels that can fit visually
      const maxTicks = Math.floor(pixelWidth / minLabelSpacing);
      //   console.log({ spanMs, spanHours, spanDays, pixelWidth, maxTicks });

      /***
       * The logic below selects suitable intervals (years, months, days, hours, minutes)
       * based on how "zoomed in" you are.
       * Example:
       *  - If you're looking at 1-day range → show hourly ticks like "Jul 01 03PM"
       *  - If you're looking at 1-hour range → show minute ticks like "03:15PM"
       */
      const pxPerMin = pixelWidth / (spanMs / (1000 * 60));
      const { interval, format } = getInterval(spanDays);
      const tickValues = x.ticks(interval);

      g.call(
        d3
          .axisBottom(x)
          .tickValues(tickValues)
          .tickSizeOuter(0)
          .tickFormat(format as any)
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
      .scaleExtent([1, 50])
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
    function zoomed(event: any) {
      const xz = event.transform.rescaleX(x);
      gx.call(xAxis, xz);
      gx.select(".domain").remove();

      const currentZoom = event.transform.k;
      console.log("Current zoom level:", currentZoom.toFixed(2));

      // (optional) Match current interval
      const closest = intervalScales.reduce((prev, curr) =>
        Math.abs(curr.zoomScale - currentZoom) <
        Math.abs(prev.zoomScale - currentZoom)
          ? curr
          : prev
      );
      console.log(
        `Closest interval: ${closest.key} (ideal zoom ${closest.zoomScale})`
      );

      const ticks = xz.ticks(intervals[initialInterval].interval);
      if (ticks.length >= 2) {
        const gapPx = xz(ticks[1]) - xz(ticks[0]);
        const gapMinutes = (ticks[1] - ticks[0]) / (1000 * 60);
        console.log(
          `Current tick gap: ${gapPx.toFixed(1)}px, ${gapMinutes} minutes`
        );
      }
      updateTimeline(xz);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent") // invisible
      .attr("pointer-events", "all");

    // ================================
    // INITIAL ZOOM TO SHOW initialInterval
    // ================================

    // console.log({ desiredTicks, pxPerTick, zoomScale });
    svg
      .call(zoom as any)
      .transition()
      .duration(750)
      .call(
        zoom.scaleTo as any,
        (intervalScales.find((d) => d.key === "2h") as any).zoomScale,
        [x(new Date((startDate.getTime() + endDate.getTime()) / 2)), 0]
      );

    /**
     * updateTimeline(scale)
     * ----------------------
     * Renders the colored blocks as absolute-positioned <div>s
     * based on scaled (zoomed) start and end positions.
     *
     * Example:
     *   If zoomed in, each block appears wider and fewer are visible.
     */
    function updateTimeline(scale: any) {
      if (!timelineRef.current) return;

      // Clear existing blocks
      (timelineRef.current as any).innerHTML = "";

      colorBlocks.forEach((block: any) => {
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
          (timelineRef.current as any).appendChild(div);
        }
      });
    }

    // Initial timeline render
    updateTimeline(x);
  }, [colorBlocks, width]);

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
            width: `${width - marginLeft - marginRight}px`,
            height: `${timelineHeight}px`,
            marginLeft: `${marginLeft}px`,
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

export default ZoomableTimeline1;
