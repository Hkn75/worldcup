export interface ThirdPlaceScenario {
  // Array of 8 group names that qualified as best 3rd, e.g., ["A", "B", "C", "D", "E", "F", "G", "H"]
  // Sorted alphabetically to allow easy lookup.
  qualifiedThirdGroups: string[];
  // Mapping from the Group Winner name (A, B, D, E, G, I, K, L) to the 3rd place Group Name
  mapping: Record<string, string>;
}

export const thirdPlaceScenarios: ThirdPlaceScenario[] = [
  {
    // Standard Scenario 1: Groups A to H qualify
    qualifiedThirdGroups: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    mapping: {
      E: 'A',
      I: 'C',
      A: 'F',
      L: 'H',
      G: 'E',
      D: 'B',
      B: 'G',
      K: 'D'
    }
  },
  {
    // Standard Scenario 2: Groups A to F, plus I and J
    qualifiedThirdGroups: ['A', 'B', 'C', 'D', 'E', 'F', 'I', 'J'],
    mapping: {
      E: 'A',
      I: 'C',
      A: 'F',
      L: 'I',
      G: 'E',
      D: 'B',
      B: 'J',
      K: 'D'
    }
  },
  {
    // Standard Scenario 3: Groups C to J
    qualifiedThirdGroups: ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    mapping: {
      E: 'C',
      I: 'D',
      A: 'F',
      L: 'H',
      G: 'E',
      D: 'I',
      B: 'G',
      K: 'J'
    }
  },
  {
    // Standard Scenario 4: Groups E to L
    qualifiedThirdGroups: ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    mapping: {
      E: 'F',
      I: 'H',
      A: 'E',
      L: 'I',
      G: 'J',
      D: 'F', // Note: D plays 3rd B/E/F/I/J
      B: 'G',
      K: 'K'  // Note: K plays 3rd D/E/I/J/L
    }
  },
  {
    // Standard Scenario 5: Groups A, C, D, F, H, I, J, K
    qualifiedThirdGroups: ['A', 'C', 'D', 'F', 'H', 'I', 'J', 'K'],
    mapping: {
      E: 'A',
      I: 'C',
      A: 'F',
      L: 'H',
      G: 'I',
      D: 'J',
      B: 'K',
      K: 'D'
    }
  }
];

/**
 * Finds the third-place mapping for a given set of qualified groups.
 * If the scenario is not pre-defined, it resolves it dynamically using a backtracking constraint solver.
 * @param qualifiedGroups Array of 8 group names, e.g., ["B", "A", "C", ...]
 * @returns The mapping or null if no valid assignment is possible.
 */
export const findThirdPlaceMapping = (qualifiedGroups: string[]): Record<string, string> | null => {
  if (qualifiedGroups.length !== 8) return null;
  const targetGroups = [...qualifiedGroups].map(g => g.toUpperCase()).sort();
  
  for (const scenario of thirdPlaceScenarios) {
    const sortedScenario = [...scenario.qualifiedThirdGroups].map(g => g.toUpperCase()).sort();
    if (JSON.stringify(targetGroups) === JSON.stringify(sortedScenario)) {
      return scenario.mapping;
    }
  }

  // Fallback: Dynamic Constraint Solver (Backtracking DFS)
  const slots = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K'];
  const allowedPools: Record<string, string[]> = {
    E: ['A', 'B', 'C', 'D', 'F'],
    I: ['C', 'D', 'F', 'G', 'H'],
    A: ['C', 'E', 'F', 'H', 'I'],
    L: ['E', 'H', 'I', 'J', 'K'],
    D: ['B', 'E', 'F', 'I', 'J'],
    G: ['A', 'E', 'H', 'I', 'J'],
    B: ['E', 'F', 'G', 'I', 'J'],
    K: ['D', 'E', 'I', 'J', 'L']
  };

  const result: Record<string, string> = {};
  const used = new Set<string>();

  const backtrack = (slotIndex: number): boolean => {
    if (slotIndex === slots.length) return true;
    const slot = slots[slotIndex];
    const allowed = allowedPools[slot];

    for (const group of targetGroups) {
      if (!used.has(group) && allowed.includes(group)) {
        used.add(group);
        result[slot] = group;
        if (backtrack(slotIndex + 1)) {
          return true;
        }
        used.delete(group);
        delete result[slot];
      }
    }
    return false;
  };

  if (backtrack(0)) {
    return result;
  }

  return null;
};
