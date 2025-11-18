// "use client";
// import React, { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";

// type IntervalConfig = {
//   key: string;
//   interval: d3.CountableTimeInterval | d3.TimeInterval;
//   format: (date: Date) => string;
//   minutes: number;
// };

// const intervals: IntervalConfig[] = [
//   {
//     key: "5m",
//     interval: d3.timeMinute.every(5)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 5,
//   },
//   {
//     key: "15m",
//     interval: d3.timeMinute.every(15)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 15,
//   },
//   {
//     key: "30m",
//     interval: d3.timeMinute.every(30)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 30,
//   },
//   {
//     key: "1h",
//     interval: d3.timeHour.every(1)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 60,
//   },
//   {
//     key: "2h",
//     interval: d3.timeHour.every(2)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 120,
//   },
//   {
//     key: "3h",
//     interval: d3.timeHour.every(3)!,
//     format: d3.timeFormat("%I:%M %p"),
//     minutes: 180,
//   },
//   {
//     key: "6h",
//     interval: d3.timeHour.every(6)!,
//     format: d3.timeFormat("%m/%d %I %p"),
//     minutes: 360,
//   },
//   {
//     key: "12h",
//     interval: d3.timeHour.every(12)!,
//     format: d3.timeFormat("%m/%d %I %p"),
//     minutes: 720,
//   },
//   {
//     key: "1d",
//     interval: d3.timeDay.every(1)!,
//     format: d3.timeFormat("%m/%d/%Y"),
//     minutes: 1440,
//   },
//   {
//     key: "1w",
//     interval: d3.timeWeek.every(1)!,
//     format: d3.timeFormat("%b %d"),
//     minutes: 10080,
//   },
//   {
//     key: "1M",
//     interval: d3.timeMonth.every(1)!,
//     format: d3.timeFormat("%b %Y"),
//     minutes: 43200,
//   },
//   {
//     key: "3M",
//     interval: d3.timeMonth.every(3)!,
//     format: d3.timeFormat("%b %Y"),
//     minutes: 129600,
//   },
// ];

// interface ZoomRangeConstraint {
//   rangeDays: number;
//   maxZoomIntervalKey: string;
//   minZoomIntervalKey: string;
// }

// const ZOOM_CONSTRAINTS: ZoomRangeConstraint[] = [
//   { rangeDays: 2, maxZoomIntervalKey: "5m", minZoomIntervalKey: "6h" },
//   { rangeDays: 21, maxZoomIntervalKey: "30m", minZoomIntervalKey: "1d" },
//   { rangeDays: 200, maxZoomIntervalKey: "1h", minZoomIntervalKey: "1w" },
//   { rangeDays: Infinity, maxZoomIntervalKey: "3h", minZoomIntervalKey: "3M" },
// ];

// interface TimelineConfigProp {
//   initialInterval: number;
//   scrollTo: "end" | "middle" | "start";
// }

// interface ZoomableTimelineProps {
//   timelineConfig?: TimelineConfigProp;
// }

// const useResizeObserver = (ref: React.RefObject<HTMLElement>) => {
//   const [width, setWidth] = useState(0);

//   useEffect(() => {
//     if (!ref.current) return;

//     const observer = new ResizeObserver((entries) => {
//       const entry = entries[0];
//       if (entry) {
//         setWidth(entry.contentRect.width);
//       }
//     });

//     observer.observe(ref.current);
//     return () => observer.disconnect();
//   }, [ref]);

//   return { width };
// };

// const ZoomableTimeline = ({
//   timelineConfig = { initialInterval: 4, scrollTo: "start" },
// }: ZoomableTimelineProps) => {
//   const svgRef = useRef<SVGSVGElement>(null);
//   const timelineRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const { width } = useResizeObserver(containerRef);
//   const [colorBlocks, setColorBlocks] = useState<any[]>([]);
//   const [zoomInfo, setZoomInfo] = useState({
//     current: "",
//     currentPxPerMin: 0,
//     zoomLevel: "0",
//     zoomIn: "",
//     zoomOut: "",
//     visibleDays: 0,
//     totalDays: 0,
//     constraint: "",
//   });
//   const [pivotPosition, setPivotPosition] = useState(0);
//   const [pivotDate, setPivotDate] = useState(new Date());
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragStartX, setDragStartX] = useState(0);
//   const [dragStartPivot, setDragStartPivot] = useState(0);
//   const [selectedInterval, setSelectedInterval] = useState("");

//   const xScaleRef = useRef<any>(null);
//   const pivotPositionRef = useRef<number>(0);
//   const precisePivotRef = useRef<number>(0);
//   const zoomBehaviorRef = useRef<any>(null);
//   const svgSelectionRef = useRef<any>(null);

//   useEffect(() => {
//     pivotPositionRef.current = pivotPosition;
//     precisePivotRef.current = pivotPosition;
//   }, [pivotPosition]);

