import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginPage.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterPage.vue'),
    },
    {
      path: '/checkout/:paymentId?',
      name: 'checkout',
      component: () => import('../views/CheckoutPage.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/student/Dashboard.vue'),
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('../views/student/CoursesPage.vue'),
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/student/CourseDetail.vue'),
      meta: { requiresAuth: true, requiresSubscription: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminDashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/courses',
      name: 'admin-courses',
      component: () => import('../views/admin/CoursesManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/courses/:id/content',
      name: 'admin-course-content',
      component: () => import('../views/admin/CourseContentManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/UsersManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }

  // Admin routes allow both ADMIN and INSTRUCTOR roles
  if (to.meta.requiresAdmin) {
    const userRole = authStore.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'INSTRUCTOR') {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
