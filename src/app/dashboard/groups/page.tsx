import { ShieldCheck, Plus } from "lucide-react";

export default function GroupsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Restricted Groups</h1>
          <p className="text-sm text-silver-400 mt-1">
            Manage Azure AD groups that require approval for membership.
          </p>
        </div>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      <div className="qy-card flex flex-col items-center justify-center py-16">
        <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
          <ShieldCheck className="h-8 w-8 text-qyburn-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          No restricted groups
        </h3>
        <p className="text-sm text-silver-400 mb-4 text-center max-w-md">
          Define which Azure AD groups require approval before users can be
          added by the bot.
        </p>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Add Your First Group
        </button>
      </div>
    </div>
  );
}
