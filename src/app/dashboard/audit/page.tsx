import { ScrollText, Search } from "lucide-react";

export default function AuditPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-sm text-silver-400 mt-1">
            Track all actions performed by Qyburn and administrators.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-500" />
          <input
            type="text"
            placeholder="Search logs..."
            className="qy-input pl-10 w-64"
          />
        </div>
      </div>

      <div className="qy-card flex flex-col items-center justify-center py-16">
        <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
          <ScrollText className="h-8 w-8 text-qyburn-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          No audit entries yet
        </h3>
        <p className="text-sm text-silver-400 text-center max-w-md">
          Audit logs will appear here once Qyburn starts processing requests and
          actions are taken.
        </p>
      </div>
    </div>
  );
}
