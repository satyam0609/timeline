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
//   // {
//   //   key: "5m",
//   //   interval: d3.timeMinute.every(5)!,
//   //   format: d3.timeFormat("%I:%M %p"),
//   //   minutes: 5,
//   // },
//   // {
//   //   key: "15m",
//   //   interval: d3.timeMinute.every(15)!,
//   //   format: d3.timeFormat("%I:%M %p"),
//   //   minutes: 15,
//   // },
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
//   { rangeDays: Infinity, maxZoomIntervalKey: "12h", minZoomIntervalKey: "1M" },
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

// const ZoomableTimelineV1 = ({
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
//   const startDate = new Date(Date.UTC(2024, 11, 30, 0, 0, 0));
//   const endDate = new Date(Date.UTC(2025, 12, 1, 0, 0, 0));

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
//     let blockCount = 0;
//     const maxBlocks = 5000; // Limit blocks to prevent performance issues

//     while (current < endDate && blockCount < maxBlocks) {
//       // Average block duration of 4 hours to reduce number of blocks
//       const duration = Math.random() * 3600000 * 8 + 3600000;
//       const blockEnd = new Date(
//         Math.min(current.getTime() + duration, endDate.getTime())
//       );

//       blocks.push({
//         start: new Date(current),
//         end: blockEnd,
//         color: colors[Math.floor(Math.random() * colors.length)],
//       });

//       current.setTime(blockEnd.getTime());
//       blockCount++;
//     }

//     return blocks;
//   };

//   useEffect(() => {
//     setColorBlocks(generateColorBlocks());
//   }, []);

//   const MIN_PX_PER_TICK = (width - marginLeft - marginRight) / 12;

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

//     const { minZoom, maxZoom } = calculateZoomExtent();

//     // Calculate target zoom based on MIN_PX_PER_TICK to ensure proper spacing
//     const targetPxPerMin = MIN_PX_PER_TICK / targetInterval.minutes;
//     let targetZoom = targetPxPerMin / basePxPerMin;

//     // Clamp zoom to valid range
//     targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));

//     const pivotSvgX = pivotPositionRef.current + marginLeft;

//     setSelectedInterval(intervalKey);

//     svgSelectionRef.current
//       .transition()
//       .duration(500)
//       .call(zoomBehaviorRef.current.scaleTo, targetZoom, [pivotSvgX, 0]);
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

//       let tickValues = x.ticks(currentInterval.interval);

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
//       const allowedIntervals = getAllowedIntervals(activeConstraint);
//       const isIntervalAllowed = allowedIntervals.some(
//         (i) => i.key === currentInterval.key
//       );

//       if (isIntervalAllowed) {
//         setSelectedInterval(currentInterval.key);
//       }

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
//     const targetPxPerMin = MIN_PX_PER_TICK / initialIntervalConfig.minutes;
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

//         const visibleDomain = currentScale.domain();
//         const spanMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
//         const pixelWidth = width - marginLeft - marginRight;
//         const pxPerMin = pixelWidth / (spanMs / (1000 * 60));
//         const currentInterval = getInterval(pxPerMin, activeConstraint);
//         const allowedIntervals = getAllowedIntervals(activeConstraint);
//         const isIntervalAllowed = allowedIntervals.some(
//           (i) => i.key === currentInterval.key
//         );
//         if (isIntervalAllowed) {
//           setSelectedInterval(currentInterval.key);
//         }
//       });

//     function updateTimeline(scale: any) {
//       if (!timelineRef.current) return;

//       timelineRef.current.innerHTML = "";

//       const visibleDomain = scale.domain();
//       const bufferMs =
//         (visibleDomain[1].getTime() - visibleDomain[0].getTime()) * 0.2;
//       const minVisible = new Date(visibleDomain[0].getTime() - bufferMs);
//       const maxVisible = new Date(visibleDomain[1].getTime() + bufferMs);

//       colorBlocks.forEach((block) => {
//         if (block.end < minVisible || block.start > maxVisible) {
//           return;
//         }

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

// export default ZoomableTimelineV1;
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
];

interface ZoomRangeConstraint {
  rangeDays: number;
  maxZoomIntervalKey: string;
  minZoomIntervalKey: string;
}

