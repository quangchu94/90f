import { mount } from '@vue/test-utils';
import { computed } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FootballMatch } from '@/domain/models';
import LeagueMatchGroup from './LeagueMatchGroup.vue';

let mockMatches: FootballMatch[] = [];
let mockIsLoading = false;
let mockIsError = false;
let mockIsFetching = false;

vi.mock('@/composables/useScoreboards', () => ({
  useScoreboards: () => ({
    matches: computed(() => mockMatches),
    isLoading: computed(() => mockIsLoading),
    isError: computed(() => mockIsError),
    isFetching: computed(() => mockIsFetching),
    refetchAll: vi.fn()
  })
}));

describe('LeagueMatchGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-08T00:00:00+07:00'));
    mockMatches = [];
    mockIsLoading = false;
    mockIsError = false;
    mockIsFetching = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders only date sections that have matches after local-date filtering', () => {
    mockMatches = [
      makeMatch({
        id: '748491',
        kickoff: '2026-05-08T19:00Z',
        status: 'scheduled'
      })
    ];

    const wrapper = mountGroup(['2026-05-08', '2026-05-09'], 'fixtures');

    expect(wrapper.text()).not.toContain('Hôm nay');
    expect(wrapper.text()).toContain('Ngày mai');
    expect(wrapper.text()).toContain('Levante');
  });

  it('renders one league-level empty state when the full range has no matches', () => {
    const wrapper = mountGroup(['2026-05-08', '2026-05-09'], 'fixtures');

    expect(wrapper.text()).toContain('Không có trận nào trong khoảng thời gian này');
    expect(wrapper.text()).toContain('Hãy thử tải thêm lịch đấu hoặc chọn thêm giải đấu.');
    expect(wrapper.text()).not.toContain('Chưa có trận sắp diễn ra trong ngày này.');
  });
  it('uses the league short label in the group header', () => {
    const wrapper = mount(LeagueMatchGroup, {
      props: {
        leagueSlug: 'eng.1',
        leagueSummary: { slug: 'eng.1', name: 'Premier League', shortName: 'EPL' },
        dates: ['2026-05-08'],
        mode: 'fixtures'
      },
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    });

    expect(wrapper.find('h2').text()).toBe('EPL');
  });
});

function mountGroup(dates: string[], mode: 'results' | 'fixtures') {
  return mount(LeagueMatchGroup, {
    props: {
      leagueSlug: 'esp.1',
      dates,
      mode
    },
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>'
        }
      }
    }
  });
}

function makeMatch(overrides: Partial<FootballMatch>): FootballMatch {
  return {
    id: '401',
    leagueSlug: 'esp.1',
    leagueName: 'Spanish LALIGA',
    kickoff: '2026-05-08T19:00Z',
    status: 'scheduled',
    statusText: 'Scheduled',
    homeTeam: { id: '1538', name: 'Levante', shortName: 'Levante' },
    awayTeam: { id: '97', name: 'Osasuna', shortName: 'Osasuna' },
    ...overrides
  };
}
