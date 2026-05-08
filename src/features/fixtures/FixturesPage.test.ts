import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import FixturesPage from './FixturesPage.vue';

describe('FixturesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not mention timezone in the page helper copy', () => {
    const wrapper = mount(FixturesPage, {
      global: {
        stubs: {
          FixtureModeTabs: true,
          LeagueFilter: true,
          LeagueMatchGroup: true
        }
      }
    });

    expect(wrapper.text()).toContain('Xem kết quả đã diễn ra và lịch đấu sắp tới.');
    expect(wrapper.text()).not.toContain('GMT+7');
  });
});
