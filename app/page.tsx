import AlertsSidebar from "@/components/AlertsSidebar";
import LiveMapWrapper from "@/components/LiveMapWrapper";

export default function Home() {
  return (
    <div className="flex flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 60px)" }}>
      {/* Map fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <LiveMapWrapper />
      </div>

      {/* Alerts sidebar — right edge */}
      <AlertsSidebar />
    </div>
  );
}
