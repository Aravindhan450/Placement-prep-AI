/**
 * Master list of verified, trusted learning resources
 * Only includes platforms with high uptime and reliability
 */

export interface VerifiedResource {
  name: string;
  url: string;
  type: 'video' | 'course' | 'practice' | 'documentation';
  platform: string;
  topics: string[];
}

export const VERIFIED_RESOURCES: Record<string, VerifiedResource[]> = {
  // Python Resources
  python: [
    {
      name: 'Python Full Course - FreeCodeCamp',
      url: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
      type: 'video',
      platform: 'YouTube',
      topics: ['python', 'programming', 'basics']
    },
    {
      name: 'Python for Everybody - Coursera',
      url: 'https://www.coursera.org/specializations/python',
      type: 'course',
      platform: 'Coursera',
      topics: ['python', 'programming']
    },
    {
      name: 'Python Official Documentation',
      url: 'https://docs.python.org/3/',
      type: 'documentation',
      platform: 'Official',
      topics: ['python', 'reference']
    }
  ],

  // Machine Learning
  machine_learning: [
    {
      name: 'Machine Learning Specialization - Coursera',
      url: 'https://www.coursera.org/specializations/machine-learning-introduction',
      type: 'course',
      platform: 'Coursera',
      topics: ['machine-learning', 'ai']
    },
    {
      name: 'Fast.ai Practical Deep Learning',
      url: 'https://course.fast.ai/',
      type: 'course',
      platform: 'Fast.ai',
      topics: ['deep-learning', 'ai']
    },
    {
      name: 'Kaggle Learn',
      url: 'https://www.kaggle.com/learn',
      type: 'practice',
      platform: 'Kaggle',
      topics: ['machine-learning', 'data-science']
    }
  ],

  // Deep Learning
  deep_learning: [
    {
      name: 'Deep Learning Specialization - Coursera',
      url: 'https://www.coursera.org/specializations/deep-learning',
      type: 'course',
      platform: 'Coursera',
      topics: ['deep-learning', 'neural-networks']
    },
    {
      name: 'TensorFlow Tutorials',
      url: 'https://www.tensorflow.org/tutorials',
      type: 'documentation',
      platform: 'TensorFlow',
      topics: ['tensorflow', 'deep-learning']
    },
    {
      name: 'PyTorch Tutorials',
      url: 'https://pytorch.org/tutorials/',
      type: 'documentation',
      platform: 'PyTorch',
      topics: ['pytorch', 'deep-learning']
    }
  ],

  // JavaScript
  javascript: [
    {
      name: 'JavaScript Full Course - FreeCodeCamp',
      url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
      type: 'video',
      platform: 'YouTube',
      topics: ['javascript', 'web-development']
    },
    {
      name: 'JavaScript.info',
      url: 'https://javascript.info/',
      type: 'documentation',
      platform: 'Independent',
      topics: ['javascript', 'reference']
    },
    {
      name: 'MDN JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      type: 'documentation',
      platform: 'MDN',
      topics: ['javascript', 'reference']
    }
  ],

  // React
  react: [
    {
      name: 'React Official Tutorial',
      url: 'https://react.dev/learn',
      type: 'documentation',
      platform: 'React',
      topics: ['react', 'frontend']
    },
    {
      name: 'React Course - FreeCodeCamp',
      url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
      type: 'video',
      platform: 'YouTube',
      topics: ['react', 'frontend']
    }
  ],

  // Node.js
  nodejs: [
    {
      name: 'Node.js Official Documentation',
      url: 'https://nodejs.org/en/docs/',
      type: 'documentation',
      platform: 'Node.js',
      topics: ['nodejs', 'backend']
    },
    {
      name: 'Node.js Full Course - FreeCodeCamp',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      type: 'video',
      platform: 'YouTube',
      topics: ['nodejs', 'backend']
    }
  ],

  // Database
  databases: [
    {
      name: 'PostgreSQL Tutorial',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
      type: 'documentation',
      platform: 'PostgreSQL',
      topics: ['database', 'sql']
    },
    {
      name: 'MongoDB University',
      url: 'https://learn.mongodb.com/',
      type: 'course',
      platform: 'MongoDB',
      topics: ['database', 'nosql']
    }
  ],

  // DevOps
  devops: [
    {
      name: 'Docker Official Documentation',
      url: 'https://docs.docker.com/get-started/',
      type: 'documentation',
      platform: 'Docker',
      topics: ['docker', 'devops']
    },
    {
      name: 'Kubernetes Documentation',
      url: 'https://kubernetes.io/docs/tutorials/',
      type: 'documentation',
      platform: 'Kubernetes',
      topics: ['kubernetes', 'devops']
    }
  ],

  // Cloud
  cloud: [
    {
      name: 'AWS Training',
      url: 'https://aws.amazon.com/training/',
      type: 'course',
      platform: 'AWS',
      topics: ['aws', 'cloud']
    },
    {
      name: 'Google Cloud Skills Boost',
      url: 'https://www.cloudskillsboost.google/',
      type: 'course',
      platform: 'Google Cloud',
      topics: ['gcp', 'cloud']
    },
    {
      name: 'Microsoft Azure Learn',
      url: 'https://learn.microsoft.com/en-us/training/azure/',
      type: 'course',
      platform: 'Azure',
      topics: ['azure', 'cloud']
    }
  ],

  // System Design
  system_design: [
    {
      name: 'System Design Primer - GitHub',
      url: 'https://github.com/donnemartin/system-design-primer',
      type: 'documentation',
      platform: 'GitHub',
      topics: ['system-design', 'architecture']
    },
    {
      name: 'System Design Interview Course',
      url: 'https://www.youtube.com/playlist?list=PLMCXHnjXnTnvo6alSjVkgxV-VH6EPyvoX',
      type: 'video',
      platform: 'YouTube',
      topics: ['system-design', 'interview']
    }
  ],

  // Data Structures & Algorithms
  dsa: [
    {
      name: 'LeetCode',
      url: 'https://leetcode.com/problemset/',
      type: 'practice',
      platform: 'LeetCode',
      topics: ['algorithms', 'coding']
    },
    {
      name: 'HackerRank',
      url: 'https://www.hackerrank.com/domains/algorithms',
      type: 'practice',
      platform: 'HackerRank',
      topics: ['algorithms', 'coding']
    }
  ],

  // Mobile Development
  android: [
    {
      name: 'Android Developer Guides',
      url: 'https://developer.android.com/guide',
      type: 'documentation',
      platform: 'Android',
      topics: ['android', 'mobile']
    }
  ],

  ios: [
    {
      name: 'Apple Developer Documentation',
      url: 'https://developer.apple.com/documentation/',
      type: 'documentation',
      platform: 'Apple',
      topics: ['ios', 'swift', 'mobile']
    }
  ]
};

/**
 * Get verified resources by topic
 */
export function getVerifiedResourcesByTopic(topic: string): VerifiedResource[] {
  return VERIFIED_RESOURCES[topic] || [];
}

/**
 * Get all verified platforms
 */
export function getTrustedPlatforms(): string[] {
  return [
    'YouTube',
    'Coursera',
    'edX',
    'Fast.ai',
    'FreeCodeCamp',
    'Kaggle',
    'HuggingFace',
    'MDN',
    'GitHub',
    'Udemy',
    'Pluralsight',
    'LinkedIn Learning',
    'Udacity',
    'Codecademy',
    'Khan Academy',
    'LeetCode',
    'HackerRank',
    'AWS',
    'Google Cloud',
    'Microsoft Azure',
    'DataCamp',
    'TensorFlow',
    'PyTorch',
    'React',
    'Node.js',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Kubernetes'
  ];
}