//   const height = 120;
//   const marginRight = 30;
//   const marginTop = 20;
//   const marginLeft = 30;
//   const timelineHeight = 28;
//   const startDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
//   const endDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));

//   const generateColorBlocks = () => {
//     const blocks = [];
//     const colors = [
//       "#FF6B6B",
//       "#4ECDC4",
//       "#45B7D1",
//       "#FFA07A",
//       "#98D8C8",
//       "#F7DC6F",
//       "#BB8FCE",
//       "#85C1E2",
//     ];
//     const current = new Date(startDate);

//     while (current < endDate) {
//       const duration = Math.random() * 3600000 * 4;
//       const blockEnd = new Date(
//         Math.min(current.getTime() + duration, endDate.getTime())
//       );

//       blocks.push({
//         start: new Date(current),
//         end: blockEnd,
//         color: colors[Math.floor(Math.random() * colors.length)],
//       });

//       current.setTime(blockEnd.getTime());
//     }

//     return blocks;
//   };

//   useEffect(() => {
//     setColorBlocks(generateColorBlocks());
//   }, []);

//   const MIN_PX_PER_TICK = 75;

//   const getTotalDays = () => {
//     const totalMs = endDate.getTime() - startDate.getTime();
//     return totalMs / (1000 * 60 * 60 * 24);
//   };

//   const getActiveConstraint = (): ZoomRangeConstraint => {
//     const totalDays = getTotalDays();

//     for (const constraint of ZOOM_CONSTRAINTS) {
//       if (totalDays <= constraint.rangeDays) {
//         return constraint;
//       }
//     }
//     return ZOOM_CONSTRAINTS[ZOOM_CONSTRAINTS.length - 1];
//   };

//   const getAllowedIntervals = (
//     constraint: ZoomRangeConstraint
//   ): IntervalConfig[] => {
//     const maxIdx = intervals.findIndex(
//       (i) => i.key === constraint.maxZoomIntervalKey
//     );
//     const minIdx = intervals.findIndex(
//       (i) => i.key === constraint.minZoomIntervalKey
//     );
//     return intervals.slice(maxIdx, minIdx + 1);
//   };

//   const getInterval = (
//     pxPerMin: number,
//     constraint: ZoomRangeConstraint
//   ): IntervalConfig => {
//     const allowedIntervals = getAllowedIntervals(constraint);

//     for (const interval of allowedIntervals) {
//       const requiredPxPerMin = MIN_PX_PER_TICK / interval.minutes;
//       if (pxPerMin >= requiredPxPerMin) {
//         return interval;
//       }
//     }

//     return allowedIntervals[allowedIntervals.length - 1];
//   };

//   const calculateZoomExtent = () => {
//     const constraint = getActiveConstraint();
//     const allowedIntervals = getAllowedIntervals(constraint);

//     const finestInterval = allowedIntervals[0];

//     const fullSpanMs = endDate.getTime() - startDate.getTime();
//     const fullWidthPx = width - marginLeft - marginRight;
//     const basePxPerMs = fullWidthPx / fullSpanMs;
//     const basePxPerMin = basePxPerMs * 60 * 1000;

//     const maxZoomPxPerMin = MIN_PX_PER_TICK / finestInterval.minutes;
//     const maxZoom = maxZoomPxPerMin / basePxPerMin;

//     const minZoom = 1.0;

//     return { minZoom, maxZoom, constraint, basePxPerMin };
//   };

//   const handleIntervalChange = (intervalKey: string) => {
//     if (
//       !zoomBehaviorRef.current ||
//       !svgSelectionRef.current ||
//       !xScaleRef.current
//     )
//       return;

//     const fullSpanMs = endDate.getTime() - startDate.getTime();
//     const fullWidthPx = width - marginLeft - marginRight;
//     const basePxPerMs = fullWidthPx / fullSpanMs;
//     const basePxPerMin = basePxPerMs * 60 * 1000;

//     const targetInterval = intervals.find((i) => i.key === intervalKey);
//     if (!targetInterval) return;

//     const TARGET_PX_PER_INTERVAL = 90;
//     const targetPxPerMin = TARGET_PX_PER_INTERVAL / targetInterval.minutes;
//     const targetZoom = targetPxPerMin / basePxPerMin;

//     const currentTransform = d3.zoomTransform(svgSelectionRef.current.node());
//     const currentScale = currentTransform.rescaleX(
//       d3
//         .scaleUtc()
//         .domain([startDate, endDate])
//         .range([marginLeft, width - marginRight])
//     );

//     const pivotSvgX = pivotPositionRef.current + marginLeft;

//     svgSelectionRef.current
//       .transition()
//       .duration(500)
//       .call(zoomBehaviorRef.current.scaleTo, targetZoom, [pivotSvgX, 0]);

//     setSelectedInterval(intervalKey);
//   };

//   useEffect(() => {
//     if (!svgRef.current || colorBlocks.length === 0 || width === 0) return;

