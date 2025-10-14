import ZoomableTimeline from "@/components/timeline";
import ZoomableTimeline1 from "@/components/timeline1";
import ZoomableTimeline3 from "@/components/timeline2";
import ZoomableTimeline4 from "@/components/timeline3";
import ZoomableTimeline5 from "@/components/timeline4";

export default function Home() {
  return (
    <div className="">
      <ZoomableTimeline />
      <div>
        <ZoomableTimeline1 />
      </div>
      <div>
        <ZoomableTimeline3 />
      </div>
      <div>
        <ZoomableTimeline4 />
      </div>
      <div>
        <ZoomableTimeline5 />
      </div>
    </div>
  );
}
