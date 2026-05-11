import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import FixturesPage from './FixturesPage.vue';

describe('FixturesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not mention timezone in the page helper copy', () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain('Xem');
    expect(wrapper.text()).not.toContain('GMT+7');
  });

  it('renders one league match group for the selected league', () => {
    const wrapper = mountPage();

    const groups = wrapper.findAllComponents({ name: 'LeagueMatchGroup' });
    expect(groups).toHaveLength(1);
    expect(groups[0].props('leagueSlug')).toBe('eng.1');
  });
});

function mountPage() {
  return mount(FixturesPage, {
    global: {
      stubs: {
        FixtureModeTabs: true,
        LeagueFilter: true,
        LeagueMatchGroup: true
      }
    }
  });
}
