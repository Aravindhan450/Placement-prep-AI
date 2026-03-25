import { FileText, Trash2, Plus } from "lucide-react";

type Resume = {
  id: string;
  user_id: string;
  content: any;
  created_at: string;
};

type Props = {
  resumes: Resume[];
  selectedResumeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
};

export default function ResumeSidebar({
  resumes,
  selectedResumeId,
  onSelect,
  onDelete,
  onCreate,
}: Props) {
  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto flex-shrink-0">
      <button
        onClick={onCreate}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mb-4"
      >
        <Plus size={20} />
        <span>New Resume</span>
      </button>

      <div className="space-y-2">
        {resumes.map((resume) => {
          const resumeName = resume.content?.name || "Unnamed Resume";
          const date = new Date(resume.created_at).toLocaleDateString();

          return (
            <div
              key={resume.id}
              className={`group p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                selectedResumeId === resume.id
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
              }`}
              onClick={() => onSelect(resume.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText
                    size={16}
                    className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {resumeName}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(resume.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                >
                  <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{date}</p>
            </div>
          );
        })}
        {resumes.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No resumes yet
          </p>
        )}
      </div>
    </div>
  );
}
