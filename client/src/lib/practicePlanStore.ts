/**
 * In-memory practice-plan store backed by localStorage so edits survive
 * navigation. In production this maps to `PUT /api/practice-plans/:id`.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import {
  practicePlans as seedPlans,
  type PracticePlan,
  type PracticePlanBlock,
  type PracticeReflection,
  drillLibrary,
} from "@/lib/mock/practice";
import { useCustomDrillsStore } from "@/lib/customDrillsStore";

type State = {
  plans: PracticePlan[];
  activePlanId: string | null;

  setActive: (id: string) => void;
  createPlan: (overrides?: Partial<PracticePlan>) => string;
  updatePlan: (id: string, patch: Partial<PracticePlan>) => void;
  deletePlan: (id: string) => void;
  duplicatePlan: (id: string) => string;

  /** Mark a practice as completed, persisting structured coach reflection. */
  completePlan: (id: string, reflection: PracticeReflection) => void;

  addBlock: (planId: string, drillId: string, atIndex?: number) => void;
  updateBlock: (planId: string, blockId: string, patch: Partial<PracticePlanBlock>) => void;
  removeBlock: (planId: string, blockId: string) => void;
  reorderBlocks: (planId: string, fromIndex: number, toIndex: number) => void;

  /** Replace local plans with server-fetched plans (server wins). */
  loadFromServer: (serverPlans: PracticePlan[]) => void;
  /** Swap a local nanoid plan ID for the server-assigned ID after a POST. */
  updatePlanId: (oldId: string, newId: string) => void;
};

export const usePracticePlans = create<State>()(
  persist(
    (set, get) => ({
      plans: seedPlans,
      activePlanId: seedPlans[0]?.id ?? null,

      setActive: (id) => set({ activePlanId: id }),

      createPlan: (overrides = {}) => {
        const now = new Date().toISOString();
        const id = `plan_${nanoid(6)}`;
        const newPlan: PracticePlan = {
          id,
          title: "Untitled Practice Plan",
          date: now.slice(0, 10),
          startTime: "16:00",
          budgetMin: 90,
          focus: "",
          authorId: "user_coach_1",
          authorName: "Coach Daniels",
          status: "DRAFT",
          blocks: [],
          createdAt: now,
          updatedAt: now,
          ...overrides,
        };
        set({ plans: [newPlan, ...get().plans], activePlanId: id });
        return id;
      },

      updatePlan: (id, patch) => {
        set({
          plans: get().plans.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
          ),
        });
      },

      deletePlan: (id) => {
        const next = get().plans.filter((p) => p.id !== id);
        set({
          plans: next,
          activePlanId: get().activePlanId === id ? next[0]?.id ?? null : get().activePlanId,
        });
      },

      duplicatePlan: (id) => {
        const src = get().plans.find((p) => p.id === id);
        if (!src) return id;
        const now = new Date().toISOString();
        const newId = `plan_${nanoid(6)}`;
        const copy: PracticePlan = {
          ...JSON.parse(JSON.stringify(src)),
          id: newId,
          title: `${src.title} (copy)`,
          status: "DRAFT",
          createdAt: now,
          updatedAt: now,
          blocks: src.blocks.map((b) => ({ ...b, id: `blk_${nanoid(5)}` })),
        };
        set({ plans: [copy, ...get().plans], activePlanId: newId });
        return newId;
      },

      completePlan: (id, reflection) => {
        set({
          plans: get().plans.map((p) =>
            p.id === id
              ? { ...p, status: "COMPLETED" as const, reflection, updatedAt: new Date().toISOString() }
              : p
          ),
        });
      },

      addBlock: (planId, drillId, atIndex) => {
        const globalDrill = drillLibrary.find((d) => d.id === drillId);
        const customDrill = !globalDrill
          ? useCustomDrillsStore.getState().byId(drillId)
          : undefined;
        const drill = globalDrill ?? customDrill;
        if (!drill) return;
        const block: PracticePlanBlock = {
          id: `blk_${nanoid(5)}`,
          drillId,
          durationMin: drill.defaultDurationMin,
          notes: "",
        };
        set({
          plans: get().plans.map((p) => {
            if (p.id !== planId) return p;
            const blocks = [...p.blocks];
            const insertAt = typeof atIndex === "number" ? atIndex : blocks.length;
            blocks.splice(insertAt, 0, block);
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        });
      },

      updateBlock: (planId, blockId, patch) => {
        set({
          plans: get().plans.map((p) =>
            p.id !== planId
              ? p
              : {
                  ...p,
                  blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
                  updatedAt: new Date().toISOString(),
                }
          ),
        });
      },

      removeBlock: (planId, blockId) => {
        set({
          plans: get().plans.map((p) =>
            p.id !== planId
              ? p
              : {
                  ...p,
                  blocks: p.blocks.filter((b) => b.id !== blockId),
                  updatedAt: new Date().toISOString(),
                }
          ),
        });
      },

      reorderBlocks: (planId, fromIndex, toIndex) => {
        set({
          plans: get().plans.map((p) => {
            if (p.id !== planId) return p;
            const blocks = [...p.blocks];
            const [moved] = blocks.splice(fromIndex, 1);
            blocks.splice(toIndex, 0, moved);
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        });
      },

      loadFromServer: (serverPlans) => {
        if (serverPlans.length === 0) return;
        const currentTitle = get().plans.find((p) => p.id === get().activePlanId)?.title;
        const active = serverPlans.find((p) => p.title === currentTitle) ?? serverPlans[0];
        set({ plans: serverPlans, activePlanId: active?.id ?? null });
      },

      updatePlanId: (oldId, newId) => {
        set({
          plans: get().plans.map((p) => (p.id === oldId ? { ...p, id: newId } : p)),
          activePlanId: get().activePlanId === oldId ? newId : get().activePlanId,
        });
      },
    }),
    {
      name: "hoopsiq-practice-plans",
      version: 1,
    }
  )
);
