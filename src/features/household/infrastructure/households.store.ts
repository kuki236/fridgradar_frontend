import { create } from "zustand";
import { householdApi, type Household } from "@/features/household/infrastructure/households.service";

interface HouseholdState {
  households: Household[];
  activeHousehold: Household | null;
  isLoading: boolean;

  loadHouseholds: () => Promise<void>;
  setActiveHousehold: (household: Household) => void;
  createHousehold: (name: string) => Promise<Household>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  activeHousehold: null,
  isLoading: false,

  loadHouseholds: async () => {
    set({ isLoading: true });
    try {
      const households = await householdApi.list();
      const activeId = localStorage.getItem("active_household_id");
      const active = households.find((h) => h.id === activeId) || households[0] || null;
      set({ households, activeHousehold: active, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveHousehold: (household: Household) => {
    localStorage.setItem("active_household_id", household.id);
    set({ activeHousehold: household });
  },

  createHousehold: async (name: string) => {
    const household = await householdApi.create({ name });
    const { households } = get();
    set({
      households: [...households, household],
      activeHousehold: household,
    });
    localStorage.setItem("active_household_id", household.id);
    return household;
  },
}));
