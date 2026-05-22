// Zustand store for persisting coach-authored drill recommendation templates.
// Templates let a coach save a frequently-used drill+reps combo and apply it
// in one click from the ClipActionBar's RecommendDrillForm.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DrillTemplate = {
  id: string;
  name: string;        // coach-given label (e.g. "Post footwork fix")
  drillName: string;
  reps: string;        // e.g. "5 sets of 10, daily"
  issueCategory?: string;
  savedAt: string;     // ISO timestamp
};

type DrillTemplateState = {
  templates: DrillTemplate[];
  save: (input: Omit<DrillTemplate, "id" | "savedAt">) => DrillTemplate;
  remove: (id: string) => void;
};

let _seq = 0;
const newId = () => `tpl_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

export const useDrillTemplateStore = create<DrillTemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      save: (input) => {
        const tpl: DrillTemplate = { ...input, id: newId(), savedAt: new Date().toISOString() };
        set({ templates: [tpl, ...get().templates] });
        return tpl;
      },

      remove: (id) => {
        set({ templates: get().templates.filter((t) => t.id !== id) });
      },
    }),
    { name: "hoopsiq.drillTemplates.v1" },
  ),
);