//     const fullSpanMs = endDate.getTime() - startDate.getTime();
//     const fullWidthPx = width - marginLeft - marginRight;
//     const basePxPerMs = fullWidthPx / fullSpanMs;
//     const basePxPerMin = basePxPerMs * 60 * 1000;

//     const svg = d3.select(svgRef.current);
//     svg.selectAll("*").remove();

//     const x = d3
//       .scaleUtc()
//       .domain([startDate, endDate])
//       .range([marginLeft, width - marginRight]);

//     const activeConstraint = getActiveConstraint();
//     const { minZoom, maxZoom } = calculateZoomExtent();

//     const xAxis = (g: any, x: any) => {
//       const domain = x.domain();
//       const range = x.range();
//       const spanMs = domain[1].getTime() - domain[0].getTime();
//       const pixelWidth = range[1] - range[0];
//       const pxPerMin = pixelWidth / (spanMs / (1000 * 60));

//       const currentInterval = getInterval(pxPerMin, activeConstraint);

//       let tickValues;
//       if (currentInterval.key === "3M") {
//         tickValues = d3.timeMonth
//           .every(3)
//           .range(new Date(domain[0]), new Date(domain[1].getTime() + 86400000));
//       } else if (currentInterval.key === "1M") {
//         tickValues = d3.timeMonth
//           .every(1)
//           .range(new Date(domain[0]), new Date(domain[1].getTime() + 86400000));
//       } else {
//         tickValues = x.ticks(currentInterval.interval);
//       }

//       const axis = d3
//         .axisBottom(x)
//         .tickValues(tickValues)
//         .tickSizeOuter(0)
//         .tickFormat(currentInterval.format as any);

//       g.call(axis);

//       g.selectAll("text").attr("y", -10).style("text-anchor", "middle");
//     };

//     const zoom = d3
//       .zoom()
//       .scaleExtent([minZoom, maxZoom])
//       .extent([
//         [marginLeft, 0],
//         [width - marginRight, height],
//       ])
//       .translateExtent([
//         [marginLeft, 0],
//         [width - marginRight, 0],
//       ])
//       .on("zoom", zoomed);

//     zoomBehaviorRef.current = zoom;
//     svgSelectionRef.current = svg;

//     const gx = svg
//       .append("g")
//       .attr("class", "axis")
//       .attr("transform", `translate(0,${marginTop})`)
//       .call(xAxis, x);

//     gx.select(".domain").remove();

//     function zoomed(event: any) {
//       const xz = event.transform.rescaleX(x);
//       xScaleRef.current = xz;

//       gx.call(xAxis, xz);
//       gx.select(".domain").remove();

//       const visibleDomain = xz.domain();
//       const visibleMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
//       const visibleDays = visibleMs / (1000 * 60 * 60 * 24);

//       const currentZoom = event.transform.k;
//       const currentPxPerMin = basePxPerMin * currentZoom;

//       const currentInterval = getInterval(currentPxPerMin, activeConstraint);
//       setSelectedInterval(currentInterval.key);

//       const allowedIntervals = getAllowedIntervals(activeConstraint);
//       const currentIdx = allowedIntervals.findIndex(
//         (i) => i.key === currentInterval.key
//       );

//       const zoomInInterval =
//         currentIdx > 0 ? allowedIntervals[currentIdx - 1] : null;
//       const zoomOutInterval =
//         currentIdx < allowedIntervals.length - 1
//           ? allowedIntervals[currentIdx + 1]
//           : null;

//       let zoomInText = "Max zoom (constraint limit)";
//       let zoomOutText = "Min zoom (constraint limit)";

//       if (zoomInInterval) {
//         const neededPxPerMin = MIN_PX_PER_TICK / zoomInInterval.minutes;
//         const neededZoom = neededPxPerMin / basePxPerMin;
//         zoomInText = `${zoomInInterval.key} (at ~${neededZoom.toFixed(1)}x)`;
//       }

//       if (zoomOutInterval) {
//         const neededPxPerMin = MIN_PX_PER_TICK / zoomOutInterval.minutes;
//         const neededZoom = neededPxPerMin / basePxPerMin;
//         zoomOutText = `${zoomOutInterval.key} (at ~${neededZoom.toFixed(1)}x)`;
//       }

//       setZoomInfo({
//         current: currentInterval.key,
//         currentPxPerMin: +currentPxPerMin.toFixed(4),
//         zoomLevel: currentZoom.toFixed(2),
//         zoomIn: zoomInText,
//         zoomOut: zoomOutText,
//         visibleDays: visibleDays,
//         totalDays: getTotalDays(),
//         constraint: `${activeConstraint.maxZoomIntervalKey} - ${activeConstraint.minZoomIntervalKey}`,
//       });

//       updateTimeline(xz);
//       updatePivotDateFromScale(pivotPositionRef.current);
//     }

//     svg
//       .append("rect")
//       .attr("width", width)
//       .attr("height", height)
//       .attr("fill", "transparent")
//       .attr("pointer-events", "all");

