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
- Standings with multiple groups use a shared fixed column layout so columns align.
- Buttons and filters must have visible active, hover, focus, loading, and disabled states.
- Text must not overflow buttons, cards, tabs, or match rows.
- Use icons where helpful for calendar, trophy, search, chevron, star/favorite, refresh, and status.
- Match detail timeline appears directly below the score header.

## Routes

- `/` redirects to `/fixtures`.
- `/fixtures` combined match schedule and results page.
- `/fixtures/:date` legacy route redirects to `/fixtures`.
- `/match/:leagueSlug/:eventId` match detail.
- `/standings/:leagueSlug` league standings.
- `/teams/:leagueSlug` team list.
- `/team/:leagueSlug/:teamId` team detail.
- Team and standings routes must not show raw unsupported slugs as league names; unsupported route leagues should replace to a supported fallback in the same country/confederation when possible.
- League display labels should use curated or humanized names when ESPN catalog only provides a slug.

Navigation should remain minimal: Fixtures, Results, Standings, Leagues.

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
