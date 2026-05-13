import { mount, RouterLinkStub } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MatchDetailPage from './MatchDetailPage.vue';

const routerMock = vi.hoisted(() => ({
  route: {
    query: {} as Record<string, string>
  },
  replace: vi.fn()
}));

const matchMock = vi.hoisted(() => ({
  value: {
    id: '748480',
    leagueSlug: 'esp.1',
    leagueName: 'Spanish LALIGA',
    leagueShortName: undefined as string | undefined,
    kickoff: '2026-05-02T19:00Z',
    status: 'finished',
    statusText: 'FT',
    homeTeam: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
    awayTeam: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
    homeScore: 1,
    awayScore: 2,
    penaltyShootout: { home: 4, away: 5 },
    importanceLabel: 'Chung kết',
    broadcasts: [] as string[],
    notes: [] as string[],
    attendance: 12000,
    teamStats: [
      {
        team: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
        stats: [{ key: 'possessionpct', label: 'Possession %', displayValue: '42%' }]
      },
      {
        team: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
        stats: [{ key: 'possessionpct', label: 'Possession %', displayValue: '58%' }]
      }
    ],
    playerStats: [
      {
        team: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
        category: 'Outfield',
        source: 'boxscore',
        labels: ['Shots', 'Pass %'],
        players: [
          {
            player: { id: '125824', name: 'Robert Lewandowski', displayName: 'Robert Lewandowski' },
            stats: [
              { key: 'shots', label: 'Shots', displayValue: '4' },
              { key: 'passpct', label: 'Pass %', displayValue: '0.61' }
            ]
          }
        ]
      }
    ],
    events: [
      {
        id: 'home-goal',
        type: 'goal',
        teamId: '97',
        teamName: 'Osasuna',
        playerName: 'Ante Budimir',
        goalQualifier: 'penalty',
        displayMinute: "20'",
        text: 'Goal'
      },
      {
        id: 'own-goal',
        type: 'goal',
        teamId: '97',
        teamName: 'Osasuna',
        playerName: 'Jules Kounde',
        goalQualifier: 'own_goal',
        displayMinute: "55'",
        text: 'Own Goal'
      },
      {
        id: 'away-goal',
        type: 'goal',
        teamId: '83',
        teamName: 'Barcelona',
        playerName: 'Robert Lewandowski',
        goalQualifier: 'free_kick',
        displayMinute: "30'",
        text: 'Goal'
      }
    ],
    goals: [] as unknown[],
    redCards: [] as unknown[]
  }
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route,
  useRouter: () => ({
    replace: routerMock.replace
  })
}));

