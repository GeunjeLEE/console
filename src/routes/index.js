import Vue from 'vue';
import VueRouter from 'vue-router';

// Routes
import dashboardRoute from '@/routes/dashboard/dashboard-route';
import identityRoute from '@/routes/identity/identity-route';
import inventoryRoute from '@/routes/inventory/inventory-route';
import secretRoute from '@/routes/secret/secret-route';
import DefaultContainer from '@/views/containers/DefaultContainer.vue';
import pluginRoute from '@/routes/plugin/plugin-route';
import projectRoute from '@/routes/project/project-route';
// Views
import SignIn from '@/views/sign-in/Signin.vue';
import ErrorPage from '@/views/common/error/ErrorPage.vue';
import { fluentApi } from '@/lib/fluent-api';

Vue.use(VueRouter);


const router = new VueRouter({
    mode: 'history',
    hash: false,
    linkActiveClass: 'open active',
    routes: [
        {
            path: '/error-page',
            name: 'error',
            meta: { label: '', excludeAuth: true },
            component: ErrorPage,
        },
        {
            path: '/sign-in',
            component: { template: '<router-view />' },
            meta: {
                excludeAuth: true,
                isSignInPage: true,
            },
            children: [
                {
                    path: '/',
                    name: 'Login',
                    meta: {
                        excludeAuth: true,
                        isSignInPage: true,

                    },
                    props: route => ({
                        nextPath: route.query.nextPath || '/',
                    }),
                    component: SignIn,
                },
                {
                    path: 'admin',
                    name: 'AdminLogin',
                    meta: {
                        excludeAuth: true,
                        isSignInPage: true,

                    },
                    component: SignIn,
                    props: route => ({
                        admin: true,
                        nextPath: route.query.nextPath || '/',
                    }),
                },
            ],
        },
        {
            path: '/',
            name: 'root',
            meta: { label: 'root' },
            redirect: '/dashboard',
            component: DefaultContainer,
            children: [
                dashboardRoute,
                identityRoute,
                inventoryRoute,
                secretRoute,
                pluginRoute,
                projectRoute,
            ],
        },
        { path: '*', component: ErrorPage },
    ],
});

const hasLogIn = () => !!localStorage.getItem('user/refreshToken');
const isDomainOwner = () => JSON.parse(localStorage.getItem('user/userType')).data === 'DOMAIN_OWNER';


router.beforeEach(async (to, from, next) => {
    if (to.meta && to.meta.excludeAuth) {
        if (to.meta.isSignInPage) {
            if (hasLogIn()) {
                try {
                    next({ path: to.meta.query.nextPath });
                } catch (e) {
                    next('/');
                }
            }
        }
        next();
    } else if (hasLogIn()) {
        if (to.meta && to.meta.isDomainOwnerOnly && !isDomainOwner()) {
            next({ name: 'error' });
        }
        next();
    } else {
        next({ name: 'Login', query: { nextPath: to.path } });
    }
});

export default router;