const ZOOM_CONSTRAINTS: ZoomRangeConstraint[] = [
  { rangeDays: 7, maxZoomIntervalKey: "5m", minZoomIntervalKey: "6h" },
  { rangeDays: 21, maxZoomIntervalKey: "30m", minZoomIntervalKey: "1d" },
  { rangeDays: 200, maxZoomIntervalKey: "1h", minZoomIntervalKey: "1w" },
  { rangeDays: Infinity, maxZoomIntervalKey: "3h", minZoomIntervalKey: "1M" },
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
  timelineConfig = { initialInterval: 5, scrollTo: "start" },
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
    minZoom: 1,
    maxZoom: 1,
    isAtMinZoom: false,
    isAtMaxZoom: false,
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

  const startDate = new Date("2025-09-01T23:00:00.000Z");
  const endDate = new Date("2026-09-29T05:59:00.000Z");

  // FIXED: Use constant MIN_PX_PER_TICK instead of dynamic calculation
  const MIN_PX_PER_TICK = 75;

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
    let blockCount = 0;
    const maxBlocks = 5000;

    while (current < endDate && blockCount < maxBlocks) {
      const duration = Math.random() * 3600000 * 8 + 3600000;
      const blockEnd = new Date(
        Math.min(current.getTime() + duration, endDate.getTime())
      );

      blocks.push({
        start: new Date(current),
        end: blockEnd,
        color: colors[Math.floor(Math.random() * colors.length)],
      });

      current.setTime(blockEnd.getTime());
      blockCount++;
    }

    return blocks;
  };

  useEffect(() => {
    setColorBlocks(generateColorBlocks());
  }, []);

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

  const mapZoomToConstraint = (
    userZoom,
    minConstraintZoom,
    maxConstraintZoom
  ) => {
    // User zooms from 1 to maxConstraintZoom
    // We map this to minConstraintZoom to maxConstraintZoom
    // Formula: constraintZoom = minConstraintZoom + (userZoom - 1) * (maxConstraintZoom - minConstraintZoom) / (maxConstraintZoom - 1)
    if (userZoom <= 1) return minConstraintZoom;
    const mapped =
      minConstraintZoom +
      ((userZoom - 1) * (maxConstraintZoom - minConstraintZoom)) /
        (maxConstraintZoom - 1);
    return Math.min(mapped, maxConstraintZoom);
  };

  const mapConstraintToZoom = (
    constraintZoom,
    minConstraintZoom,
    maxConstraintZoom
  ) => {
    if (constraintZoom <= minConstraintZoom) return 1;
    const mapped =
      1 +
      ((constraintZoom - minConstraintZoom) * (maxConstraintZoom - 1)) /
        (maxConstraintZoom - minConstraintZoom);
    return Math.min(mapped, maxConstraintZoom);
  };

  //   const calculateZoomExtent = () => {
  //     const constraint = getActiveConstraint();
  //     const allowedIntervals = getAllowedIntervals(constraint);

  //     const finestInterval = allowedIntervals[0];
  //     const notFinestInterval = allowedIntervals[allowedIntervals.length - 1];

  //     const fullSpanMs = endDate.getTime() - startDate.getTime();
  //     const fullWidthPx = width - marginLeft - marginRight;
  //     const basePxPerMs = fullWidthPx / fullSpanMs;
  //     const basePxPerMin = basePxPerMs * 60 * 1000;

  //     const maxZoomPxPerMin = MIN_PX_PER_TICK / finestInterval.minutes;
  //     const maxZoom = maxZoomPxPerMin / basePxPerMin;
  //     const minZoomPxPerMin = MIN_PX_PER_TICK / notFinestInterval.minutes;
  //     4;
  //     const minZoom = 1.0;

  //     return { minZoom, maxZoom, constraint, basePxPerMin };
  //   };

  const calculateZoomExtent = () => {
    const constraint = getActiveConstraint();
    const allowedIntervals = getAllowedIntervals(constraint);

    const finestInterval = allowedIntervals[0];
    const notFinestInterval = allowedIntervals[allowedIntervals.length - 1];

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000;

    const maxZoomPxPerMin = MIN_PX_PER_TICK / finestInterval.minutes;
    const maxConstraintZoom = maxZoomPxPerMin / basePxPerMin + 1;

    const minZoomPxPerMin = MIN_PX_PER_TICK / notFinestInterval.minutes;
    const minConstraintZoom = minZoomPxPerMin / basePxPerMin;

    // Map constraint zoom to user zoom (1 to maxConstraintZoom)
    const userMaxZoom = maxConstraintZoom;
    const userMinZoom = 1;

    return {
      userMinZoom,
      userMaxZoom,
      minConstraintZoom,
      maxConstraintZoom,
      constraint,
      basePxPerMin,
    };
  };

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

  //     const { minZoom, maxZoom } = calculateZoomExtent();

  //     // Calculate exact zoom needed to display this interval with MIN_PX_PER_TICK spacing
  //     const targetPxPerMin = MIN_PX_PER_TICK / targetInterval.minutes;
  //     let targetZoom = targetPxPerMin / basePxPerMin;

  //     // Add small buffer to ensure we're above the threshold
  //     targetZoom = targetZoom * 1.01;

  //     // Clamp zoom to valid range
  //     targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom));

  //     const pivotSvgX = pivotPositionRef.current + marginLeft;

  //     setSelectedInterval(intervalKey);

  //     svgSelectionRef.current
  //       .transition()
  //       .duration(500)
  //       .call(zoomBehaviorRef.current.scaleTo, targetZoom, [pivotSvgX, 0]);
  //   };

  const handleIntervalChange = (intervalKey: string) => {
    if (
      !zoomBehaviorRef.current ||
      !svgSelectionRef.current ||
      !xScaleRef.current
    )
      return;

    const fullSpanMs = endDate.getTime() - startDate.getTime();
    const fullWidthPx = width - marginLeft - marginRight;
    const basePxPerMs = fullWidthPx / fullSpanMs;
    const basePxPerMin = basePxPerMs * 60 * 1000;

    const targetInterval = intervals.find((i) => i.key === intervalKey);
    if (!targetInterval) return;

    const { userMinZoom, userMaxZoom, minConstraintZoom, maxConstraintZoom } =
      calculateZoomExtent();

    // Calculate constraint zoom needed
    const targetPxPerMin = MIN_PX_PER_TICK / targetInterval.minutes;
    let targetConstraintZoom = targetPxPerMin / basePxPerMin;
    targetConstraintZoom = targetConstraintZoom * 1.01;
    targetConstraintZoom = Math.max(
      minConstraintZoom,
      Math.min(maxConstraintZoom, targetConstraintZoom)
    );

    // Map to user zoom
    let targetUserZoom = mapConstraintToZoom(
      targetConstraintZoom,
      minConstraintZoom,
      maxConstraintZoom
    );
    targetUserZoom = Math.max(
      userMinZoom,
      Math.min(userMaxZoom, targetUserZoom)
    );

    const pivotSvgX = pivotPositionRef.current + marginLeft;

    setSelectedInterval(intervalKey);

    svgSelectionRef.current
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.scaleTo, targetUserZoom, [pivotSvgX, 0]);
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
    const {
      userMinZoom: minZoom,
      userMaxZoom: maxZoom,
      maxConstraintZoom,
      minConstraintZoom,
    } = calculateZoomExtent();

    const xAxis = (g: any, x: any) => {
      const domain = x.domain();
      const range = x.range();
      const spanMs = domain[1].getTime() - domain[0].getTime();
      const pixelWidth = range[1] - range[0];
      const pxPerMin = pixelWidth / (spanMs / (1000 * 60));

      const currentInterval = getInterval(pxPerMin, activeConstraint);

      let tickValues;
      if (currentInterval.key === "3M") {
        tickValues = d3.timeMonth
          .every(3)!
          .range(new Date(domain[0]), new Date(domain[1].getTime() + 86400000));
      } else if (currentInterval.key === "1M") {
        tickValues = d3.timeMonth
          .every(1)!
          .range(new Date(domain[0]), new Date(domain[1].getTime() + 86400000));
      } else {
        tickValues = x.ticks(currentInterval.interval);
      }

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
      const userZoom = event.transform.k;

      // Map user zoom to constraint zoom for calculations
      const constraintZoom = mapZoomToConstraint(
        userZoom,
        minConstraintZoom,
        maxConstraintZoom
      );
      const xz = event.transform.rescaleX(x);
      xScaleRef.current = xz;

      gx.call(xAxis, xz);
      gx.select(".domain").remove();

      const visibleDomain = xz.domain();
      const visibleMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
      const visibleDays = visibleMs / (1000 * 60 * 60 * 24);

      const currentPxPerMin = basePxPerMin * constraintZoom;

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

      const isAtMinZoom = Math.abs(userZoom - minZoom) < 0.01;
      const isAtMaxZoom = Math.abs(userZoom - maxZoom) < 0.01;

      setZoomInfo({
        current: currentInterval.key,
        currentPxPerMin: +currentPxPerMin.toFixed(4),
        zoomLevel: constraintZoom.toFixed(2),
        zoomIn: zoomInText,
        zoomOut: zoomOutText,
        visibleDays: visibleDays,
        totalDays: getTotalDays(),
        constraint: `${activeConstraint.maxZoomIntervalKey} - ${activeConstraint.minZoomIntervalKey}`,
        minZoom: minConstraintZoom,
        maxZoom: maxConstraintZoom,
        isAtMinZoom,
        isAtMaxZoom,
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
    const targetPxPerMin = MIN_PX_PER_TICK / initialIntervalConfig.minutes;
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
        setZoomInfo((prev) => ({ ...prev, current: currentInterval.key }));
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

      <div className="mt-4 w-full space-y-3">
        <div className="text-sm text-gray-600 text-center mb-3">
          Scroll to zoom, drag to pan, or use the dropdown to select a zoom
          level. Drag the tooltip to move the pivot line.
          <br />
          <span className="text-xs text-gray-500">
            Zoom constraints are fixed based on total timeline span (
            {getTotalDays().toFixed(1)} days)
          </span>
        </div>

        {/* Min Zoom Reached Indicator */}
        {zoomInfo.isAtMinZoom && (
          <div className="mx-auto max-w-md flex items-center gap-3 px-4 py-3 bg-red-100 border-2 border-red-500 rounded-lg shadow-lg">
            <span className="text-3xl">📍</span>
            <div>
              <p className="text-sm font-bold text-red-800">
                Minimum Zoom Reached
              </p>
              <p className="text-xs text-red-700">
                Viewing entire timeline at {zoomInfo.minZoom.toFixed(2)}x zoom
              </p>
            </div>
          </div>
        )}

        {/* Max Zoom Reached Indicator */}
        {zoomInfo.isAtMaxZoom && (
          <div className="mx-auto max-w-md flex items-center gap-3 px-4 py-3 bg-green-100 border-2 border-green-500 rounded-lg shadow-lg">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="text-sm font-bold text-green-800">
                Maximum Zoom Reached
              </p>
              <p className="text-xs text-green-700">
                At finest detail level at {zoomInfo.maxZoom.toFixed(2)}x zoom
              </p>
            </div>
          </div>
        )}

        {/* Zoom Range Display */}
        <div className="flex items-center justify-center gap-4 px-4">
          <span className="text-xs text-gray-600 font-semibold">
            Zoom Level:
          </span>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
            <span className="text-xs font-mono bg-red-100 px-3 py-1 rounded text-red-700 font-bold">
              Min: {zoomInfo.minZoom.toFixed(2)}x
            </span>
            <span className="text-xs text-gray-400 font-bold">|</span>
            <span className="text-xs font-mono bg-blue-100 px-3 py-1 rounded text-blue-700 font-bold">
              Current: {zoomInfo.zoomLevel}x
            </span>
            <span className="text-xs text-gray-400 font-bold">|</span>
            <span className="text-xs font-mono bg-green-100 px-3 py-1 rounded text-green-700 font-bold">
              Max: {zoomInfo.maxZoom.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomableTimeline;

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
// ];

// interface ZoomRangeConstraint {
//   rangeDays: number;
//   maxZoomIntervalKey: string;
//   minZoomIntervalKey: string;
// }

// const ZOOM_CONSTRAINTS: ZoomRangeConstraint[] = [
//   { rangeDays: 7, maxZoomIntervalKey: "5m", minZoomIntervalKey: "6h" },
//   { rangeDays: 21, maxZoomIntervalKey: "30m", minZoomIntervalKey: "1d" },
//   { rangeDays: 200, maxZoomIntervalKey: "1h", minZoomIntervalKey: "1w" },
//   { rangeDays: Infinity, maxZoomIntervalKey: "3h", minZoomIntervalKey: "1M" },
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
//   timelineConfig = { initialInterval: 5, scrollTo: "start" },
// }: ZoomableTimelineProps) => {
//   const svgRef = useRef<SVGSVGElement>(null);
//   const timelineRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const initialWidthRef = useRef(null);
//   const { width: actualWidth } = useResizeObserver(containerRef);
//   const { width: fallbackWidth } = useResizeObserver(initialWidthRef);
//   const width = actualWidth === 0 ? fallbackWidth : actualWidth;
//   const [colorBlocks, setColorBlocks] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [zoomInfo, setZoomInfo] = useState({
//     current: "",
//     currentPxPerMin: 0,
//     zoomLevel: "0",
//     zoomIn: "",
//     zoomOut: "",
//     visibleDays: 0,
//     totalDays: 0,
//     constraint: "",
//     minZoom: 1,
//     maxZoom: 1,
//     isAtMinZoom: false,
//     isAtMaxZoom: false,
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

//   const startDate = new Date("2025-09-01T23:00:00.000Z");
//   const endDate = new Date("2026-09-29T05:59:00.000Z");

//   const MIN_PX_PER_TICK = 75;

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
//     let blockCount = 0;
//     const maxBlocks = 5000;

//     while (current < endDate && blockCount < maxBlocks) {
//       const duration = Math.random() * 3600000 * 8 + 3600000;
//       const blockEnd = new Date(
//         Math.min(current.getTime() + duration, endDate.getTime())
//       );

//       blocks.push({
//         start: new Date(current),
//         end: blockEnd,
//         color: colors[Math.floor(Math.random() * colors.length)],
//       });

//       current.setTime(blockEnd.getTime());
//       blockCount++;
//     }

//     return blocks;
//   };

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       const blocks = generateColorBlocks();
//       setColorBlocks(blocks);
//       console.log(blocks, "------blocks");
//       setIsLoading(false);
//     }, 5000);

//     return () => clearTimeout(timer);
//   }, []);

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

//   const mapZoomToConstraint = (
//     userZoom,
//     minConstraintZoom,
//     maxConstraintZoom
//   ) => {
//     if (userZoom <= 1) return minConstraintZoom;
//     const mapped =
//       minConstraintZoom +
//       ((userZoom - 1) * (maxConstraintZoom - minConstraintZoom)) /
//         (maxConstraintZoom - 1);
//     return Math.min(mapped, maxConstraintZoom);
//   };

//   const mapConstraintToZoom = (
//     constraintZoom,
//     minConstraintZoom,
//     maxConstraintZoom
//   ) => {
//     if (constraintZoom <= minConstraintZoom) return 1;
//     const mapped =
//       1 +
//       ((constraintZoom - minConstraintZoom) * (maxConstraintZoom - 1)) /
//         (maxConstraintZoom - minConstraintZoom);
//     return Math.min(mapped, maxConstraintZoom);
//   };

//   const calculateZoomExtent = () => {
//     if (width === 0) {
//       return {
//         userMinZoom: 1,
//         userMaxZoom: 5,
//         minConstraintZoom: 1,
//         maxConstraintZoom: 5,
//         constraint: getActiveConstraint(),
//         basePxPerMin: 1,
//       };
//     }

//     const constraint = getActiveConstraint();
//     const allowedIntervals = getAllowedIntervals(constraint);

//     const finestInterval = allowedIntervals[0];
//     const notFinestInterval = allowedIntervals[allowedIntervals.length - 1];

//     const fullSpanMs = endDate.getTime() - startDate.getTime();
//     const fullWidthPx = width - marginLeft - marginRight;
//     const basePxPerMs = fullWidthPx / fullSpanMs;
//     const basePxPerMin = basePxPerMs * 60 * 1000;

//     const maxZoomPxPerMin = MIN_PX_PER_TICK / finestInterval.minutes;
//     const maxConstraintZoom = maxZoomPxPerMin / basePxPerMin + 1;

//     const minZoomPxPerMin = MIN_PX_PER_TICK / notFinestInterval.minutes;
//     const minConstraintZoom = minZoomPxPerMin / basePxPerMin;

//     const userMaxZoom = maxConstraintZoom;
//     const userMinZoom = 1;

//     return {
//       userMinZoom,
//       userMaxZoom,
//       minConstraintZoom,
//       maxConstraintZoom,
//       constraint,
//       basePxPerMin,
//     };
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

//     const { userMinZoom, userMaxZoom, minConstraintZoom, maxConstraintZoom } =
//       calculateZoomExtent();

//     const targetPxPerMin = MIN_PX_PER_TICK / targetInterval.minutes;
//     let targetConstraintZoom = targetPxPerMin / basePxPerMin;
//     targetConstraintZoom = targetConstraintZoom * 1.01;
//     targetConstraintZoom = Math.max(
//       minConstraintZoom,
//       Math.min(maxConstraintZoom, targetConstraintZoom)
//     );

//     let targetUserZoom = mapConstraintToZoom(
//       targetConstraintZoom,
//       minConstraintZoom,
//       maxConstraintZoom
//     );
//     targetUserZoom = Math.max(
//       userMinZoom,
//       Math.min(userMaxZoom, targetUserZoom)
//     );

//     const pivotSvgX = pivotPositionRef.current + marginLeft;

//     setSelectedInterval(intervalKey);

//     svgSelectionRef.current
//       .transition()
//       .duration(500)
//       .call(zoomBehaviorRef.current.scaleTo, targetUserZoom, [pivotSvgX, 0]);
//   };

//   useEffect(() => {
//     console.log(width, colorBlocks.length, "-----------rendering");
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
//     const {
//       userMinZoom: minZoom,
//       userMaxZoom: maxZoom,
//       maxConstraintZoom,
//       minConstraintZoom,
//       basePxPerMin: basePxPerMinValue,
//     } = calculateZoomExtent();

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
//           .every(3)!
//           .range(new Date(domain[0]), new Date(domain[1].getTime() + 86400000));
//       } else if (currentInterval.key === "1M") {
//         tickValues = d3.timeMonth
//           .every(1)!
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
//       const userZoom = event.transform.k;
//       const constraintZoom = mapZoomToConstraint(
//         userZoom,
//         minConstraintZoom,
//         maxConstraintZoom
//       );

//       const xz = event.transform.rescaleX(x);
//       xScaleRef.current = xz;

//       gx.call(xAxis, xz);
//       gx.select(".domain").remove();

//       const visibleDomain = xz.domain();
//       const visibleMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
//       const visibleDays = visibleMs / (1000 * 60 * 60 * 24);

//       const currentPxPerMin = basePxPerMinValue * constraintZoom;

//       const currentInterval = getInterval(currentPxPerMin, activeConstraint);
//       const allowedIntervals = getAllowedIntervals(activeConstraint);
//       const isIntervalAllowed = allowedIntervals.some(
//         (i) => i.key === currentInterval.key
//       );

//       if (isIntervalAllowed) {
//         setSelectedInterval(currentInterval.key);
//       }

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
//         const neededConstraintZoom = neededPxPerMin / basePxPerMinValue;
//         zoomInText = `${zoomInInterval.key} (at ~${neededConstraintZoom.toFixed(2)}x)`;
//       }

//       if (zoomOutInterval) {
//         const neededPxPerMin = MIN_PX_PER_TICK / zoomOutInterval.minutes;
//         const neededConstraintZoom = neededPxPerMin / basePxPerMinValue;
//         zoomOutText = `${zoomOutInterval.key} (at ~${neededConstraintZoom.toFixed(2)}x)`;
//       }

//       const isAtMinZoom = Math.abs(userZoom - minZoom) < 0.01;
//       const isAtMaxZoom = Math.abs(userZoom - maxZoom) < 0.01;

//       setZoomInfo({
//         current: currentInterval.key,
//         currentPxPerMin: +currentPxPerMin.toFixed(4),
//         zoomLevel: constraintZoom.toFixed(2),
//         zoomIn: zoomInText,
//         zoomOut: zoomOutText,
//         visibleDays: visibleDays,
//         totalDays: getTotalDays(),
//         constraint: `${activeConstraint.maxZoomIntervalKey} - ${activeConstraint.minZoomIntervalKey}`,
//         minZoom: minConstraintZoom,
//         maxZoom: maxConstraintZoom,
//         isAtMinZoom,
//         isAtMaxZoom,
//       });

//       updateTimeline(xz);
//       updatePivotDateFromScale(pivotPositionRef.current);
//     }

//     svg
//       .append("rect")
//       .attr("width", width)
//       .attr("height", height)
//       .attr("fill", "transparent")
//       .attr("pointer-events", "all")
//       .call(zoom as any);

//     const initialIntervalConfig = intervals[timelineConfig.initialInterval];
//     const targetPxPerMin = MIN_PX_PER_TICK / initialIntervalConfig.minutes;
//     let initialConstraintZoom = targetPxPerMin / basePxPerMinValue;
//     let initialZoomLevel = mapConstraintToZoom(
//       initialConstraintZoom,
//       minConstraintZoom,
//       maxConstraintZoom
//     );

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
//       .transition()
//       .duration(750)
//       .call(zoom.scaleTo as any, initialZoomLevel, [x(centerDate), 0])
//       .on("end", () => {
//         const currentScale = d3.zoomTransform(svg.node()!).rescaleX(x);
//         xScaleRef.current = currentScale;
//         updatePivotDateFromScale(pivotPositionRef.current);

//         const visibleDomain = currentScale.domain();
//         const spanMs = visibleDomain[1].getTime() - visibleDomain[0].getTime();
//         const pixelWidth = width - marginLeft - marginRight;
//         const pxPerMin = pixelWidth / (spanMs / (1000 * 60));
//         const currentInterval = getInterval(pxPerMin, activeConstraint);
//         const allowedIntervals = getAllowedIntervals(activeConstraint);
//         const isIntervalAllowed = allowedIntervals.some(
//           (i) => i.key === currentInterval.key
//         );
//         if (isIntervalAllowed) {
//           setSelectedInterval(currentInterval.key);
//         }
//       });

//     function updateTimeline(scale: any) {
//       if (!timelineRef.current) return;

//       timelineRef.current.innerHTML = "";

//       const visibleDomain = scale.domain();
//       const bufferMs =
//         (visibleDomain[1].getTime() - visibleDomain[0].getTime()) * 0.2;
//       const minVisible = new Date(visibleDomain[0].getTime() - bufferMs);
//       const maxVisible = new Date(visibleDomain[1].getTime() + bufferMs);

//       colorBlocks.forEach((block) => {
//         if (block.end < minVisible || block.start > maxVisible) {
//           return;
//         }

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
//           div.style.boxSizing = "border-box";
//           timelineRef.current!.appendChild(div);
//         }
//       });
//     }

//     updateTimeline(x);
//   }, [colorBlocks, width, isLoading]);

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

//   const Loader = () => {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="flex flex-col items-center gap-6">
//           <div className="relative w-20 h-20">
//             <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
//             <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
//           </div>
//           <div className="text-center">
//             <p className="text-xl font-semibold text-gray-800">
//               Loading Timeline...
//             </p>
//             <p className="text-sm text-gray-500 mt-2">
//               Generating color blocks
//             </p>
//           </div>
//           <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
//             <div className="h-full bg-blue-500 animate-pulse"></div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   console.log(fallbackWidth, actualWidth, width, "-------width");

//   return (
//     <div className="flex flex-col items-center bg-gray-50 overflow-x-hidden p-4">
//       <div className="mb-4 p-4 bg-white rounded-lg shadow-md text-sm font-mono w-full border border-gray-200">
//         <div className="grid grid-cols-4 gap-4 mb-3" ref={initialWidthRef}>
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

//       {isLoading ? (
//         <Loader />
//       ) : (
//         <>
//           <div
//             className="bg-white rounded-lg shadow-lg w-full relative"
//             ref={containerRef}
//             onMouseMove={(e) => handlePivotMove(e.clientX)}
//             onMouseUp={handlePivotEnd}
//             onMouseLeave={handlePivotEnd}
//             onTouchMove={(e) => handlePivotMove(e.touches[0].clientX)}
//             onTouchEnd={handlePivotEnd}
//             style={{ cursor: isDragging ? "grabbing" : "default" }}
//           >
//             <svg
//               ref={svgRef}
//               viewBox={`0 0 ${width} ${height}`}
//               width={width}
//               height={height}
//               style={{
//                 maxWidth: "100%",
//                 height: "auto",
//                 display: "block",
//               }}
//             />

//             <div
//               className="absolute top-12 bg-amber-200"
//               style={{
//                 width: `${width - marginLeft - marginRight}px`,
//                 height: `${timelineHeight}px`,
//                 marginLeft: `${marginLeft}px`,
//                 marginTop: "10px",
//                 border: "1px solid #ccc",
//                 overflow: "hidden",
//                 pointerEvents: "none",
//               }}
//               ref={timelineRef}
//             />

//             <div
//               className="absolute"
//               style={{
//                 left: `${marginLeft + pivotPosition}px`,
//                 top: "0",
//                 bottom: "0",
//                 width: "2px",
//                 backgroundColor: "#2563eb",
//                 pointerEvents: "none",
//                 zIndex: 10,
//               }}
//             >
//               <div
//                 className="absolute"
//                 style={{
//                   top: "-1px",
//                   left: "50%",
//                   transform: "translateX(-50%)",
//                   width: "0",
//                   height: "0",
//                   borderLeft: "6px solid transparent",
//                   borderRight: "6px solid transparent",
//                   borderTop: "8px solid #2563eb",
//                 }}
//               />

//               <div
//                 className="absolute"
//                 style={{
//                   bottom: "-1px",
//                   left: "50%",
//                   transform: "translateX(-50%)",
//                   width: "0",
//                   height: "0",
//                   borderLeft: "6px solid transparent",
//                   borderRight: "6px solid transparent",
//                   borderBottom: "8px solid #2563eb",
//                 }}
//               />
//             </div>

//             <div
//               className="absolute bg-white border-2 border-blue-600 rounded-lg shadow-lg px-3 py-2"
//               style={{
//                 left: `${marginLeft + pivotPosition}px`,
//                 top: "-45px",
//                 transform: "translateX(-50%)",
//                 pointerEvents: "auto",
//                 zIndex: 20,
//                 userSelect: "none",
//                 cursor: isDragging ? "grabbing" : "grab",
//               }}
//               onMouseDown={(e) => handlePivotStart(e.clientX)}
//               onTouchStart={(e) => handlePivotStart(e.touches[0].clientX)}
//             >
//               <div className="text-xs font-semibold text-gray-700 whitespace-nowrap flex items-center gap-1">
//                 <span>{formatPivotDate(pivotDate)}</span>
//                 <span className="text-blue-600">⟷</span>
//               </div>
//             </div>
//           </div>

//           <div className="mt-4 w-full space-y-3">
//             <div className="text-sm text-gray-600 text-center mb-3">
//               Scroll to zoom, drag to pan, or use the dropdown to select a zoom
//               level. Drag the tooltip to move the pivot line.
//               <br />
//               <span className="text-xs text-gray-500">
//                 Zoom constraints are fixed based on total timeline span (
//                 {getTotalDays().toFixed(1)} days)
//               </span>
//             </div>

//             {/* Min Zoom Reached Indicator */}
//             {zoomInfo.isAtMinZoom && (
//               <div className="mx-auto max-w-md flex items-center gap-3 px-4 py-3 bg-red-100 border-2 border-red-500 rounded-lg shadow-lg">
//                 <span className="text-3xl">📍</span>
//                 <div>
//                   <p className="text-sm font-bold text-red-800">
//                     Minimum Zoom Reached
//                   </p>
//                   <p className="text-xs text-red-700">
//                     Viewing entire timeline at {zoomInfo.minZoom.toFixed(2)}x
//                     zoom
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Max Zoom Reached Indicator */}
//             {zoomInfo.isAtMaxZoom && (
//               <div className="mx-auto max-w-md flex items-center gap-3 px-4 py-3 bg-green-100 border-2 border-green-500 rounded-lg shadow-lg">
//                 <span className="text-3xl">🔍</span>
//                 <div>
//                   <p className="text-sm font-bold text-green-800">
//                     Maximum Zoom Reached
//                   </p>
//                   <p className="text-xs text-green-700">
//                     At finest detail level at {zoomInfo.maxZoom.toFixed(2)}x
//                     zoom
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Zoom Range Display */}
//             <div className="flex items-center justify-center gap-4 px-4">
//               <span className="text-xs text-gray-600 font-semibold">
//                 Zoom Level:
//               </span>
//               <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-gray-300">
//                 <span className="text-xs font-mono bg-red-100 px-3 py-1 rounded text-red-700 font-bold">
//                   Min: {zoomInfo.minZoom.toFixed(2)}x
//                 </span>
//                 <span className="text-xs text-gray-400 font-bold">|</span>
//                 <span className="text-xs font-mono bg-blue-100 px-3 py-1 rounded text-blue-700 font-bold">
//                   Current: {zoomInfo.zoomLevel}x
//                 </span>
//                 <span className="text-xs text-gray-400 font-bold">|</span>
//                 <span className="text-xs font-mono bg-green-100 px-3 py-1 rounded text-green-700 font-bold">
//                   Max: {zoomInfo.maxZoom.toFixed(2)}x
//                 </span>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ZoomableTimeline;
