import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MatchRow from './MatchRow.vue';
import type { FootballMatch } from '@/domain/models';

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/team/eng.1/359?tab=results&league=uefa.champions' })
}));

describe('MatchRow', () => {
  it('renders scheduled match with fallback score', () => {
    const wrapper = mount(MatchRow, {
      props: { match: makeMatch('scheduled') },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.text()).toContain('Sắp tới');
    expect(wrapper.text()).toContain('Arsenal');
    expect(wrapper.text()).toContain('-');
  });

  it('renders live and finished states', () => {
    const live = mount(MatchRow, {
      props: { match: makeMatch('in_progress', 1, 2) },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    const finished = mount(MatchRow, {
      props: { match: makeMatch('finished', 3, 0) },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(live.text()).toContain('Live');
    expect(finished.text()).toContain('FT');
  });

  it('renders kickoff date when requested', () => {
    const wrapper = mount(MatchRow, {
      props: { match: makeMatch('scheduled'), showDate: true },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.text()).toContain('08/05/2026');
  });

  it('renders league short name when requested', () => {
    const wrapper = mount(MatchRow, {
      props: { match: makeMatch('scheduled'), showLeague: true },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.text()).toContain('EPL');
    expect(wrapper.text()).not.toContain('Premier League');
  });

  it('passes the current route as return target to match detail', () => {
    const wrapper = mount(MatchRow, {
      props: { match: makeMatch('scheduled') },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toMatchObject({
      name: 'match-detail',
      query: { returnTo: '/team/eng.1/359?tab=results&league=uefa.champions' }
    });
  });
});

function makeMatch(
  status: FootballMatch['status'],
  homeScore?: number,
  awayScore?: number
): FootballMatch {
  return {
    id: '401',
    leagueSlug: 'eng.1',
    leagueName: 'Premier League',
    kickoff: '2026-05-08T14:00:00Z',
    status,
    statusText: status,
    homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS' },
    awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE' },
    homeScore,
    awayScore
  };
}
