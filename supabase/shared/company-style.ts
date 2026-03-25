export type CompanyStyle = {
  focus: string;
  evaluationBias: string;
  followupStyle: string;
};

export const COMPANY_STYLE: Record<string, CompanyStyle> = {
  google: {
    focus: "algorithmic clarity and optimal complexity",
    evaluationBias: "penalize brute-force solutions",
    followupStyle: "ask optimization questions",
  },
  amazon: {
    focus: "practical tradeoffs and leadership principles",
    evaluationBias: "reward structured reasoning",
    followupStyle: "scenario-based probing",
  },
  microsoft: {
    focus: "communication and correctness",
    evaluationBias: "reward explainability",
    followupStyle: "ask clarifying follow-up questions",
  },
};
