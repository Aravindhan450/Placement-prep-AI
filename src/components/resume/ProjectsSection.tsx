import { Plus, Trash2 } from "lucide-react";

type Project = {
  name: string;
  description: string;
  technologies: string;
  link: string;
};

type Props = {
  projects: Project[];
  onChange: (projects: Project[]) => void;
};

export default function ProjectsSection({ projects, onChange }: Props) {
  const addProject = () => {
    onChange([...projects, { name: "", description: "", technologies: "", link: "" }]);
  };

  const removeProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = projects.map((proj, i) =>
      i === index ? { ...proj, [field]: value } : proj
    );
    onChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projects</h3>
        <button
          onClick={addProject}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((proj, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Project {index + 1}
              </h4>
              <button
                onClick={() => removeProject(index)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 size={14} className="text-red-600 dark:text-red-400" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Project Name"
              value={proj.name}
              onChange={(e) => updateProject(index, "name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />

            <textarea
              placeholder="Project description and your role..."
              value={proj.description}
              onChange={(e) => updateProject(index, "description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
            />

            <input
              type="text"
              placeholder="Technologies used (e.g., React, Node.js, MongoDB)"
              value={proj.technologies}
              onChange={(e) => updateProject(index, "technologies", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />

            <input
              type="text"
              placeholder="Project link (optional)"
              value={proj.link}
              onChange={(e) => updateProject(index, "link", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        ))}

        {projects.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No projects added yet. Click "Add" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
