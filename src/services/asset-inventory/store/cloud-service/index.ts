import { CloudServiceStoreState } from '@/services/asset-inventory/store/cloud-service/type';
// import * as actions from './actions';
import * as mutations from './mutations';
// import * as getters from './getters';


const state: CloudServiceStoreState = {
    selectedProvider: 'all',
    selectedCategories: [],
    selectedRegions: [],
};

export default {
    namespaced: true,
    state: () => ({ ...state }),
    // actions,
    mutations,
    // getters,
};
