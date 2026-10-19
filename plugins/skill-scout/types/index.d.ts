export type SkillIdeaKind = 'new' | 'edit'

export type SkillIdea = {
  kind: SkillIdeaKind
  name: string
  skill: string
  confidence: number
  why: string
  trigger: string
  steps: string[]
}

// What has already been suggested, with its reason, so a renamed repeat is still recognised.
export type SeenIdea = { key: string; why: string }

declare module 'claude-code' {
  interface PluginState {
    'skill-scout': { idea: SkillIdea | null }
  }
}
