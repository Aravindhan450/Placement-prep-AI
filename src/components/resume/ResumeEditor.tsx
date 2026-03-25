import { Save } from "lucide-react";
import ExperienceSection from "./ExperienceSection";
import ProjectsSection from "./ProjectsSection";
import SkillsSection from "./SkillsSection";
import EducationSection from "./EducationSection";

export type ResumeData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string;
    link: string;
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
  }>;
};

type Props = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function ResumeEditor({ resume, onChange, onSave, isSaving }: Props) {
  const updateField = (field: keyof ResumeData, value: any) => {
    onChange({ ...resume, [field]: value });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Save Button */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resume Builder
          </h2>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={20} />
            <span>{isSaving ? "Saving..." : "Save Resume"}</span>
          </button>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={resume.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="Email"
                value={resume.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={resume.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Location"
                value={resume.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Professional Summary
          </h3>
          <textarea
            placeholder="Write a brief summary about yourself, your experience, and career goals..."
            value={resume.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        {/* Experience Section */}
        <ExperienceSection
          experiences={resume.experience}
          onChange={(exp) => updateField("experience", exp)}
        />

        {/* Projects Section */}
        <ProjectsSection
          projects={resume.projects}
          onChange={(proj) => updateField("projects", proj)}
        />

        {/* Skills Section */}
        <SkillsSection
          skills={resume.skills}
          onChange={(skills) => updateField("skills", skills)}
        />

        {/* Education Section */}
        <EducationSection
          education={resume.education}
          onChange={(edu) => updateField("education", edu)}
        />
      </div>
    </div>
  );
}
