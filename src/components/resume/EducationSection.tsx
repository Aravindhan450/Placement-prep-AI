import { Plus, Trash2 } from "lucide-react";

type Education = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

type Props = {
  education: Education[];
  onChange: (education: Education[]) => void;
};

export default function EducationSection({ education, onChange }: Props) {
  const addEducation = () => {
    onChange([
      ...education,
      { institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" },
    ]);
  };

  const removeEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = education.map((edu, i) =>
      i === index ? { ...edu, [field]: value } : edu
    );
    onChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Education</h3>
        <button
          onClick={addEducation}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-4">
        {education.map((edu, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Education {index + 1}
              </h4>
              <button
                onClick={() => removeEducation(index)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              >
                <Trash2 size={14} className="text-red-600 dark:text-red-400" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Institution"
              value={edu.institution}
              onChange={(e) => updateEducation(index, "institution", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Degree (e.g., Bachelor's)"
                value={edu.degree}
                onChange={(e) => updateEducation(index, "degree", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="Field of Study"
                value={edu.field}
                onChange={(e) => updateEducation(index, "field", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Start Year"
                value={edu.startDate}
                onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="End Year"
                value={edu.endDate}
                onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="GPA (optional)"
                value={edu.gpa}
                onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        ))}

        {education.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No education added yet. Click "Add" to get started.
          </p>
        )}
      </div>
    </div>
  );
}
