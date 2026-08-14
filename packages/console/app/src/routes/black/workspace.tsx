import { A, createAsync, query, useNavigate } from "@solidjs/router"
import "./workspace.css"
import { Title } from "@solidjs/meta"
import { github } from "~/lib/github"
import { createEffect, createMemo, For, onMount } from "solid-js"
import { config } from "~/config"
import { createList } from "solid-list"
import { useLanguage } from "~/context/language"
import { LanguagePicker } from "~/component/language-picker"
import { useI18n } from "~/context/i18n"
import { getActor } from "~/context/auth"
import { withActor } from "~/context/auth.withActor"
import { Actor } from "@poltter-ai/console-core/actor.js"
import { and, Database, eq, isNull } from "@poltter-ai/console-core/drizzle/index.js"
import { WorkspaceTable } from "@poltter-ai/console-core/schema/workspace.sql.js"
import { UserTable } from "@poltter-ai/console-core/schema/user.sql.js"
import { redirect } from "@solidjs/router"

const getUserWorkspaces = query(async () => {
  "use server"
  const actor = await getActor()
  if (actor.type === "public") throw redirect("/auth/authorize?continue=/black/workspace")
  return withActor(async () => {
    return Database.use((tx) =>
      tx
        .select({
          id: WorkspaceTable.id,
          name: WorkspaceTable.name,
          slug: WorkspaceTable.slug,
        })
        .from(UserTable)
        .innerJoin(WorkspaceTable, eq(UserTable.workspaceID, WorkspaceTable.id))
        .where(
          and(
            eq(UserTable.accountID, Actor.account()),
            isNull(UserTable.timeDeleted),
            isNull(WorkspaceTable.timeDeleted),
          ),
        ),
    )
  })
}, "black.workspace.workspaces")

