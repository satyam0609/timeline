"use client";
import ZoomableTimeline6 from "@/components/timeline5";
import ZoomableTimelineV1 from "@/components/timeline8";
import ZoomableTimeline from "@/components/timelinedemo1";
import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);
  return (
    <div className="">
      {/* <ZoomableTimeline />
      <div>
        <ZoomableTimeline1 />
      </div>
      <div>
        <ZoomableTimeline4 />
      </div> */}
      {/* <div>
        <ZoomableTimeline5 />
      </div> */}
      {/* <div>
        <NewZoomableTimeline />
      </div> */}
      <div>
        <ZoomableTimelineV1 loading={loading} />
      </div>

      <div>
        <ZoomableTimeline />
      </div>
      <ZoomableTimeline6 />
    </div>
  );
}
