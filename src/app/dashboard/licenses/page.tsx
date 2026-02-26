import { KeyRound, Plus } from "lucide-react";

export default function LicensesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">License Catalog</h1>
          <p className="text-sm text-silver-400 mt-1">
            Manage software licenses and assignments.
          </p>
        </div>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Add License
        </button>
      </div>

      {/* Empty state */}
      <div className="qy-card flex flex-col items-center justify-center py-16">
        <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
          <KeyRound className="h-8 w-8 text-qyburn-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          No licenses configured
        </h3>
        <p className="text-sm text-silver-400 mb-4 text-center max-w-md">
          Add software licenses to your catalog so users can request them
          through Qyburn.
        </p>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Add Your First License
        </button>
      </div>
    </div>
  );
}
