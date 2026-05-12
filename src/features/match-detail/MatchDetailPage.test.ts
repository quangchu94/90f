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
    kickoff: '2026-05-02T19:00Z',
    status: 'finished',
    statusText: 'FT',
    homeTeam: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
    awayTeam: { id: '83', name: 'Barcelona', shortName: 'Barcelona' },
    homeScore: 1,
    awayScore: 2,
    penaltyShootout: { home: 4, away: 5 },
    importanceLabel: 'Chung káº¿t',
    broadcasts: [] as string[],
    notes: [] as string[],
    attendance: 12000,
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
      leagueName: 'Spanish LALIGA'
    };
  });

  it('places match events before match info and broadcast sections', () => {
    const wrapper = mountPage();
    const text = wrapper.text();

    expect(text.indexOf('Diễn biến chính')).toBeLessThan(text.indexOf('Thông tin trận'));
    expect(text.indexOf('Thông tin trận')).toBeLessThan(text.indexOf('Phát sóng'));
  });

  it('renders home event on the left and away event on the right with badge in the middle', () => {
    const wrapper = mountPage();
    const rows = wrapper.findAll('[data-testid="timeline-event"]');

    expect(rows[0].find('[data-testid="home-event"]').text()).toContain('Ante Budimir (P)');
    expect(rows[0].find('[data-testid="event-badge"]').text()).toContain('Bàn thắng');
    expect(rows[1].find('[data-testid="away-event"]').text()).toContain('Robert Lewandowski (F)');
  });

  it('renders important match tag and penalty shootout score', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Chung káº¿t');
    expect(wrapper.text()).toContain('Pen: 4 - 5');
  });

  it('uses the league short label in the header', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('LaLiga');
    expect(wrapper.text()).not.toContain('Spanish LALIGA');
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