//     const initialIntervalConfig = intervals[timelineConfig.initialInterval];
//     const TARGET_PX_PER_INTERVAL = 90;
//     const targetPxPerMin =
//       TARGET_PX_PER_INTERVAL / initialIntervalConfig.minutes;
//     let initialZoomLevel = targetPxPerMin / basePxPerMin;

//     initialZoomLevel = Math.max(minZoom, Math.min(maxZoom, initialZoomLevel));

//     let centerDate: Date;
//     switch (timelineConfig.scrollTo) {
//       case "start":
//         centerDate = startDate;
//         break;
//       case "middle":
//         centerDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
//         break;
//       case "end":
//         centerDate = endDate;
//         break;
//       default:
//         centerDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
//     }

//     xScaleRef.current = x;
//     const initialPivotX = (width - marginLeft - marginRight) / 2;
//     setPivotPosition(initialPivotX);

//     svg
//       .call(zoom as any)
//       .transition()
//       .duration(750)
//       .call(zoom.scaleTo as any, initialZoomLevel, [x(centerDate), 0])
//       .on("end", () => {
//         const currentScale = d3.zoomTransform(svg.node()!).rescaleX(x);
//         xScaleRef.current = currentScale;
//         updatePivotDateFromScale(pivotPositionRef.current);
//       });

//     function updateTimeline(scale: any) {
//       if (!timelineRef.current) return;

//       timelineRef.current.innerHTML = "";

//       colorBlocks.forEach((block) => {
//         const startPos = scale(block.start);
//         const endPos = scale(block.end);
//         const leftPos = startPos - marginLeft;
//         const blockWidth = endPos - startPos;

//         if (endPos >= marginLeft && startPos <= width - marginRight) {
//           const div = document.createElement("div");
//           div.style.position = "absolute";
//           div.style.left = `${leftPos}px`;
//           div.style.width = `${blockWidth}px`;
//           div.style.height = "100%";
//           div.style.backgroundColor = block.color;
//           div.style.borderRight = "1px solid white";
//           div.style.boxSizing = "border-box";
//           timelineRef.current!.appendChild(div);
//         }
//       });
//     }

//     updateTimeline(x);
//   }, [colorBlocks, width]);

//   function updatePivotDateFromScale(position: number) {
//     if (xScaleRef.current) {
//       const svgX = position + marginLeft;
//       const date = xScaleRef.current.invert(svgX);
//       setPivotDate(date);
//     }
//   }

//   const handlePivotStart = (clientX: number) => {
//     setIsDragging(true);
//     setDragStartX(clientX);
//     setDragStartPivot(precisePivotRef.current);
//   };

//   const handlePivotMove = (clientX: number) => {
//     if (!isDragging || !containerRef.current) return;

//     const deltaX = clientX - dragStartX;
//     const maxX = width - marginLeft - marginRight;
//     const newPosition = Math.max(0, Math.min(dragStartPivot + deltaX, maxX));

//     setPivotPosition(newPosition);
//     precisePivotRef.current = newPosition;
//     updatePivotDateFromScale(newPosition);
//   };

//   const handlePivotEnd = () => {
//     setIsDragging(false);
//   };

//   const formatPivotDate = (date: Date) => {
//     return d3.timeFormat("%m/%d/%Y, %I:%M:%S %p")(date);
//   };

//   const activeConstraint = getActiveConstraint();
//   const allowedIntervals = getAllowedIntervals(activeConstraint);

//   return (
//     <div className="flex flex-col items-center bg-gray-50 overflow-x-hidden p-4">
//       <div className="mb-4 p-4 bg-white rounded-lg shadow-md text-sm font-mono w-full border border-gray-200">
//         <div className="grid grid-cols-4 gap-4 mb-3">
//           <div>
//             <div className="text-blue-600 font-bold text-lg mb-1">
//               {zoomInfo.current}
//             </div>
//             <div className="text-gray-600 text-xs">
//               Zoom: {zoomInfo.zoomLevel}x | {zoomInfo.currentPxPerMin} px/min
//             </div>
//           </div>
//           <div className="text-green-600">
//             <div className="font-semibold">⬅ Zoom In to:</div>
//             <div className="text-xs">{zoomInfo.zoomIn}</div>
//           </div>
//           <div className="text-orange-600">
//             <div className="font-semibold">Zoom Out to: ➡</div>
//             <div className="text-xs">{zoomInfo.zoomOut}</div>
//           </div>
//           <div>
//             <label className="block text-gray-700 font-semibold mb-2 text-xs">
//               Select Zoom Level:
//             </label>
//             <select
//               value={selectedInterval}
//               onChange={(e) => handleIntervalChange(e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
//             >
//               {allowedIntervals.map((interval) => (
//                 <option key={interval.key} value={interval.key}>
//                   {interval.key}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//         <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
//           <div className="text-purple-600">
//             <div className="font-semibold">Timeline Span:</div>
//             <div className="text-xs">
//               Total: {zoomInfo.totalDays.toFixed(1)} days | Visible:{" "}
//               {zoomInfo.visibleDays.toFixed(1)} days
//             </div>
//           </div>
//           <div className="text-indigo-600">
//             <div className="font-semibold">Active Constraint:</div>
//             <div className="text-xs">
//               {zoomInfo.constraint} (for ≤{getTotalDays().toFixed(0)} day
//               timeline)
//             </div>
//           </div>
//         </div>
//       </div>