vi.mock('@/composables/useMatchSummary', () => ({
  useMatchSummary: () => ({
    data: computed(() => matchMock.value),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

describe('MatchDetailPage', () => {
  beforeEach(() => {
    routerMock.route.query = {};
    routerMock.replace.mockClear();
    matchMock.value = {
      ...matchMock.value,
      leagueSlug: 'esp.1',
      leagueName: 'Spanish LALIGA',
      leagueShortName: undefined,
      teamStats: [
        {
          team: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
          stats: [{ key: 'possessionpct', label: 'Possession %', displayValue: '42%' }]
        },
        {
          team: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
          stats: [{ key: 'possessionpct', label: 'Possession %', displayValue: '58%' }]
        }
      ],
      playerStats: [
        {
          team: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
          category: 'Outfield',
          source: 'boxscore',
          labels: ['Shots', 'Pass %'],
          players: [
            {
              player: { id: '125824', name: 'Robert Lewandowski', displayName: 'Robert Lewandowski' },
              stats: [
                { key: 'shots', label: 'Shots', displayValue: '4' },
                { key: 'passpct', label: 'Pass %', displayValue: '0.61' }
              ]
            }
          ]
        }
      ]
    };
  });

  it('shows internal match detail tabs', () => {
    const wrapper = mountPage();

    const tabs = wrapper.findAll('button').map((button) => button.text());

    expect(tabs).toEqual(expect.arrayContaining(['Diễn biến', 'Thống kê', 'Cầu thủ', 'Thông tin Khác']));
    expect(tabs.indexOf('Diễn biến')).toBeLessThan(tabs.indexOf('Thống kê'));
    expect(tabs.indexOf('Thống kê')).toBeLessThan(tabs.indexOf('Cầu thủ'));
    expect(tabs.indexOf('Cầu thủ')).toBeLessThan(tabs.indexOf('Thông tin Khác'));
  });

  it('renders home event on the left and away event on the right with badge in the middle', async () => {
    const wrapper = mountPage();
    await wrapper.findAll('button').find((button) => button.text() === 'Diễn biến')?.trigger('click');
    const rows = wrapper.findAll('[data-testid="timeline-event"]');

    expect(rows[0].find('[data-testid="home-event"]').text()).toContain('Ante Budimir (P)');
    expect(rows[0].find('[data-testid="event-badge"]').text()).toContain('Bàn thắng');
    expect(rows[1].find('[data-testid="home-event"]').text()).toContain('Jules Kounde (OG)');
    expect(rows[2].find('[data-testid="away-event"]').text()).toContain('Robert Lewandowski (F)');
  });

  it('renders important match tag and penalty shootout score', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Chung kết');
    expect(wrapper.text()).toContain('Pen: 4 - 5');
  });

  it('uses the full league label in the header', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Spanish LALIGA');
  });

  it('uses curated league metadata instead of weak league labels', () => {
    matchMock.value = {
      ...matchMock.value,
      leagueSlug: 'ksa.1',
      leagueName: 'KSA 1',
      leagueShortName: 'KSA 1'
    };
    const wrapper = mountPage({ leagueSlug: 'ksa.1', eventId: '748480' });

    expect(wrapper.text()).toContain('Saudi Pro League');
    expect(wrapper.text()).not.toContain('KSA 1');
  });

  it('links team logos to team schedule and results pages', () => {
    const wrapper = mountPage();
    const homeTeamLink = wrapper.find('[data-testid="home-team-link"]');
    const awayTeamLink = wrapper.find('[data-testid="away-team-link"]');

    expect(homeTeamLink.attributes('aria-label')).toBe('Xem lịch đấu và kết quả của Osasuna');
    expect(awayTeamLink.attributes('aria-label')).toBe('Xem lịch đấu và kết quả của Barcelona');
    expect(homeTeamLink.findComponent(RouterLinkStub).props('to')).toMatchObject({
      name: 'team-detail',
      params: { leagueSlug: 'esp.1', teamId: '97' }
    });
    expect(awayTeamLink.findComponent(RouterLinkStub).props('to')).toMatchObject({
      name: 'team-detail',
      params: { leagueSlug: 'esp.1', teamId: '83' }
    });
  });

  it('replaces a mismatched match route with the canonical ESPN league slug', () => {
    routerMock.route.query = { returnTo: '/fixtures' };
    matchMock.value = {
      ...matchMock.value,
      leagueSlug: 'uefa.europa.conf',
      leagueName: 'UEFA Conference League'
    };

    const wrapper = mountPage({ leagueSlug: 'eng.fa', eventId: '401862929' });

    expect(routerMock.replace).toHaveBeenCalledWith({
      name: 'match-detail',
      params: { leagueSlug: 'uefa.europa.conf', eventId: '401862929' },
      query: { returnTo: '/fixtures' }
    });
    expect(wrapper.find('[data-testid="home-team-link"]').findComponent(RouterLinkStub).props('to')).toMatchObject({
      name: 'team-detail',
      params: { leagueSlug: 'uefa.europa.conf', teamId: '97' }
    });
  });

  it('does not replace the route when it already matches the canonical league slug', () => {
    mountPage();

    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('renders team match stats and player match stats when selected', async () => {
    const wrapper = mountPage();
    await wrapper.findAll('button').find((button) => button.text() === 'Thống kê')?.trigger('click');

    expect(wrapper.find('[data-testid="team-match-stats"]').text()).toContain('Possession %');
    expect(wrapper.text()).toContain('42%');
    expect(wrapper.text()).toContain('58%');

    await wrapper.findAll('button').find((button) => button.text() === 'Cầu thủ')?.trigger('click');

    expect(wrapper.find('[data-testid="player-match-stats"]').text()).toContain('Robert Lewandowski');
    expect(wrapper.text()).toContain('Pass %');
    expect(wrapper.text()).toContain('61%');
  });

  it('labels player leader fallback stats as highlighted players', async () => {
    matchMock.value = {
      ...matchMock.value,
      playerStats: [
        {
          team: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
          category: 'Cau thu noi bat',
          source: 'leaders',
          labels: ['Total Shots'],
          players: [
            {
              player: { id: '125824', name: 'Robert Lewandowski', displayName: 'Robert Lewandowski' },
              stats: [{ key: 'totalshots', label: 'Total Shots', displayValue: '4' }]
            }
          ]
        }
      ]
    };
    const wrapper = mountPage();

    await wrapper.findAll('button').find((button) => button.text() === 'Cầu thủ')?.trigger('click');

    expect(wrapper.text()).toContain('Cầu thủ nổi bật');
    expect(wrapper.text()).toContain('Total Shots');
  });

  it('renders empty stat states when data provider does not provide stats', async () => {
    matchMock.value = {
      ...matchMock.value,
      teamStats: [],
      playerStats: []
    };
    const wrapper = mountPage();

    await wrapper.findAll('button').find((button) => button.text() === 'Thống kê')?.trigger('click');
    expect(wrapper.text()).toContain('Chúng tôi chưa có thống kê đội cho trận này.');
    expect(wrapper.text()).not.toContain('ESPN');

    await wrapper.findAll('button').find((button) => button.text() === 'Cầu thủ')?.trigger('click');
    expect(wrapper.text()).toContain('Chúng tôi chưa có thống kê cầu thủ cho trận này.');
    expect(wrapper.text()).not.toContain('ESPN');
  });

  it('uses returnTo query for the back link', () => {
    routerMock.route.query = { returnTo: '/team/esp.1/83?tab=results&league=esp.1' };

    const wrapper = mountPage();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe(
      '/team/esp.1/83?tab=results&league=esp.1'
    );
  });

  it('falls back to fixtures for unsafe back targets', () => {
    routerMock.route.query = { returnTo: 'https://example.com' };

    const wrapper = mountPage();

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toBe('/fixtures');
  });
});

function mountPage(props = { leagueSlug: 'esp.1', eventId: '748480' }) {
  return mount(MatchDetailPage, {
    props,
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  });
}