export default function BlackWorkspace() {
  const navigate = useNavigate()
  const language = useLanguage()
  const i18n = useI18n()
  const githubData = createAsync(() => github())
  const starCount = createMemo(() =>
    githubData()?.stars
      ? new Intl.NumberFormat(language.tag(language.locale()), {
          notation: "compact",
          compactDisplay: "short",
        }).format(githubData()!.stars!)
      : config.github.starsFormatted.compact,
  )

  const workspaces = createAsync(() => getUserWorkspaces())

  let listRef: HTMLUListElement | undefined

  const { active, setActive, onKeyDown } = createList({
    items: () => workspaces()?.map((w) => w.id) ?? [],
    initialActive: workspaces()?.[0]?.id ?? null,
    handleTab: true,
  })

  onMount(() => {
    listRef?.focus()
  })

  createEffect(() => {
    const id = active()
    if (!id || !listRef) return
    const el = listRef.querySelector(`[data-id="${id}"]`)
    el?.scrollIntoView({ block: "nearest" })
  })

  return (
    <div data-page="black">
      <Title>{i18n.t("black.workspace.title")}</Title>
      <div data-component="header-gradient" />
      <header data-component="header">
        <div data-component="header-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="179" height="32" viewBox="0 0 179 32" fill="none">
            <g clip-path="url(#clip0_3654_210259)">
              <mask
                id="mask0_3654_210259"
                style="mask-type:luminance"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="179"
                height="32"
              >
                <path d="M178.286 0H0V32H178.286V0Z" fill="white" />
              </mask>
              <g mask="url(#mask0_3654_210259)">
                <path d="M13.7132 22.8577H4.57031V13.7148H13.7132V22.8577Z" fill="#444444" />
                <path
                  d="M13.7143 9.14174H4.57143V22.856H13.7143V9.14174ZM18.2857 27.4275H0V4.57031H18.2857V27.4275Z"
                  fill="#CDCDCD"
                />
                <path d="M36.5725 22.8577H27.4297V13.7148H36.5725V22.8577Z" fill="#444444" />
                <path
                  d="M27.4308 22.856H36.5737V9.14174H27.4308V22.856ZM41.1451 27.4275H27.4308V31.9989H22.8594V4.57031H41.1451V27.4275Z"
                  fill="#CDCDCD"
                />
                <path d="M64.0033 18.2852V22.8566H50.2891V18.2852H64.0033Z" fill="#444444" />
                <path
                  d="M63.9967 18.2846H50.2824V22.856H63.9967V27.4275H45.7109V4.57031H63.9967V18.2846ZM50.2824 13.7132H59.4252V9.14174H50.2824V13.7132Z"
                  fill="#CDCDCD"
                />
                <path d="M82.2835 27.4291H73.1406V13.7148H82.2835V27.4291Z" fill="#444444" />
                <path
                  d="M82.2846 9.14174H73.1417V27.4275H68.5703V4.57031H82.2846V9.14174ZM86.856 27.4275H82.2846V9.14174H86.856V27.4275Z"
                  fill="#CDCDCD"
                />
                <path d="M109.714 22.8577H96V13.7148H109.714V22.8577Z" fill="#444444" />
                <path
                  d="M109.715 9.14174H96.0011V22.856H109.715V27.4275H91.4297V4.57031H109.715V9.14174Z"
                  fill="white"
                />
                <path d="M128.002 22.8577H118.859V13.7148H128.002V22.8577Z" fill="#444444" />
                <path
                  d="M128.003 9.14174H118.86V22.856H128.003V9.14174ZM132.575 27.4275H114.289V4.57031H132.575V27.4275Z"
                  fill="white"
                />
                <path d="M150.854 22.8577H141.711V13.7148H150.854V22.8577Z" fill="#444444" />
                <path
                  d="M150.855 9.14286H141.712V22.8571H150.855V9.14286ZM155.426 27.4286H137.141V4.57143H150.855V0H155.426V27.4286Z"
                  fill="white"
                />
                <path d="M178.285 18.2852V22.8566H164.57V18.2852H178.285Z" fill="#444444" />
                <path
                  d="M164.571 9.14174V13.7132H173.714V9.14174H164.571ZM178.286 18.2846H164.571V22.856H178.286V27.4275H160V4.57031H178.286V18.2846Z"
                  fill="white"
                />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_3654_210259">
                <rect width="178.286" height="32" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </header>
      <main data-component="content">
        <div data-slot="hero-black">
          <svg width="900" height="136" viewBox="0 0 900 136" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask
              id="path-1-outside-1_3654_210047"
              maskUnits="userSpaceOnUse"
              x="14"
              y="0"
              width="885"
              height="134"
              fill="black"
            >
              <rect fill="white" x="14" width="885" height="134" />
              <path d="M16.0158 4.36H58.6758C69.4758 4.36 77.9358 7.3 84.0558 13.18C90.1758 19.06 93.2358 26.92 93.2358 36.76C93.2358 44.32 91.3758 50.26 87.6558 54.58C84.0558 58.9 79.3758 61.96 73.6158 63.76V64.3C80.6958 65.98 86.5158 69.16 91.0758 73.84C95.6358 78.4 97.9158 85.06 97.9158 93.82C97.9158 98.86 97.0758 103.6 95.3958 108.04C93.7158 112.48 91.3158 116.32 88.1958 119.56C85.1958 122.8 81.5958 125.38 77.3958 127.3C73.3158 129.1 68.8758 130 64.0758 130H16.0158V4.36ZM59.5758 116.86C66.5358 116.86 71.9958 115.3 75.9558 112.18C79.9158 109.06 81.8958 104.26 81.8958 97.78V90.4C81.8958 84.04 79.9158 79.3 75.9558 76.18C71.9958 72.94 66.5358 71.32 59.5758 71.32H31.1358V116.86H59.5758ZM57.0558 58.9C63.4158 58.9 68.3958 57.52 71.9958 54.76C75.5958 51.88 77.3958 47.56 77.3958 41.8V34.78C77.3958 29.02 75.5958 24.7 71.9958 21.82C68.3958 18.94 63.4158 17.5 57.0558 17.5H31.1358V58.9H57.0558Z" fill="url(#paint0_linear_3654_210047)" fill-opacity="0.1"/>
              <path d="M16.0158 4.36H58.6758C69.4758 4.36 77.9358 7.3 84.0558 13.18C90.1758 19.06 93.2358 26.92 93.2358 36.76C93.2358 44.32 91.3758 50.26 87.6558 54.58C84.0558 58.9 79.3758 61.96 73.6158 63.76V64.3C80.6958 65.98 86.5158 69.16 91.0758 73.84C95.6358 78.4 97.9158 85.06 97.9158 93.82C97.9158 98.86 97.0758 103.6 95.3958 108.04C93.7158 112.48 91.3158 116.32 88.1958 119.56C85.1958 122.8 81.5958 125.38 77.3958 127.3C73.3158 129.1 68.8758 130 64.0758 130H16.0158V4.36ZM59.5758 116.86C66.5358 116.86 71.9958 115.3 75.9558 112.18C79.9158 109.06 81.8958 104.26 81.8958 97.78V90.4C81.8958 84.04 79.9158 79.3 75.9558 76.18C71.9958 72.94 66.5358 71.32 59.5758 71.32H31.1358V116.86H59.5758ZM57.0558 58.9C63.4158 58.9 68.3958 57.52 71.9958 54.76C75.5958 51.88 77.3958 47.56 77.3958 41.8V34.78C77.3958 29.02 75.5958 24.7 71.9958 21.82C68.3958 18.94 63.4158 17.5 57.0558 17.5H31.1358V58.9H57.0558Z" fill="url(#paint1_linear_3654_210047)" mask="url(#path-1-outside-1_3654_210047)"/>
              <defs>
                <linearGradient id="paint0_linear_3654_210047" x1="450" y1="1.8125" x2="450" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stop-color="white" />
                  <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="paint1_linear_3654_210047" x1="450" y1="2.5" x2="450" y2="130" gradientUnits="userSpaceOnUse">
                  <stop stop-color="white" stop-opacity="0.6" />
                  <stop offset="1" stop-color="white" stop-opacity="0" />
                </linearGradient>
              </defs>
            </mask>
            <path d="M16.0158 4.36H58.6758C69.4758 4.36 77.9358 7.3 84.0558 13.18C90.1758 19.06 93.2358 26.92 93.2358 36.76C93.2358 44.32 91.3758 50.26 87.6558 54.58C84.0558 58.9 79.3758 61.96 73.6158 63.76V64.3C80.6958 65.98 86.5158 69.16 91.0758 73.84C95.6358 78.4 97.9158 85.06 97.9158 93.82C97.9158 98.86 97.0758 103.6 95.3958 108.04C93.7158 112.48 91.3158 116.32 88.1958 119.56C85.1958 122.8 81.5958 125.38 77.3958 127.3C73.3158 129.1 68.8758 130 64.0758 130H16.0158V4.36ZM59.5758 116.86C66.5358 116.86 71.9958 115.3 75.9558 112.18C79.9158 109.06 81.8958 104.26 81.8958 97.78V90.4C81.8958 84.04 79.9158 79.3 75.9558 76.18C71.9958 72.94 66.5358 71.32 59.5758 71.32H31.1358V116.86H59.5758ZM57.0558 58.9C63.4158 58.9 68.3958 57.52 71.9958 54.76C75.5958 51.88 77.3958 47.56 77.3958 41.8V34.78C77.3958 29.02 75.5958 24.7 71.9958 21.82C68.3958 18.94 63.4158 17.5 57.0558 17.5H31.1358V58.9H57.0558ZM219.705 130V4.36H234.825V116.86H294.405V130H219.705ZM482.615 130L471.995 94.18H427.895L417.275 130H401.615L440.135 4.36H460.115L498.635 130H482.615ZM450.755 20.38H449.135L431.495 81.04H468.395L450.755 20.38ZM652.105 132.16C636.745 132.16 625.285 126.58 617.725 115.42C610.285 104.26 606.565 88.18 606.565 67.18C606.565 46.18 610.285 30.1 617.725 18.94C625.285 7.77999 636.745 2.19999 652.105 2.19999C657.865 2.19999 662.845 2.97999 667.045 4.54C671.245 6.1 674.845 8.19999 677.845 10.84C680.845 13.48 683.365 16.48 685.405 19.84C687.445 23.08 689.245 26.38 690.805 29.74L677.845 35.68C676.765 32.92 675.505 30.34 674.065 27.94C672.625 25.42 670.885 23.26 668.845 21.46C666.925 19.54 664.585 18.04 661.825 16.96C659.185 15.88 655.945 15.34 652.105 15.34C642.145 15.34 634.705 19.12 629.785 26.68C624.985 34.24 622.585 44.32 622.585 56.92V77.44C622.585 90.04 624.985 100.12 629.785 107.68C634.705 115.24 642.145 119.02 652.105 119.02C655.945 119.02 659.185 118.48 661.825 117.4C664.585 116.32 666.925 114.88 668.845 113.08C670.885 111.16 672.625 109 674.065 106.6C675.505 104.08 676.765 101.44 677.845 98.68L690.805 104.5C689.125 108.26 686.725 111.62 683.605 114.58C680.485 117.54 676.885 119.86 672.805 121.54C668.725 123.22 664.285 124.24 659.485 124.6C666.565 123.84 672.725 120.86 677.965 115.66C683.205 110.46 686.445 103.66 687.685 95.26L690.805 95.26C688.965 107.3 682.565 117.26 671.605 125.14C660.645 133.02 646.905 137.24 630.385 137.8L628.505 137.8C635.345 137.8 641.905 137.02 648.185 135.46V132.16H652.105ZM652.105 132.16V137.8H649.465C642.625 137.8 635.865 137.2 629.185 135.98L630.385 137.8C637.225 137.8 643.985 137.02 650.665 135.46V132.16H652.105ZM690.805 104.5L677.845 98.68C676.765 101.44 675.505 104.08 674.065 106.6C672.625 109 670.885 111.16 668.845 113.08C666.925 114.88 664.585 116.32 661.825 117.4C659.185 118.48 655.945 119.02 652.105 119.02C642.145 119.02 634.705 115.24 629.785 107.68C624.985 100.12 622.585 90.04 622.585 77.44V56.92C622.585 44.32 624.985 34.24 629.785 26.68C634.705 19.12 642.145 15.34 652.105 15.34C655.945 15.34 659.185 15.88 661.825 16.96C664.585 18.04 666.925 19.54 668.845 21.46C670.885 23.26 672.625 25.42 674.065 27.94C675.505 30.34 676.765 32.92 677.845 35.68L690.805 29.74C689.245 26.38 687.445 23.08 685.405 19.84C683.365 16.48 680.845 13.48 677.845 10.84C674.845 8.19999 671.245 6.1 667.045 4.54C662.845 2.97999 657.865 2.19999 652.105 2.19999C636.745 2.19999 625.285 7.77999 617.725 18.94C610.285 30.1 606.565 46.18 606.565 67.18C606.565 88.18 610.285 104.26 617.725 115.42C625.285 126.58 636.745 132.16 652.105 132.16H690.805ZM219.705 130V131.5H218.205V130H219.705ZM294.405 130V4.36H295.905V130H294.405ZM482.615 130L471.995 94.18H427.895L417.275 130H401.615L440.135 4.36H460.115L498.635 130H482.615ZM473.835 131.5L482.615 130L498.635 131.5L460.115 5.86H440.135L401.615 131.5H417.275L427.895 95.68H468.395L473.835 131.5ZM449.135 21.88L466.775 82.54H429.875L449.135 21.88ZM449.135 21.88H450.755L431.495 81.04H433.115L449.135 21.88Z" fill="url(#paint2_linear_3654_210047)" fill-opacity="0.1" mask="url(#path-1-outside-1_3654_210047)"/>
            <defs>
              <linearGradient id="paint2_linear_3654_210047" x1="450" y1="1.8125" x2="450" y2="130" gradientUnits="userSpaceOnUse">
                <stop stop-color="white" />
                <stop offset="1" stop-color="white" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <section data-slot="select-workspace">
          <p data-slot="select-workspace-title">{i18n.t("black.workspace.selectPlan")}</p>
          <ul
            ref={listRef}
            data-slot="workspaces"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" && active()) {
                navigate(`/black/workspace/${active()}`)
              } else if (e.key === "Tab") {
                e.preventDefault()
                onKeyDown(e)
              } else {
                onKeyDown(e)
              }
            }}
          >
            <For each={workspaces() ?? []}>
              {(workspace) => (
                <li
                  data-slot="workspace"
                  data-id={workspace.id}
                  data-active={active() === workspace.id}
                  onMouseEnter={() => setActive(workspace.id)}
                  onClick={() => navigate(`/black/workspace/${workspace.id}`)}
                >
                  <span data-slot="selected-icon">[*]</span>
                  <a href={`/black/workspace/${workspace.id}`}>{workspace.name || workspace.slug}</a>
                </li>
              )}
            </For>
          </ul>
        </section>
      </main>
      <footer data-component="footer">
        <div data-slot="footer-content">
          <span data-slot="anomaly">
            ©{new Date().getFullYear()} <a href="https://anoma.ly">Anomaly</a>
          </span>
          <a href={config.github.repoUrl} target="_blank">
            {i18n.t("nav.github")} <span data-slot="github-stars">[{starCount()}]</span>
          </a>
          <a href={language.route("/docs")}>{i18n.t("nav.docs")}</a>
          <LanguagePicker align="right" />
          <span>
            <A href={language.route("/legal/privacy-policy")}>{i18n.t("legal.privacy")}</A>
          </span>
          <span>
            <A href={language.route("/legal/terms-of-service")}>{i18n.t("legal.terms")}</A>
          </span>
        </div>
        <span data-slot="anomaly-alt">
          ©{new Date().getFullYear()} <a href="https://anoma.ly">Anomaly</a>
        </span>
      </footer>
    </div>
  )
}