//       <div
//         className="bg-white rounded-lg shadow-lg w-full relative"
//         ref={containerRef}
//         onMouseMove={(e) => handlePivotMove(e.clientX)}
//         onMouseUp={handlePivotEnd}
//         onMouseLeave={handlePivotEnd}
//         onTouchMove={(e) => handlePivotMove(e.touches[0].clientX)}
//         onTouchEnd={handlePivotEnd}
//         style={{ cursor: isDragging ? "grabbing" : "default" }}
//       >
//         <svg
//           ref={svgRef}
//           viewBox={`0 0 ${width} ${height}`}
//           width={width}
//           height={height}
//           style={{
//             maxWidth: "100%",
//             height: "auto",
//             display: "block",
//           }}
//         />

//         <div
//           className="absolute top-12 bg-amber-200"
//           style={{
//             width: `${width - marginLeft - marginRight}px`,
//             height: `${timelineHeight}px`,
//             marginLeft: `${marginLeft}px`,
//             marginTop: "10px",
//             border: "1px solid #ccc",
//             overflow: "hidden",
//             pointerEvents: "none",
//           }}
//           ref={timelineRef}
//         />

//         <div
//           className="absolute"
//           style={{
//             left: `${marginLeft + pivotPosition}px`,
//             top: "0",
//             bottom: "0",
//             width: "2px",
//             backgroundColor: "#2563eb",
//             pointerEvents: "none",
//             zIndex: 10,
//           }}
//         >
//           <div
//             className="absolute"
//             style={{
//               top: "-1px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               width: "0",
//               height: "0",
//               borderLeft: "6px solid transparent",
//               borderRight: "6px solid transparent",
//               borderTop: "8px solid #2563eb",
//             }}
//           />

//           <div
//             className="absolute"
//             style={{
//               bottom: "-1px",
//               left: "50%",
//               transform: "translateX(-50%)",
//               width: "0",
//               height: "0",
//               borderLeft: "6px solid transparent",
//               borderRight: "6px solid transparent",
//               borderBottom: "8px solid #2563eb",
//             }}
//           />
//         </div>

//         <div
//           className="absolute bg-white border-2 border-blue-600 rounded-lg shadow-lg px-3 py-2"
//           style={{
//             left: `${marginLeft + pivotPosition}px`,
//             top: "-45px",
//             transform: "translateX(-50%)",
//             pointerEvents: "auto",
//             zIndex: 20,
//             userSelect: "none",
//             cursor: isDragging ? "grabbing" : "grab",
//           }}
//           onMouseDown={(e) => handlePivotStart(e.clientX)}
//           onTouchStart={(e) => handlePivotStart(e.touches[0].clientX)}
//         >
//           <div className="text-xs font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1">
//             <span>{formatPivotDate(pivotDate)}</span>
//             <span className="text-blue-600">⟷</span>
//           </div>
//         </div>
//       </div>

//       <div className="mt-4 text-sm text-gray-600 text-center">
//         Scroll to zoom, drag to pan, or use the dropdown to select a zoom level.
//         Drag the tooltip to move the pivot line.
//         <br />
//         <span className="text-xs text-gray-500">
//           Zoom constraints are fixed based on total timeline span (
//           {getTotalDays().toFixed(1)} days)
//         </span>
//       </div>
//     </div>
//   );
// };

// export default ZoomableTimeline;

"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type IntervalConfig = {
  key: string;
  interval: d3.CountableTimeInterval | d3.TimeInterval;
  format: (date: Date) => string;
  minutes: number;
};

const intervals: IntervalConfig[] = [
  // {
  //   key: "5m",
  //   interval: d3.timeMinute.every(5)!,
  //   format: d3.timeFormat("%I:%M %p"),
  //   minutes: 5,
  // },
  // {
  //   key: "15m",
  //   interval: d3.timeMinute.every(15)!,
  //   format: d3.timeFormat("%I:%M %p"),
  //   minutes: 15,
  // },
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

interface ZoomRangeConstraint {
  rangeDays: number;
  maxZoomIntervalKey: string;
  minZoomIntervalKey: string;
}

const ZOOM_CONSTRAINTS: ZoomRangeConstraint[] = [
  { rangeDays: 2, maxZoomIntervalKey: "5m", minZoomIntervalKey: "6h" },
  { rangeDays: 21, maxZoomIntervalKey: "30m", minZoomIntervalKey: "1d" },
  { rangeDays: 200, maxZoomIntervalKey: "1h", minZoomIntervalKey: "1w" },
  { rangeDays: Infinity, maxZoomIntervalKey: "3h", minZoomIntervalKey: "3M" },
];

interface TimelineConfigProp {
  initialInterval: number;
  scrollTo: "end" | "middle" | "start";
}

interface ZoomableTimelineProps {
  timelineConfig?: TimelineConfigProp;
}

const useResizeObserver = (ref: React.RefObject<HTMLElement>) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return { width };
};

