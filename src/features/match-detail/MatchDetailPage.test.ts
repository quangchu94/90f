import { mount, RouterLinkStub } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MatchDetailPage from './MatchDetailPage.vue';

const routerMock = vi.hoisted(() => ({
  route: {
    query: {} as Record<string, string>
  }
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route
}));

vi.mock('@/composables/useMatchSummary', () => ({
  useMatchSummary: () => ({
    data: computed(() => ({
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
      broadcasts: [],
      notes: [],
      attendance: 12000,
      events: [
        {
          id: 'home-goal',
          type: 'goal',
          teamId: '97',
          teamName: 'Osasuna',
          playerName: 'Ante Budimir',
          displayMinute: "20'",
          text: 'Goal'
        },
        {
          id: 'away-goal',
          type: 'goal',
          teamId: '83',
          teamName: 'Barcelona',
          playerName: 'Robert Lewandowski',
          displayMinute: "30'",
          text: 'Goal'
        }
      ],
      goals: [],
      redCards: []
    })),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

describe('MatchDetailPage', () => {
  beforeEach(() => {
    routerMock.route.query = {};
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

    expect(rows[0].find('[data-testid="home-event"]').text()).toContain('Ante Budimir');
    expect(rows[0].find('[data-testid="event-badge"]').text()).toContain('Bàn thắng');
    expect(rows[1].find('[data-testid="away-event"]').text()).toContain('Robert Lewandowski');
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

function mountPage() {
  return mount(MatchDetailPage, {
    props: { leagueSlug: 'esp.1', eventId: '748480' },
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  });
}
