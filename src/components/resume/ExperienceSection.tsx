import { Plus, Trash2 } from "lucide-react";

type Experience = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Props = {
  experiences: Experience[];
  onChange: (experiences: Experience[]) => void;
};

export default function ExperienceSection({ experiences, onChange }: Props) {
  const addExperience = () => {
    onChange([
      ...experiences,
      { company: "", position: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const removeExperience = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = experiences.map((exp, i) =>
      i === index ? { ...exp, [field]: value } : exp
    );
    onChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Work Experience
        </h3>
        <button
          onClick={addExperience}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-4">
        {experiences.map((exp, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Experience {index + 1}
              </h4>
              <button
                onClick={() => removeExperience(index)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 size={14} className="text-red-600 dark:text-red-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExperience(index, "company", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="Position"
                value={exp.position}
                onChange={(e) => updateExperience(index, "position", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Start Date (e.g., Jan 2022)"
                value={exp.startDate}
                onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="End Date (or Present)"
                value={exp.endDate}
                onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <textarea
              placeholder="Describe your responsibilities and achievements..."
              value={exp.description}
              onChange={(e) => updateExperience(index, "description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
            />
          </div>
        ))}

        {experiences.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No experience added yet. Click "Add" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
