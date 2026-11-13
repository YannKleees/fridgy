import { useMemo } from "react";
import scanVideo from "@/assets/scan-loading.mp4";
import fridgyVideo from "@/assets/fridgy-assasini.mp4";

export function ScanLoader() {
  const activeVideo = useMemo(() => {
    // Math.random() returns 0-1. If less than 0.3 (30%), use fridgyVideo.
    return Math.random() < 0.2 ? fridgyVideo : scanVideo;
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <video
        src={activeVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full max-w-[280px] rounded-xl"
      />
      <p className="scan-loader mt-4">
        <span>Scanning</span>
      </p>
    </div>
  );
}
