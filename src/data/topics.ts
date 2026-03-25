export interface Topic {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

export const TOPICS: Topic[] = [
  { 
    id: "recursion", 
    title: "Recursion", 
    desc: "Base cases & call stacks", 
    icon: "⟳" 
  },
  { 
    id: "arrays", 
    title: "Arrays & Strings", 
    desc: "Sorting, searching, two pointers", 
    icon: "▦" 
  },
  { 
    id: "linked list", 
    title: "Linked Lists", 
    desc: "Traversal & manipulation", 
    icon: "⋈" 
  },
  { 
    id: "stack", 
    title: "Stack & Queue", 
    desc: "LIFO & FIFO operations", 
    icon: "⊞" 
  },
  { 
    id: "binary tree", 
    title: "Trees & Graphs", 
    desc: "BFS, DFS, traversals", 
    icon: "⑂" 
  },
  { 
    id: "dynamic programming", 
    title: "Dynamic Programming", 
    desc: "Memoization & tabulation", 
    icon: "◈" 
  },
  { 
    id: "operating systems", 
    title: "Operating Systems", 
    desc: "Processes & scheduling", 
    icon: "⊙" 
  },
  { 
    id: "database management", 
    title: "Database Management", 
    desc: "SQL & indexing", 
    icon: "⊞" 
  },
  { 
    id: "computer networks", 
    title: "Computer Networks", 
    desc: "Protocols & architecture", 
    icon: "⊛" 
  },
  { 
    id: "hr", 
    title: "HR / Behavioral", 
    desc: "Behavioral & situational skills", 
    icon: "◎" 
  }
];
