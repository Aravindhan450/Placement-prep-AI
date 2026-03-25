import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";

export interface DashboardData {
  sessionCount: number;
  attemptCount: number;
  weakConceptCount: number;
}

interface DashboardContextValue {
  dashboardData: DashboardData;
  loadDashboardData: () => Promise<void>;
}

const initialDashboardData: DashboardData = {
  sessionCount: 0,
  attemptCount: 0,
  weakConceptCount: 0,
};

const DashboardContext = createContext<DashboardContextValue>({
  dashboardData: initialDashboardData,
  loadDashboardData: async () => {},
});

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);

  const loadDashboardData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDashboardData(initialDashboardData);
      return;
    }

    const [
      { count: sessionCount, error: sessionCountError },
      { count: attemptCount, error: attemptCountError },
      { data: learningState, error: learningStateError },
    ] = await Promise.all([
      supabase
        .from("interview_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("attempt_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_learning_state")
        .select("weak_concepts")
        .eq("user_id", user.id)
        .order("last_updated", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (sessionCountError) throw new Error(sessionCountError.message);
    if (attemptCountError) throw new Error(attemptCountError.message);
    if (learningStateError) throw new Error(learningStateError.message);

    setDashboardData({
      sessionCount: sessionCount ?? 0,
      attemptCount: attemptCount ?? 0,
      weakConceptCount: learningState?.weak_concepts?.length ?? 0,
    });
  }, []);

  const value = useMemo(
    () => ({
      dashboardData,
      loadDashboardData,
    }),
    [dashboardData, loadDashboardData]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
