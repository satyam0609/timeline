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

type IntervalConfig = {
  key: string;
  interval: d3.CountableTimeInterval | d3.TimeInterval;
  format: (date: Date) => string;
  minutes: number;
};

const intervals: IntervalConfig[] = [
  {
    key: "5m",
    interval: d3.timeMinute.every(5)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 5,
  },
  {
    key: "15m",
    interval: d3.timeMinute.every(15)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 15,
  },
  {
    key: "30m",
    interval: d3.timeMinute.every(30)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 30,
  },
  {
    key: "1h",
    interval: d3.timeHour.every(1)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 60,
  },
  {
    key: "2h",
    interval: d3.timeHour.every(2)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 120,
  },
  {
    key: "3h",
    interval: d3.timeHour.every(3)!,
    format: d3.timeFormat("%I:%M %p"),
    minutes: 180,
  },
  {
    key: "6h",
    interval: d3.timeHour.every(6)!,
    format: d3.timeFormat("%m/%d %I %p"),
    minutes: 360,
  },
  {
    key: "12h",
    interval: d3.timeHour.every(12)!,
    format: d3.timeFormat("%m/%d %I %p"),
    minutes: 720,
  },
  {
    key: "1d",
    interval: d3.timeDay.every(1)!,
    format: d3.timeFormat("%m/%d/%Y"),
    minutes: 1440,
  },
  {
    key: "1w",
    interval: d3.timeWeek.every(1)!,
    format: d3.timeFormat("%b %d"),
    minutes: 10080,
  },
  {
    key: "1M",
    interval: d3.timeMonth.every(1)!,
    format: d3.timeFormat("%b %Y"),
    minutes: 43200,
  },
  {
    key: "3M",
    interval: d3.timeMonth.every(3)!,
    format: d3.timeFormat("%b %Y"),
    minutes: 129600,
  },
];

interface timelineConfigProp {
  initialInterval: number;
  scrollTo: "end" | "middle" | "start";
}

interface ZoomableTimelineProps {
  timelineConfig: timelineConfigProp;
}

