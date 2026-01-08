/**
 * Pre-configured Playoff Scenarios
 * 
 * Provides ready-to-use scenarios for development and testing.
 */

import { 
  generatePlayoffPod, 
  generateMultiplePods,
  type PlayoffPod, 
  type ScenarioType,
  SCENARIO_DESCRIPTIONS,
  ALL_SCENARIOS,
} from './playoffTeams';

// ============================================================================
// PRE-CONFIGURED SCENARIOS
// ============================================================================

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  scenario: ScenarioType;
  week: 15 | 16 | 17;
  podCount: number;
}

export const PRECONFIGURED_SCENARIOS: ScenarioConfig[] = [
  {
    id: 'week15-default',
    name: 'Week 15 - Standard',
    description: 'Standard Week 15 playoff pod',
    scenario: 'default',
    week: 15,
    podCount: 1,
  },
  {
    id: 'week15-close',
    name: 'Week 15 - Close Race',
    description: 'Competitive Week 15 with tight standings',
    scenario: 'close_race',
    week: 15,
    podCount: 1,
  },
  {
    id: 'week16-bubble',
    name: 'Week 16 - On the Bubble',
    description: 'User team fighting for advancement spot',
    scenario: 'on_the_bubble',
    week: 16,
    podCount: 1,
  },
  {
    id: 'week17-locked',
    name: 'Week 17 - Locked In',
    description: 'User team has commanding lead',
    scenario: 'locked_in',
    week: 17,
    podCount: 1,
  },
  {
    id: 'multi-pod-mixed',
    name: 'Multiple Pods - Mixed',
    description: 'User has 3 teams in different pods',
    scenario: 'mixed',
    week: 15,
    podCount: 3,
  },
  {
    id: 'stress-test',
    name: 'Stress Test - 10 Pods',
    description: 'Performance testing with many pods',
    scenario: 'default',
    week: 15,
    podCount: 10,
  },
];

// ============================================================================
// SCENARIO GENERATOR
// ============================================================================

export function getScenarioPods(config: ScenarioConfig): PlayoffPod[] {
  if (config.podCount === 1) {
    return [generatePlayoffPod(config.scenario, config.week)];
  }
  return generateMultiplePods(config.podCount, config.scenario, config.week);
}

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return PRECONFIGURED_SCENARIOS.find(s => s.id === id);
}

// Re-export for convenience
export { 
  generatePlayoffPod, 
  generateMultiplePods,
  SCENARIO_DESCRIPTIONS,
  ALL_SCENARIOS,
  type PlayoffPod,
  type ScenarioType,
};

