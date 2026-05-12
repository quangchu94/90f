import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StandingsGroupTable from './StandingsGroupTable.vue';

describe('StandingsGroupTable', () => {
  it('uses a compact fixed layout for standings groups without horizontal min-width', () => {
    const wrapper = mount(StandingsGroupTable, {
      props: {
        leagueSlug: 'fifa.world',
        group: {
          id: 'a',
          name: 'Group A',
          rows: [
            {
              id: '1',
              rank: 1,
              team: { id: '1', name: 'Brazil', shortName: 'Brazil' },
              played: 3,
              wins: 2,
              draws: 1,
              losses: 0,
              goalDifference: 4,
              points: 7
            }
          ]
        }
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    expect(wrapper.find('table').classes()).toContain('table-fixed');
    expect(wrapper.find('table').classes()).not.toContain('min-w-[42rem]');
    expect(wrapper.findAll('col')).toHaveLength(8);
    expect(wrapper.find('col').classes()).toContain('w-7');
  });

  it('renders all key standings headers in the compact table', () => {
    const wrapper = mount(StandingsGroupTable, {
      props: {
        leagueSlug: 'fifa.world',
        group: {
          id: 'a',
          name: 'Group A',
          rows: [makeRow('1', 'Brazil', 1)]
        }
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });
    const headers = wrapper.findAll('thead th').map((header) => header.text());

    expect(headers).toEqual(['#', 'Đội', 'Tr', 'T', 'H', 'B', 'HS', 'Đ']);
  });

  it('renders rows sorted by ESPN rank even if input rows are unordered', () => {
    const wrapper = mount(StandingsGroupTable, {
      props: {
        leagueSlug: 'fifa.world',
        group: {
          id: 'a',
          name: 'Group A',
          rows: [
            makeRow('4', 'Fourth', 4),
            makeRow('1', 'First', 1),
            makeRow('x', 'Unranked'),
            makeRow('2', 'Second', 2)
          ]
        }
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    });

    const renderedTeams = wrapper.findAll('tbody tr').map((row) => row.text());

    expect(renderedTeams[0]).toContain('First');
    expect(renderedTeams[1]).toContain('Second');
    expect(renderedTeams[2]).toContain('Fourth');
    expect(renderedTeams[3]).toContain('Unranked');
  });
});

function makeRow(id: string, name: string, rank?: number) {
  return {
    id,
    rank,
    team: { id, name, shortName: name },
    played: 3,
    wins: 1,
    draws: 1,
    losses: 1,
    goalDifference: 0,
    points: 4
  };
}
