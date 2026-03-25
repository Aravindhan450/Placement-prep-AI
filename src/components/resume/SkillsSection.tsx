import { Plus, X } from "lucide-react";
import { useState } from "react";

type Props = {
  skills: string[];
  onChange: (skills: string[]) => void;
};

export default function SkillsSection({ skills, onChange }: Props) {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    onChange(skills.filter((s) => s !== skill));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Add a skill (e.g., JavaScript, Python)"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addSkill()}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
        <button
          onClick={addSkill}
          className="flex items-center gap-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
          >
            <span>{skill}</span>
            <button
              onClick={() => removeSkill(skill)}
              className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
            No skills added yet
          </p>
        )}
      </div>
    </div>
  );
}
