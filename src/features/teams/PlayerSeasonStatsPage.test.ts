import { mount, RouterLinkStub } from '@vue/test-utils';
import { computed } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlayerSeasonStatsPage from './PlayerSeasonStatsPage.vue';

const routerMock = vi.hoisted(() => ({
  route: { query: {} as Record<string, string> },
  replace: vi.fn()
}));

const statsMock = vi.hoisted(() => ({
  stats: {
    playerId: '7',
    season: '2025-26',
    groups: [
      {
        name: 'Scoring',
        stats: [
          { key: 'goals', label: 'Goals', displayValue: '12' },
          { key: 'assists', label: 'Assists', displayValue: '8' },
          { key: 'passpct', label: 'Pass %', displayValue: '0.72' }
        ]
      }
    ]
  } as unknown,
  isLoading: false,
  isError: false
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route,
  useRouter: () => ({ replace: routerMock.replace })
}));

vi.mock('@/composables/useTeamRouteLeague', () => ({
  useTeamRouteLeague: () => ({
    effectiveLeague: computed(() => ({ slug: 'eng.1', name: 'Premier League', shortName: 'EPL' })),
    effectiveLeagueSlug: computed(() => 'eng.1'),
    canUseLeague: computed(() => true),
    shouldRedirect: computed(() => false),
    fallbackLeagueSlug: computed(() => 'eng.1')
  })
}));

vi.mock('@/composables/useTeamDetail', () => ({
  useTeamDetail: () => ({
    data: computed(() => ({ id: '359', name: 'Arsenal', shortName: 'Arsenal' })),
    isLoading: computed(() => false),
    isError: computed(() => false),
    refetch: vi.fn()
  })
}));

vi.mock('@/composables/useTeamRoster', () => ({
  useTeamRoster: () => ({
    data: computed(() => [
      {
        id: '7',
        name: 'Bukayo Saka',
        displayName: 'Bukayo Saka',
        jersey: '7',
        position: 'Forward',
        nationality: 'England'
      }
    ]),
    isLoading: computed(() => false)
  })
}));

vi.mock('@/composables/usePlayerSeasonStats', () => ({
  usePlayerSeasonStats: () => ({
    data: computed(() => statsMock.stats),
    isLoading: computed(() => statsMock.isLoading),
    isError: computed(() => statsMock.isError),
    refetch: vi.fn()
  })
}));

describe('PlayerSeasonStatsPage', () => {
  beforeEach(() => {
    routerMock.replace.mockClear();
    statsMock.stats = {
      playerId: '7',
      season: '2025-26',
      groups: [
        {
          name: 'Scoring',
          stats: [
            { key: 'goals', label: 'Goals', displayValue: '12' },
            { key: 'assists', label: 'Assists', displayValue: '8' },
            { key: 'passpct', label: 'Pass %', displayValue: '0.72' }
          ]
        }
      ]
    };
    statsMock.isLoading = false;
    statsMock.isError = false;
  });

  it('renders player season stats with a team-detail back link', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Bukayo Saka');
    expect(wrapper.text()).toContain('2025-26');
    expect(wrapper.text()).toContain('Goals');
    expect(wrapper.text()).toContain('12');
    expect(wrapper.text()).toContain('Pass %');
    expect(wrapper.text()).toContain('72%');
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toMatchObject({
      name: 'team-detail',
      params: { leagueSlug: 'eng.1', teamId: '359' }
    });
  });

  it('renders unsupported state when data provider returns no usable stats', () => {
    statsMock.stats = { playerId: '7', groups: [] };
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Chúng tôi chưa có thống kê mùa cho cầu thủ này.');
    expect(wrapper.text()).not.toContain('ESPN');
  });

  it('renders unsupported state when stats request fails', () => {
    statsMock.isError = true;
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Chúng tôi chưa có thống kê mùa cho cầu thủ này.');
    expect(wrapper.text()).not.toContain('ESPN');
    expect(wrapper.text()).toContain('Thử lại');
  });
});

function mountPage() {
  return mount(PlayerSeasonStatsPage, {
    props: { leagueSlug: 'eng.1', teamId: '359', playerId: '7' },
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  });
}
