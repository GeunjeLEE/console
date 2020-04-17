import { fluentApi } from '@/lib/fluent-api';

const Identity = () => import('@/views/identity/Identity');

const IdentityNavBar = () => import('@/views/identity/IdentityNavBar');
const User = () => import('@/views/identity/user/User');
const Project = () => import('@//views/identity/project/pages/Project2');
const ProjectDetail = () => import('@/views/identity/project/pages/ProjectDetail');
const ServiceAccount = () => import('@/views/identity/service-account/pages/ServiceAccount');
const TagsPage = () => import('@/views/common/tags/TagsPage.vue');

export default {
    path: 'identity',
    name: 'identity',
    redirect: '/identity/project',
    meta: { label: 'Identity', breadcrumb: true },
    components: {
        lnb: IdentityNavBar,
        main: Identity,
    },
    children: [
        // {
        //     path: 'project',
        //     name: 'project',
        //     meta: { label: 'Project', breadcrumb: true },
        //     component: Project,
        // },
        {
            path: 'project',
            name: 'project',
            redirect: '/identity/project',
            meta: { label: 'Project', breadcrumb: true },
            component: { template: '<router-view />' },
            children: [
                {
                    path: '/',
                    name: 'projectMain',
                    component: Project,
                },
                {
                    path: ':id',
                    name: 'projectDetail',
                    props: true,
                    component: ProjectDetail,
                },
            ],

        },
        {
            path: 'user',
            name: 'user',
            meta: { label: 'User', breadcrumb: true },
            component: User,
        },
        {
            path: 'service-account',
            meta: {
                label: 'Service Account',
                breadcrumb: true,
                api: fluentApi.identity().serviceAccount(),
            },
            component: { template: '<router-view />' },
            children: [
                {
                    path: '/',
                    name: 'serviceAccount',
                    component: ServiceAccount,
                },
                {
                    path: ':resourceId/tags',
                    name: 'serviceAccountTags',
                    meta: { label: 'tags' },
                    props: true,
                    component: TagsPage,
                },
            ],
        },
    ],
};
