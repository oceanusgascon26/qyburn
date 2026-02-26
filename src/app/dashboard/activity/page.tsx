import { Bot, MessageSquare } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Activity</h1>
          <p className="text-sm text-silver-400 mt-1">
            Monitor Qyburn&apos;s conversations and actions in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-wildfire-500 animate-pulse" />
          <span className="text-sm text-wildfire-400">Live</span>
        </div>
      </div>

      <div className="qy-card flex flex-col items-center justify-center py-16">
        <div className="bg-wildfire-900/40 rounded-full p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-wildfire-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          No activity recorded
        </h3>
        <p className="text-sm text-silver-400 text-center max-w-md">
          Bot conversations and actions will stream here once the Slack bot is
          connected and handling requests.
        </p>
      </div>
    </div>
  );
}
