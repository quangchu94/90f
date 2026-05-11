import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/fixtures'
    },
    {
      path: '/fixtures',
      name: 'fixtures',
      component: () => import('@/features/fixtures/FixturesPage.vue')
    },
    {
      path: '/fixtures/:date',
      name: 'fixtures-by-date',
      redirect: '/fixtures'
    },
    {
      path: '/match/:leagueSlug/:eventId',
      name: 'match-detail',
      component: () => import('@/features/match-detail/MatchDetailPage.vue'),
      props: true
    },
    {
      path: '/standings/:leagueSlug',
      name: 'standings',
      component: () => import('@/features/standings/StandingsPage.vue'),
      props: true
    },
    {
      path: '/teams/:leagueSlug',
      name: 'teams',
      component: () => import('@/features/teams/TeamsPage.vue'),
      props: true
    },
    {
      path: '/team/:leagueSlug/:teamId',
      name: 'team-detail',
      component: () => import('@/features/teams/TeamDetailPage.vue'),
      props: true
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});
