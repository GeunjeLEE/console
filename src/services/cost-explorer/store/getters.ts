import { Getter } from 'vuex';
import { CostExplorerState } from '@/services/cost-explorer/store/type';

export const dashboardList: Getter<CostExplorerState, any> = (state) => {
    const publicList = state.publicDashboardList.map(d => ({
        ...d,
        dashboard_id: d.public_dashboard_id,
    }));
    const userList = state.userDashboardList.map(d => ({
        ...d,
        dashboard_id: d.user_dashboard_id,
    }));
    return [...publicList, ...userList];
};


export const homeDashboardId: Getter<CostExplorerState, any> = (state, getters, rootState, rootGetters): string|undefined => rootGetters['settings/getItem']('homeDashboard', '/costExplorer');