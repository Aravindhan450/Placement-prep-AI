export interface RoadmapSection {
  title: string;
  steps: string[];
}

export type RoadmapData = {
  [key: string]: RoadmapSection[];
};

export const ROADMAPS: RoadmapData = {
  frontend: [
    {
      title: "Foundations",
      steps: ["HTML", "CSS", "JavaScript", "Git"]
    },
    {
      title: "Core Concepts",
      steps: ["React", "State Management", "Routing", "API Integration"]
    },
    {
      title: "Advanced Topics",
      steps: ["Performance", "Accessibility", "Testing", "Animations"]
    },
    {
      title: "Projects & Practice",
      steps: ["Build Portfolio", "Real-world Projects", "Open Source"]
    },
    {
      title: "Placement Preparation",
      steps: ["System Design Basics", "Interview Prep", "Mock Interviews"]
    }
  ],

  backend: [
    {
      title: "Foundations",
      steps: ["Programming Basics", "Data Structures", "Algorithms"]
    },
    {
      title: "Core Concepts",
      steps: ["Node.js / Java / Python", "OOP", "Async Programming"]
    },
    {
      title: "Advanced Topics",
      steps: ["REST APIs", "Authentication", "Databases", "Caching"]
    },
    {
      title: "Projects & Practice",
      steps: ["Build APIs", "Real-world Projects", "System Design"]
    },
    {
      title: "Placement Preparation",
      steps: ["Scalability", "Queues", "Microservices", "Mock Interviews"]
    }
  ]
};
