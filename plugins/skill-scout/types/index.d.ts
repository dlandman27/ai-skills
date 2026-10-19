export type SkillIdeaKind = 'new' | 'edit'

export type SkillIdea = {
  kind: SkillIdeaKind
  name: string
  skill: string
  confidence: number
  why: string
  trigger: string
  steps: string[]
  // The moments in the conversation that show the need, and how many times it happened.
  evidence: string[]
  occurrences: number
}

// What became of an idea: still waiting, drafted, called not useful, or kept quietly below the cutoff.
export type IdeaOutcome = 'pending' | 'drafted' | 'rejected' | 'quiet'

export type ScoutedIdea = SkillIdea & { id: string; outcome: IdeaOutcome }

// What has already been suggested, with its reason, so a renamed repeat is still recognised.
export type SeenIdea = { key: string; why: string }

declare module 'claude-code' {
  interface PluginState {
    'skill-scout': { idea: ScoutedIdea | null }
  }
}
