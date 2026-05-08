import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MatchRow from './MatchRow.vue';
import type { FootballMatch } from '@/domain/models';

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
