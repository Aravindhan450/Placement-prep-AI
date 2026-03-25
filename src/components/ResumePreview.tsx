import React from "react";
import { Mail, Phone, MapPin, Linkedin, Globe, Briefcase, Award, GraduationCap, Medal, Trophy } from "lucide-react";

interface ResumePreviewProps {
  resume: {
    name: string;
    jobTitle?: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    website?: string;
    photoUrl?: string;
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
      link?: string;
    }>;
    skills: string[];
    education: Array<{
      institution: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string;
      gpa?: string;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      date: string;
      link?: string;
    }>;
    achievements: Array<{
      title: string;
      description: string;
      date: string;
    }>;
  };
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  if (!resume) return null;

  return (
    <div 
      id="resume-preview"
      className="sticky top-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="text-center mb-6 border-b pb-6 border-gray-300 dark:border-gray-600">
        {resume.photoUrl && (
          <img
            src={resume.photoUrl}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-indigo-100 dark:border-indigo-900"
          />
        )}
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {resume.name || "Your Name"}
        </h1>
        
        {resume.jobTitle && (
          <p className="text-lg text-indigo-600 dark:text-indigo-400 font-medium mb-3">
            {resume.jobTitle}
          </p>
        )}

        {/* Contact Info */}
        <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          {resume.email && (
            <span className="flex items-center gap-1">
              <Mail size={14} />
              {resume.email}
            </span>
          )}
          {resume.phone && (
            <span className="flex items-center gap-1">
              <Phone size={14} />
              {resume.phone}
            </span>
          )}
          {resume.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {resume.location}
            </span>
          )}
          {resume.linkedIn && (
            <span className="flex items-center gap-1">
              <Linkedin size={14} />
              LinkedIn
            </span>
          )}
          {resume.website && (
            <span className="flex items-center gap-1">
              <Globe size={14} />
              Portfolio
            </span>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {resume.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Award size={20} className="text-indigo-600 dark:text-indigo-400" />
            Professional Summary
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {resume.summary}
          </p>
        </div>
      )}

      {/* Work Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
            Work Experience
          </h2>
          
          <div className="space-y-4">
            {resume.experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {exp.position || "Position"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {exp.company || "Company"} 
                  {(exp.startDate || exp.endDate) && (
                    <span className="ml-2">
                      | {exp.startDate} - {exp.endDate || "Present"}
                    </span>
                  )}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Award size={20} className="text-indigo-600 dark:text-indigo-400" />
            Projects
          </h2>
          
          <div className="space-y-4">
            {resume.projects.map((project, i) => (
              <div key={i} className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {project.name || "Project Name"}
                </h3>
                {project.technologies && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                    {project.technologies}
                  </p>
                )}
                {project.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                    {project.description}
                  </p>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Project →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Award size={20} className="text-indigo-600 dark:text-indigo-400" />
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <GraduationCap size={20} className="text-indigo-600 dark:text-indigo-400" />
            Education
          </h2>
          
          <div className="space-y-4">
            {resume.education.map((edu, i) => (
              <div key={i} className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {edu.degree} in {edu.field || "Field of Study"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {edu.institution || "Institution"}
                  {(edu.startDate || edu.endDate) && (
                    <span className="ml-2">
                      | {edu.startDate} - {edu.endDate || "Present"}
                    </span>
                  )}
                </p>
                {edu.gpa && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    GPA: {edu.gpa}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {resume.certifications && resume.certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Medal size={20} className="text-indigo-600 dark:text-indigo-400" />
            Certifications
          </h2>
          
          <div className="space-y-4">
            {resume.certifications.map((cert, i) => (
              <div key={i} className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {cert.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cert.issuer}
                  {cert.date && (
                    <span className="ml-2">| {cert.date}</span>
                  )}
                </p>
                {cert.link && (
                  <a
                    href={cert.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View Credential →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {resume.achievements && resume.achievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Trophy size={20} className="text-indigo-600 dark:text-indigo-400" />
            Achievements & Awards
          </h2>
          
          <div className="space-y-4">
            {resume.achievements.map((ach, i) => (
              <div key={i} className="border-l-2 border-indigo-600 dark:border-indigo-400 pl-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {ach.title}
                </h3>
                {ach.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {ach.date}
                  </p>
                )}
                {ach.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {ach.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!resume.name && !resume.email && resume.experience.length === 0 && resume.skills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Start filling out your resume to see a live preview here
          </p>
        </div>
      )}
    </div>
  );
}