const ZoomableTimeline3 = ({
  timelineConfig = { initialInterval: 5, scrollTo: "start" },
}: ZoomableTimelineProps) => {
  // Refs for SVG and timeline div
  let intervalVariant; // just the type
  intervalVariant = "adjust";
  const svgRef = useRef(null);
  const timelineRef = useRef(null);
  const containerRef = useRef(null);
  const { width } = useResizeObserver(containerRef);
  const [colorBlocks, setColorBlocks] = useState([]);
  const [zoomInfo, setZoomInfo] = useState({
    current: "",
    currentPxPerMin: 0,
    zoomLevel: 0,
    zoomIn: "",
    zoomOut: "",
  });

  /** Layout and timeline configuration **/
  const height = 80;
  const marginRight = 30;
  const marginTop = 20;
  const marginLeft = 30;
  const timelineHeight = 28;

  const startDate = new Date(2025, 6, 1);
  const endDate = new Date(2025, 9, 1);

  // Measure container width

  /**
   * generateColorBlocks()
   * ---------------------
   * Creates random "event" blocks between startDate and endDate.
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
   * getInterval - determines which interval to use based on current pxPerMin
   * The logic: as you zoom in, pxPerMin increases, so we switch to finer intervals
   */
  const getInterval = (pxPerMin: number): IntervalConfig => {
    if (pxPerMin > 10) return intervals.find((d) => d.key === "5m")!;
    if (pxPerMin > 3) return intervals.find((d) => d.key === "15m")!;
    if (pxPerMin > 1.5) return intervals.find((d) => d.key === "30m")!;
    if (pxPerMin > 0.75) return intervals.find((d) => d.key === "1h")!;
    if (pxPerMin > 0.37) return intervals.find((d) => d.key === "2h")!;
    if (pxPerMin > 0.25) return intervals.find((d) => d.key === "3h")!;
    if (pxPerMin > 0.12) return intervals.find((d) => d.key === "6h")!;
    if (pxPerMin > 0.06) return intervals.find((d) => d.key === "12h")!;
    if (pxPerMin > 0.03) return intervals.find((d) => d.key === "1d")!;
    if (pxPerMin > 0.0014) return intervals.find((d) => d.key === "1M")!;
    return intervals.find((d) => d.key === "3M")!;
  };

  /**
   * D3 drawing logic
   */
  useEffect(() => {
    if (!svgRef.current || colorBlocks.length === 0 || width === 0) return;

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000; // pixels per minute at zoom=1

    console.log({
      fullSpanMs,
      fullWidthPx,
      basePxPerMs,
      basePxPerMin: basePxPerMin.toFixed(4),
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleUtc()
      .domain([startDate, endDate])
      .range([marginLeft, width - marginRight]);

    /**
     * Custom Axis Generator
     * Uses current pxPerMin to determine appropriate interval
     */
    const xAxis = (g: any, x: any) => {
      const domain = x.domain();
      const range = x.range();
      const spanMs = domain[1] - domain[0];
      const pixelWidth = range[1] - range[0];

      const pxPerMin = pixelWidth / (spanMs / (1000 * 60));
      const { interval, format } = getInterval(pxPerMin);
      const tickValues = x.ticks(interval);

      // g.call(
      //   d3
      //     .axisBottom(x)
      //     .tickValues(tickValues)
      //     .tickSizeOuter(0)
      //     .tickFormat(format)
      // )
      //   .selectAll("text")
      //   .attr("y", -10)
      //   .style("text-anchor", "middle");
      const currentInterval = getInterval(pxPerMin);

      const axis = d3
        .axisBottom(x)
        .tickValues(tickValues)
        .tickSizeOuter(0)
        .tickFormat(format as any);

      g.call(axis);

      g.selectAll("text")
        .attr("y", -10)
        .style("text-anchor", "middle")
        .style("display", (d: any, i: number) => {
          // Only skip labels for certain intervals (keep ticks visible)
          if (["6h", "12h", "1d"].includes(currentInterval!.key)) {
            switch (intervalVariant) {
              case "even":
                // Show even labels only
                return i % 2 === 0 ? "block" : "none";

              case "odd":
                // Show odd labels only
                return i % 2 !== 0 ? "block" : "none";

              case "adjust": {
                const ticks = currentInterval.interval.range(
                  startDate,
                  endDate
                );
                const totalTicks = ticks.length;

                if (totalTicks % 2 == 0) {
                  return i % 2 === 0 ? "block" : "none";
                } else {
                  return "block";
                }
              }

              default:
                return "block";
            }
          }
          return "block";
        });
    };

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

    const gx = svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis, x);

    gx.select(".domain").remove();

    function zoomed(event: any) {
      const xz = event.transform.rescaleX(x);
      gx.call(xAxis, xz);
      gx.select(".domain").remove();

      const currentZoom = event.transform.k;
      const currentPxPerMin = basePxPerMin * currentZoom;

      console.log("Current zoom level:", currentZoom.toFixed(2));
      console.log("Current px/min:", currentPxPerMin.toFixed(4));

      // Find which interval we're currently using
      const currentInterval = getInterval(currentPxPerMin);
      const currentIdx = intervals.findIndex(
        (i) => i.key === currentInterval!.key
      );

      // Find next finer and coarser intervals
      const zoomInInterval = currentIdx > 0 ? intervals[currentIdx - 1] : null;
      const zoomOutInterval =
        currentIdx < intervals.length - 1 ? intervals[currentIdx + 1] : null;

      // Calculate zoom levels needed for those intervals
      // For zoom in: we need enough pxPerMin for the finer interval
      // For zoom out: we need less pxPerMin for the coarser interval
      let zoomInText = "Max zoom";
      let zoomOutText = "Min zoom";

      if (zoomInInterval) {
        // Need at least 0.75 px per unit of this interval for it to look good
        const minPxPerInterval = 75;
        const neededPxPerMin = minPxPerInterval / zoomInInterval.minutes;
        const neededZoom = neededPxPerMin / basePxPerMin;
        zoomInText = `${zoomInInterval.key} (at ~${neededZoom.toFixed(
          1
        )}x zoom)`;
      }

      if (zoomOutInterval) {
        const minPxPerInterval = 75;
        const neededPxPerMin = minPxPerInterval / zoomOutInterval.minutes;
        const neededZoom = neededPxPerMin / basePxPerMin;
        zoomOutText = `${zoomOutInterval.key} (at ~${neededZoom.toFixed(
          1
        )}x zoom)`;
      }

      setZoomInfo({
        current: currentInterval.key,
        currentPxPerMin: +currentPxPerMin.toFixed(4),
        zoomLevel: currentZoom.toFixed(2),
        zoomIn: zoomInText,
        zoomOut: zoomOutText,
      });

      updateTimeline(xz);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .attr("pointer-events", "all");

    // Calculate initial zoom for the desired interval
    const initialIntervalConfig = intervals[timelineConfig.initialInterval];
    // We want this interval to span ~90 pixels
    const targetPxPerInterval = 90;
    const targetPxPerMin = targetPxPerInterval / initialIntervalConfig.minutes;
    const initialZoomLevel = targetPxPerMin / basePxPerMin;

    console.log(`Initial zoom to: ${initialIntervalConfig.key}`);
    console.log(`Target px/min: ${targetPxPerMin.toFixed(4)}`);
    console.log(`Initial zoom level: ${initialZoomLevel.toFixed(2)}x`);

    let centerDate: Date;
    switch (timelineConfig.scrollTo) {
      case "start":
        centerDate = startDate;
        break;
      case "middle":
        centerDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
        break;
      case "end":
        centerDate = endDate;
        break;
      default:
        centerDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
    }

    svg
      .call(zoom as any)
      .transition()
      .duration(750)
      .call(zoom.scaleTo as any, initialZoomLevel, [x(centerDate), 0]);

    function updateTimeline(scale: number) {
      if (!timelineRef.current) return;

      timelineRef.current.innerHTML = "";

      colorBlocks.forEach((block) => {
        const startPos = scale(block.start);
        const endPos = scale(block.end);

        const leftPos = startPos - marginLeft;
        const blockWidth = endPos - startPos;

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

    updateTimeline(x);
  }, [colorBlocks, width]);

  return (
    <div className="flex flex-col items-center p-5">
      {/* Zoom Info Display */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg shadow-sm text-sm font-mono w-full max-w-5xl">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-blue-600 font-bold text-lg mb-1">
              {zoomInfo.current}
            </div>
            <div className="text-gray-600 text-xs">
              Zoom: {zoomInfo.zoomLevel}x | {zoomInfo.currentPxPerMin} px/min
            </div>
          </div>
          <div className="text-green-600">
            <div className="font-semibold">⬅ Zoom In to:</div>
            <div className="text-xs">{zoomInfo.zoomIn}</div>
          </div>
          <div className="text-orange-600">
            <div className="font-semibold">Zoom Out to: ➡</div>
            <div className="text-xs">{zoomInfo.zoomOut}</div>
          </div>
        </div>
      </div>

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

      <div className="mt-4 text-sm text-gray-600">
        Scroll to zoom, drag to pan. Timeline shows July 1-28, 2025
      </div>
    </div>
  );
};

export default ZoomableTimeline3;