const ZoomableTimeline = ({
  timelineConfig = { initialInterval: 4, scrollTo: "start" },
}: ZoomableTimelineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [colorBlocks, setColorBlocks] = useState<any[]>([]);
  const [zoomInfo, setZoomInfo] = useState({
    current: "",
    currentPxPerMin: 0,
    zoomLevel: "0",
    zoomIn: "",
    zoomOut: "",
    visibleDays: 0,
    totalDays: 0,
    constraint: "",
  });
  const [pivotPosition, setPivotPosition] = useState(0);
  const [pivotDate, setPivotDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPivot, setDragStartPivot] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState("");

  const xScaleRef = useRef<any>(null);
  const pivotPositionRef = useRef<number>(0);
  const precisePivotRef = useRef<number>(0);
  const zoomBehaviorRef = useRef<any>(null);
  const svgSelectionRef = useRef<any>(null);

  useEffect(() => {
    pivotPositionRef.current = pivotPosition;
    precisePivotRef.current = pivotPosition;
  }, [pivotPosition]);

  const height = 120;
  const marginRight = 30;
  const marginTop = 20;
  const marginLeft = 30;
  const timelineHeight = 28;
  const startDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));

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
      const duration = Math.random() * 3600000 * 4;
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

  const MIN_PX_PER_TICK = (width - marginLeft - marginRight) / 12;

  const getTotalDays = () => {
    const totalMs = endDate.getTime() - startDate.getTime();
    return totalMs / (1000 * 60 * 60 * 24);
  };

  const getActiveConstraint = (): ZoomRangeConstraint => {
    const totalDays = getTotalDays();

    for (const constraint of ZOOM_CONSTRAINTS) {
      if (totalDays <= constraint.rangeDays) {
        return constraint;
      }
    }
    return ZOOM_CONSTRAINTS[ZOOM_CONSTRAINTS.length - 1];
  };

  const getAllowedIntervals = (
    constraint: ZoomRangeConstraint
  ): IntervalConfig[] => {
    const maxIdx = intervals.findIndex(
      (i) => i.key === constraint.maxZoomIntervalKey
    );
    const minIdx = intervals.findIndex(
      (i) => i.key === constraint.minZoomIntervalKey
    );
    return intervals.slice(maxIdx, minIdx + 1);
  };

  const getInterval = (
    pxPerMin: number,
    constraint: ZoomRangeConstraint
  ): IntervalConfig => {
    const allowedIntervals = getAllowedIntervals(constraint);

    for (const interval of allowedIntervals) {
      const requiredPxPerMin = MIN_PX_PER_TICK / interval.minutes;
      if (pxPerMin >= requiredPxPerMin) {
        return interval;
      }
    }

    return allowedIntervals[allowedIntervals.length - 1];
  };

  const calculateZoomExtent = () => {
    const constraint = getActiveConstraint();
    const allowedIntervals = getAllowedIntervals(constraint);

    const finestInterval = allowedIntervals[0];

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000;

    const maxZoomPxPerMin = MIN_PX_PER_TICK / finestInterval.minutes;
    const maxZoom = maxZoomPxPerMin / basePxPerMin;

    const minZoom = 1.0;

    return { minZoom, maxZoom, constraint, basePxPerMin };
  };

  const handleIntervalChange = (intervalKey: string) => {
    if (
      !zoomBehaviorRef.current ||
      !svgSelectionRef.current ||
      !xScaleRef.current
    )
      return;
    console.log(intervalKey, width, "----changing interval");

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;

    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000;

    const targetInterval = intervals.find((i) => i.key === intervalKey);
    if (!targetInterval) return;

    const TARGET_PX_PER_INTERVAL = 100;
    const targetPxPerMin = TARGET_PX_PER_INTERVAL / targetInterval.minutes;
    const targetZoom = targetPxPerMin / basePxPerMin;

    const pivotSvgX = pivotPositionRef.current + marginLeft;

    setSelectedInterval(intervalKey);

    svgSelectionRef.current
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.scaleTo, targetZoom, [pivotSvgX, 0]);
  };

  useEffect(() => {
    if (!svgRef.current || colorBlocks.length === 0 || width === 0) return;

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const x = d3
      .scaleUtc()
      .domain([startDate, endDate])
      .range([marginLeft, width - marginRight]);

    const activeConstraint = getActiveConstraint();
    const { minZoom, maxZoom } = calculateZoomExtent();

    const xAxis = (g: any, x: any) => {
      const domain = x.domain();
      const range = x.range();
      const spanMs = domain[1].getTime() - domain[0].getTime();
      const pixelWidth = range[1] - range[0];
      const pxPerMin = pixelWidth / (spanMs / (1000 * 60));

      const currentInterval = getInterval(pxPerMin, activeConstraint);

      const tickValues = x.ticks(currentInterval.interval);

      const axis = d3
        .axisBottom(x)
        .tickValues(tickValues)
        .tickSizeOuter(0)
        .tickFormat(currentInterval.format as any);

      g.call(axis);

      g.selectAll("text").attr("y", -10).style("text-anchor", "middle");
    };

    const zoom = d3
      .zoom()
      .scaleExtent([minZoom, maxZoom])
      .extent([
        [marginLeft, 0],
        [width - marginRight, height],
      ])
      .translateExtent([
        [marginLeft, 0],
        [width - marginRight, 0],
      ])
      .on("zoom", zoomed);

    zoomBehaviorRef.current = zoom;
    svgSelectionRef.current = svg;

    const gx = svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${marginTop})`)
      .call(xAxis, x);

    gx.select(".domain").remove();

    function zoomed(event: any) {
      const xz = event.transform.rescaleX(x);
      xScaleRef.current = xz;

      gx.call(xAxis, xz);
      gx.select(".domain").remove();

      const visibleDomain = xz.domain();
      const visibleMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
      const visibleDays = visibleMs / (1000 * 60 * 60 * 24);

      const currentZoom = event.transform.k;
      const currentPxPerMin = basePxPerMin * currentZoom;

      const currentInterval = getInterval(currentPxPerMin, activeConstraint);
      const allowedIntervals = getAllowedIntervals(activeConstraint);
      const isIntervalAllowed = allowedIntervals.some(
        (i) => i.key === currentInterval.key
      );

      if (isIntervalAllowed) {
        setSelectedInterval(currentInterval.key);
      }

      const currentIdx = allowedIntervals.findIndex(
        (i) => i.key === currentInterval.key
      );

      const zoomInInterval =
        currentIdx > 0 ? allowedIntervals[currentIdx - 1] : null;
      const zoomOutInterval =
        currentIdx < allowedIntervals.length - 1
          ? allowedIntervals[currentIdx + 1]
          : null;

      let zoomInText = "Max zoom (constraint limit)";
      let zoomOutText = "Min zoom (constraint limit)";

      if (zoomInInterval) {
        const neededPxPerMin = MIN_PX_PER_TICK / zoomInInterval.minutes;
        const neededZoom = neededPxPerMin / basePxPerMin;
        zoomInText = `${zoomInInterval.key} (at ~${neededZoom.toFixed(1)}x)`;
      }

      if (zoomOutInterval) {
        const neededPxPerMin = MIN_PX_PER_TICK / zoomOutInterval.minutes;
        const neededZoom = neededPxPerMin / basePxPerMin;
        zoomOutText = `${zoomOutInterval.key} (at ~${neededZoom.toFixed(1)}x)`;
      }

      setZoomInfo({
        current: currentInterval.key,
        currentPxPerMin: +currentPxPerMin.toFixed(4),
        zoomLevel: currentZoom.toFixed(2),
        zoomIn: zoomInText,
        zoomOut: zoomOutText,
        visibleDays: visibleDays,
        totalDays: getTotalDays(),
        constraint: `${activeConstraint.maxZoomIntervalKey} - ${activeConstraint.minZoomIntervalKey}`,
      });

      updateTimeline(xz);
      updatePivotDateFromScale(pivotPositionRef.current);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .attr("pointer-events", "all");

    const initialIntervalConfig = intervals[timelineConfig.initialInterval];
    const TARGET_PX_PER_INTERVAL = 90;
    const targetPxPerMin =
      TARGET_PX_PER_INTERVAL / initialIntervalConfig.minutes;
    let initialZoomLevel = targetPxPerMin / basePxPerMin;

    initialZoomLevel = Math.max(minZoom, Math.min(maxZoom, initialZoomLevel));

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

    xScaleRef.current = x;
    const initialPivotX = (width - marginLeft - marginRight) / 2;
    setPivotPosition(initialPivotX);

    svg
      .call(zoom as any)
      .transition()
      .duration(750)
      .call(zoom.scaleTo as any, initialZoomLevel, [x(centerDate), 0])
      .on("end", () => {
        const currentScale = d3.zoomTransform(svg.node()!).rescaleX(x);
        xScaleRef.current = currentScale;
        updatePivotDateFromScale(pivotPositionRef.current);

        const visibleDomain = currentScale.domain();
        const spanMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
        const pixelWidth = width - marginLeft - marginRight;
        const pxPerMin = pixelWidth / (spanMs / (1000 * 60));
        const currentInterval = getInterval(pxPerMin, activeConstraint);
        const allowedIntervals = getAllowedIntervals(activeConstraint);
        const isIntervalAllowed = allowedIntervals.some(
          (i) => i.key === currentInterval.key
        );
        if (isIntervalAllowed) {
          setSelectedInterval(currentInterval.key);
        }
      });

    function updateTimeline(scale: any) {
      if (!timelineRef.current) return;

      timelineRef.current.innerHTML = "";

      const visibleDomain = scale.domain();
      const bufferMs =
        (visibleDomain[1].getTime() - visibleDomain[0].getTime()) * 0.2;
      const minVisible = new Date(visibleDomain[0].getTime() - bufferMs);
      const maxVisible = new Date(visibleDomain[1].getTime() + bufferMs);

      colorBlocks.forEach((block) => {
        if (block.end < minVisible || block.start > maxVisible) {
          return;
        }

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
          timelineRef.current!.appendChild(div);
        }
      });
    }

    updateTimeline(x);
  }, [colorBlocks, width]);

  function updatePivotDateFromScale(position: number) {
    if (xScaleRef.current) {
      const svgX = position + marginLeft;
      const date = xScaleRef.current.invert(svgX);
      setPivotDate(date);
    }
  }

  const handlePivotStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
    setDragStartPivot(precisePivotRef.current);
  };

  const handlePivotMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = clientX - dragStartX;
    const maxX = width - marginLeft - marginRight;
    const newPosition = Math.max(0, Math.min(dragStartPivot + deltaX, maxX));

    setPivotPosition(newPosition);
    precisePivotRef.current = newPosition;
    updatePivotDateFromScale(newPosition);
  };

  const handlePivotEnd = () => {
    setIsDragging(false);
  };

  const formatPivotDate = (date: Date) => {
    return d3.timeFormat("%m/%d/%Y, %I:%M:%S %p")(date);
  };

  const activeConstraint = getActiveConstraint();
  const allowedIntervals = getAllowedIntervals(activeConstraint);

  return (
    <div className="flex flex-col items-center bg-gray-50 overflow-x-hidden p-4">
      <div className="mb-4 p-4 bg-white rounded-lg shadow-md text-sm font-mono w-full border border-gray-200">
        <div className="grid grid-cols-4 gap-4 mb-3">
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
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-xs">
              Select Zoom Level:
            </label>
            <select
              value={selectedInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
            >
              {allowedIntervals.map((interval) => (
                <option key={interval.key} value={interval.key}>
                  {interval.key}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-4">
          <div className="text-purple-600">
            <div className="font-semibold">Timeline Span:</div>
            <div className="text-xs">
              Total: {zoomInfo.totalDays.toFixed(1)} days | Visible:{" "}
              {zoomInfo.visibleDays.toFixed(1)} days
            </div>
          </div>
          <div className="text-indigo-600">
            <div className="font-semibold">Active Constraint:</div>
            <div className="text-xs">
              {zoomInfo.constraint} (for ≤{getTotalDays().toFixed(0)} day
              timeline)
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-lg shadow-lg w-full relative"
        ref={containerRef}
        onMouseMove={(e) => handlePivotMove(e.clientX)}
        onMouseUp={handlePivotEnd}
        onMouseLeave={handlePivotEnd}
        onTouchMove={(e) => handlePivotMove(e.touches[0].clientX)}
        onTouchEnd={handlePivotEnd}
        style={{ cursor: isDragging ? "grabbing" : "default" }}
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
          className="absolute top-12 bg-amber-200"
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

        <div
          className="absolute"
          style={{
            left: `${marginLeft + pivotPosition}px`,
            top: "0",
            bottom: "0",
            width: "2px",
            backgroundColor: "#2563eb",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div
            className="absolute"
            style={{
              top: "-1px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid #2563eb",
            }}
          />

          <div
            className="absolute"
            style={{
              bottom: "-1px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "0",
              height: "0",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "8px solid #2563eb",
            }}
          />
        </div>

        <div
          className="absolute bg-white border-2 border-blue-600 rounded-lg shadow-lg px-3 py-2"
          style={{
            left: `${marginLeft + pivotPosition}px`,
            top: "-45px",
            transform: "translateX(-50%)",
            pointerEvents: "auto",
            zIndex: 20,
            userSelect: "none",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={(e) => handlePivotStart(e.clientX)}
          onTouchStart={(e) => handlePivotStart(e.touches[0].clientX)}
        >
          <div className="text-xs font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1">
            <span>{formatPivotDate(pivotDate)}</span>
            <span className="text-blue-600">⟷</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
        Scroll to zoom, drag to pan, or use the dropdown to select a zoom level.
        Drag the tooltip to move the pivot line.
        <br />
        <span className="text-xs text-gray-500">
          Zoom constraints are fixed based on total timeline span (
          {getTotalDays().toFixed(1)} days)
        </span>
      </div>
    </div>
  );
};

export default ZoomableTimeline;
