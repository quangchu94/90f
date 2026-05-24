import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MatchRow from './MatchRow.vue';
import StatusBadge from './StatusBadge.vue';
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
      props: { match: { ...makeMatch('in_progress', 1, 2), statusText: "67'" } },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    const finished = mount(MatchRow, {
      props: { match: makeMatch('finished', 3, 0) },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(live.text()).toContain('Live');
    expect(live.text()).toContain("67'");
    expect(finished.text()).toContain('FT');
  });

  it('renders explicit halftime as a halftime badge', () => {
    const wrapper = mount(MatchRow, {
      props: { match: { ...makeMatch('halftime', 1, 2), statusText: 'HT' } },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.text()).toContain('Nghỉ giữa hiệp');
    expect(wrapper.text()).toContain('HT');
    expect(wrapper.text()).not.toContain('Live');
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

  it('renders important match tags when present', () => {
    const wrapper = mount(MatchRow, {
      props: { match: { ...makeMatch('scheduled'), importanceLabel: 'Tứ kết' } },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });

    expect(wrapper.text()).toContain('Tứ kết');
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

  it('uses a compact mobile-first layout that does not force three fixed columns', () => {
    const wrapper = mount(MatchRow, {
      props: { match: makeMatch('scheduled') },
      global: { stubs: { RouterLink: RouterLinkStub } }
    });
    const linkClasses = wrapper.findComponent(RouterLinkStub).classes().join(' ');

    expect(linkClasses).toContain('grid-cols-[minmax(0,1fr)_2.25rem]');
    expect(linkClasses).toContain('sm:grid-cols-[5rem_minmax(0,1fr)_3rem]');
    expect(linkClasses).not.toContain('grid-cols-[3.75rem_1fr_auto]');
  });

  it('keeps status badges compact on narrow screens', () => {
    const wrapper = mount(StatusBadge, {
      props: { status: 'scheduled' }
    });
    const classes = wrapper.find('span').classes();

    expect(classes).not.toContain('min-w-20');
    expect(classes).toContain('sm:min-w-20');
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
