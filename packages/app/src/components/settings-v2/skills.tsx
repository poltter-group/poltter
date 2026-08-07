import { type Component, For, createSignal, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { SettingsListV2 } from "./parts/list"
import { Switch } from "@poltter-ai/ui/switch"
import { ButtonV2 } from "@poltter-ai/ui/v2/button-v2"
import { TextInputV2 } from "@poltter-ai/ui/v2/text-input-v2"
import { TextareaV2 } from "@poltter-ai/ui/v2/textarea-v2"
import { Icon } from "@poltter-ai/ui/icon"
import "./settings-v2.css"

interface SkillSetting {
  name: string
  description: string
  enabled: boolean
}

const defaultSkills: SkillSetting[] = [
  {
    name: "bug-bounty",
    description: "Bug bounty workflow — recon, vulnerability hunting, reporting",
    enabled: true,
  },
  {
    name: "web2-recon",
    description: "Web2 recon pipeline — subdomain enumeration, asset discovery",
    enabled: true,
  },
  {
    name: "web2-vuln-classes",
    description: "Complete reference for 20 web2 bug classes",
    enabled: true,
  },
  {
    name: "security-arsenal",
    description: "Security payloads, bypass tables, wordlists",
    enabled: true,
  },
  {
    name: "triage-validation",
    description: "Finding validation before writing any report",
    enabled: true,
  },
  {
    name: "report-writing",
    description: "Bug bounty report writing for H1/Bugcrowd/Intigriti/Immunefi",
    enabled: true,
  },
  {
    name: "web3-audit",
    description: "Smart contract security audit — 10 DeFi bug classes",
    enabled: true,
  },
  {
    name: "meme-coin-audit",
    description: "Meme coin and token security audit — rug pull detection",
    enabled: true,
  },
  {
    name: "bb-methodology",
    description: "Master orchestrator for bug bounty hunting sessions",
    enabled: true,
  },
]

export const SettingsSkillsV2: Component = () => {
  const language = useLanguage()
  const [skills, setSkills] = createSignal(defaultSkills)
  const [creating, setCreating] = createSignal(false)
  const [newName, setNewName] = createSignal("")
  const [newDescription, setNewDescription] = createSignal("")

  const enabledCount = () => skills().filter((s) => s.enabled).length

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

  const createSkill = () => {
    const name = slugify(newName())
    if (!name) return
    setSkills((prev) => [
      ...prev,
      { name, description: newDescription().trim() || name, enabled: true },
    ])
    setNewName("")
    setNewDescription("")
    setCreating(false)
  }

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <>
      <div class="settings-v2-tab-header settings-v2-skills-header">
        <div class="settings-v2-tab-header-row">
          <div>
            <h2 class="settings-v2-tab-title">{language.t("settings.skills.title")}</h2>
            <p class="settings-v2-tab-description">
              {enabledCount()} of {skills().length} skills enabled
            </p>
          </div>
          <ButtonV2
            size="normal"
            variant="contrast"
            onClick={() => setCreating((v) => !v)}
          >
            <Icon name="plus" />
            {language.t("settings.skills.create")}
          </ButtonV2>
        </div>

        <Show when={creating()}>
          <div class="settings-v2-skills-form">
            <div class="settings-v2-skills-form-field">
              <span class="settings-v2-skills-form-label">{language.t("settings.skills.form.name")}</span>
              <TextInputV2
                type="text"
                appearance="base"
                value={newName()}
                onInput={(e) => setNewName(e.currentTarget.value)}
                placeholder="my-custom-skill"
                spellcheck={false}
                autocorrect="off"
                autocomplete="off"
                autocapitalize="off"
              />
            </div>
            <div class="settings-v2-skills-form-field">
              <span class="settings-v2-skills-form-label">{language.t("settings.skills.form.description")}</span>
              <TextareaV2
                value={newDescription()}
                onInput={(e) => setNewDescription(e.currentTarget.value)}
                placeholder={language.t("settings.skills.form.descriptionPlaceholder")}
                rows={2}
              />
            </div>
            <div class="settings-v2-skills-form-actions">
              <ButtonV2 size="small" variant="ghost" onClick={() => setCreating(false)}>
                {language.t("common.cancel")}
              </ButtonV2>
              <ButtonV2 size="small" variant="contrast" disabled={!slugify(newName())} onClick={createSkill}>
                {language.t("settings.skills.form.create")}
              </ButtonV2>
            </div>
          </div>
        </Show>
      </div>

      <div class="settings-v2-tab-body settings-v2-skills">
        <SettingsListV2>
          <For each={skills()}>
            {(skill, i) => (
              <div class="settings-v2-servers-row">
                <div class="settings-v2-servers-lead">
                  <Icon name="shield" />
                  <div class="settings-v2-servers-copy">
                    <span class="settings-v2-servers-name">{skill.name}</span>
                    <span class="settings-v2-servers-meta">{skill.description}</span>
                  </div>
                </div>
                <div class="settings-v2-servers-actions">
                  <ButtonV2
                    size="small"
                    variant="ghost"
                    aria-label={language.t("settings.skills.remove")}
                    onClick={() => removeSkill(i())}
                  >
                    <Icon name="trash" />
                  </ButtonV2>
                  <Switch
                    checked={skill.enabled}
                    onChange={() => {
                      setSkills((prev) =>
                        prev.map((s, idx) => (idx === i() ? { ...s, enabled: !s.enabled } : s)),
                      )
                    }}
                  />
                </div>
              </div>
            )}
          </For>
        </SettingsListV2>
      </div>
    </>
  )
}
