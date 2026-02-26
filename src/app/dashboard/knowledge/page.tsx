import { BookOpen, Plus } from "lucide-react";

export default function KnowledgePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-sm text-silver-400 mt-1">
            Manage documents that Qyburn uses to answer IT questions.
          </p>
        </div>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Add Document
        </button>
      </div>

      <div className="qy-card flex flex-col items-center justify-center py-16">
        <div className="bg-qyburn-900/40 rounded-full p-4 mb-4">
          <BookOpen className="h-8 w-8 text-qyburn-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Knowledge base is empty
        </h3>
        <p className="text-sm text-silver-400 mb-4 text-center max-w-md">
          Upload IT documentation and FAQs so Qyburn can answer questions
          accurately using RAG.
        </p>
        <button className="qy-btn-primary">
          <Plus className="h-4 w-4" />
          Upload Your First Document
        </button>
      </div>
    </div>
  );
}
