# UI Rules

## Design Direction

Use `template/template-giaodien.png` as the design baseline.

Visual personality:

- Simple, professional, sports-focused, fast to scan.
- Dark navy app shell with strong contrast.
- Coral/red-orange active and primary highlights.
- Amber/yellow for times, filters, and live indicators.
- Muted blue-gray metadata.
- Subtle thin borders.
- Compact cards and controls.

Suggested palette:

- Page background: `#08131d`
- Surface: `#101f31`
- Elevated surface: `#13263b`
- Border: `#263f5c`
- Primary text: `#f8fafc`
- Secondary text: `#9fb2cc`
- Muted text: `#63809f`
- Primary accent: `#ff6148`
- Amber accent: `#ffb31a`
- Success/live: `#22c55e`
- Danger/loss: `#ef4444`

## Components

- Mobile-first responsive design.
- Avoid marketing landing-page layout; first screen should be the usable match schedule/results experience.
- Keep page sections full-width or naturally constrained.
- Do not place cards inside cards.
- Use compact match rows/cards with stable heights, crests, kickoff/status, names, scores, and clear tap targets.
- Match rows must be responsive on narrow viewports; meta/status/score must not overlap or squeeze team names beyond truncation.
- Standings with multiple groups use a shared fixed column layout so columns align.
- Standings on mobile must show rank, team, played, wins, draws, losses, goal difference, and points in one viewport without relying on horizontal scrolling.
- Standings league selector belongs in the standings control header, not the page title header.
- Standings season navigation uses compact left/right arrow buttons; the right arrow must be disabled on the current/latest season.
- Buttons and filters must have visible active, hover, focus, loading, and disabled states.
- Text must not overflow buttons, cards, tabs, or match rows.
- Use icons where helpful for calendar, trophy, search, chevron, star/favorite, refresh, and status.
- Match detail uses internal segmented tabs in this order: timeline, team stats, player match stats, then `Thông tin Khác`; do not add new navbar items for Phase 4 stats.
- Match detail stat tables should stay compact on mobile, keep stat-name columns readable/responsive, and show concise empty states when data is unavailable.
- Match detail player-stat tables must render cells from the column label/key list, not directly from each player's sparse stat array, so leader fallback values do not shift into the wrong columns.
- Match detail player tab may show compact `Đội hình & thay người` content from summary rosters/commentary below player stats; keep it optional when ESPN omits lineup data.
- Team Detail roster players may deep-link to hidden player season stats pages.
- Team schedule empty states must not appear while schedule requests are still fetching; show a loading/updating message until requests settle.

## Routes

- `/` redirects to `/fixtures`.
- `/fixtures` combined match schedule and results page.
- `/fixtures/:date` legacy route redirects to `/fixtures`.
- `/live` current live scores page.
- `/match/:leagueSlug/:eventId` match detail.
- `/standings/:leagueSlug` league standings.
- `/teams/:leagueSlug` team list.
- `/team/:leagueSlug/:teamId` team detail.
- `/team/:leagueSlug/:teamId/player/:playerId` hidden player season stats route opened from Team Detail roster only.
- Match detail should replace mismatched route league slugs with ESPN's canonical summary league slug without showing an extra warning.
- Team and standings routes must not show raw unsupported slugs as league names; unsupported route leagues should replace to a supported fallback in the same country/confederation when possible.
- League display labels should use curated or humanized names when ESPN catalog only provides a slug.
- League labels must not show rough slug-derived names like `German 1` when a curated or common name is known; use labels such as `Bundesliga`.
- League labels must keep meaningful suffixes after a country prefix, for example `German 2. Bundesliga` should display as `2. Bundesliga`, not `2.`.
- Match detail league labels should prefer a clear full competition name, such as `Saudi Pro League`, over short fallback labels such as `KSA 1`.
- User-visible picker/card league labels should use the normalized `shortName` first, with normalized full `name` only as a fallback when `shortName` is missing.
- Standings and Teams selectors should list favorite leagues, while preserving valid deep-link route leagues even when the route league is not currently a favorite.
- League picker groups should be collapsible by country/continent/world; search results should auto-expand matching groups.
- League picker on mobile must use a near full-screen, `dvh`-based modal layout when search is available; avoid bottom-sheet positioning that can be pushed below the viewport by the mobile keyboard.
- League picker header/search must remain visible while the result list scrolls independently.
- League picker search must show the current matching result count when the list is filtered.
- League picker should prefer enriched ESPN detail `shortName` labels such as `EFL Championship` and `Italian Serie B` over slug-derived fallbacks like `English 2` or `Italian 2`.
- League picker chips and badges must not render weak ESPN abbreviations such as `2.` when a clearer normalized label like `2. Bundesliga` is available.
- League picker groups should sort competitions by natural league order, such as `eng.1`, then `eng.2`, then domestic cups, instead of pure alphabetic order.
- Livescore page should show live count, last updated time, manual refresh, compact filter chips, and league-grouped match rows.
- Livescore match rows should show ESPN live status/minute text instead of kickoff time.

Navigation should remain minimal: Fixtures/Results, Live, Standings, Teams.

Install UI:

- Do not add a navbar item for installing the app.
- Show a compact `Cài app` action only when the browser can install the app or when iOS needs an Add to Home Screen hint.
- Keep install prompts contextual, dismissible, and secondary to match browsing.

## Accessibility

- Use semantic buttons, links, headings, lists, and tables.
- Match cards that navigate must be keyboard accessible.
- Match rows and match detail headers should show important match tags such as `Tứ kết`, `Bán kết`, or `Chung kết` when available.
- FT-Pens matches should show the penalty shootout score as a compact `Pen: x - y` line when ESPN provides or implies the total shootout score.
- Icon-only buttons need accessible labels.
- Do not rely on color alone for live, finished, postponed, or selected states.
- Maintain readable contrast on the dark theme.
- All interactive elements must have accessible focus styles.

## Localization

Default visible copy should be Vietnamese.

User-facing copy must not expose the provider name `ESPN`; use `Chúng tôi` or neutral wording in loading, empty, and error states.

Preferred terms:

- Fixtures: `Lịch thi đấu`
- Results: `Kết quả`
- Standings: `Bảng xếp hạng`
- Upcoming: `Sắp tới`
- Live: `Đang đá`
- Finished: `Kết thúc`
- Postponed: `Hoãn`
- Cancelled: `Hủy`
- Today: `Hôm nay`
- Tomorrow: `Ngày mai`
- Yesterday: `Hôm qua`

Keep internal code names in English.
