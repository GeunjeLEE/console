/* eslint-disable camelcase,@typescript-eslint/camelcase */
import Vue from 'vue';
import { UnwrapRef } from '@vue/composition-api/dist/reactivity';
import {
    ref,
    computed, getCurrentInstance, isRef, onMounted, reactive, Ref, watch,
} from '@vue/composition-api';

import {
    QuerySearchTableToolSet,
    SearchTableToolSet,
    ToolboxTableToolSet,
} from '@/components/organisms/tables/toolbox-table/toolset';
import {
    BaseApiState, transformHandlerType, getDataAPI, DynamicFluentAPIToolSet,
} from '@/lib/api/toolset';
import { cnaRefArgs, forceRefArg, readonlyRefArg } from '@/lib/type';
import {
    baseAutocompleteHandler,
    SearchQueryType,
} from '@/components/organisms/search/query-search-bar/autocompleteHandler';
import { ApiQuery, defaultQuery } from '@/lib/api/query';
import { QuerySearchTableACHandler } from '@/lib/api/auto-complete';
import {
    GetDataAction, ListType, MemberListAction, QueryAPI,
} from '@/lib/fluent-api';

interface DynamicTableOptions{
    options: any;
}

export abstract class BaseTableFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends ToolboxTableToolSet<initData, initSyncData> = ToolboxTableToolSet<initData, initSyncData>,
    action extends QueryAPI<any, any> = QueryAPI<parameter, resp>,
    > extends DynamicFluentAPIToolSet<parameter, resp, action> {
    tableTS: T;

    totalCount: Ref<number>;

    protected constructor(action: action) {
        super(action);
        this.totalCount = ref(0);
        this.tableTS = new ToolboxTableToolSet<initData, initSyncData>() as T;
    }

    protected getDefaultAction(): action {
        return this.action
            .setSortBy(this.tableTS.syncState.sortBy)
            .setSortDesc(this.tableTS.syncState.sortDesc)
            .setThisPage(this.tableTS.syncState.thisPage as number)
            .setPageSize(this.tableTS.syncState.pageSize as number);
    }

    getAction = () => this.getDefaultAction()

    getData = async () => {
        this.tableTS.syncState.loading = true;
        this.tableTS.state.items = [];
        this.tableTS.syncState.selectIndex = [];
        try {
            const res = await this.getAction().execute();
            this.tableTS.state.items = res.data.results;
            this.totalCount.value = res.data.total_count;
            this.tableTS.setAllPage(res.data.total_count);
        } catch (e) {
            this.tableTS.state.items = [];
            this.tableTS.state.allPage = 1;
            this.totalCount.value = 0;
        }
        this.tableTS.syncState.loading = false;
    };

    protected defaultReset = () => {
        this.tableTS.state.allPage = 1;
        this.totalCount.value = 0;
        this.tableTS.state.items = [];
        this.tableTS.syncState.thisPage = 1;
        this.tableTS.syncState.selectIndex = [];
        this.tableTS.syncState.sortBy = '';
        this.tableTS.syncState.sortDesc = true;
    };

    resetAll = () => {
        this.defaultReset();
    }
}

export class SearchTableFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>,
    action extends QueryAPI<any, any> = QueryAPI<parameter, resp>,
    > extends BaseTableFluentAPI<parameter, resp, action> {
    tableTS: T;

    constructor(
        action: action,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
    ) {
        super(action);
        this.tableTS = new SearchTableToolSet(initData, initSyncData) as T;
    }

    // @ts-ignore
    getSearchTableDefaultAction: () => action = () => this.getDefaultAction().setKeyword(this.tableTS.searchText.value);

    getAction = () => {
        const action = this.getSearchTableDefaultAction();
        return action;
    };

    resetAll = () => {
        this.defaultReset();
        this.tableTS.searchText.value = '';
    };
}

export class SubDataFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>,
    action extends GetDataAction<any, any> = GetDataAction<parameter, resp>,
    > extends SearchTableFluentAPI<parameter, resp, initData, initSyncData, T, action> {
    getAction = () => this.getSearchTableDefaultAction()
        .setKeyPath(this.keyPath.value)
        .setId(this.resourceId.value);

    constructor(
        action: action,
        protected keyPath: forceRefArg<string>,
        protected resourceId: forceRefArg<string>,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
    ) {
        super(
            action,
            {
                striped: true,
                border: false,
                shadow: false,
                padding: false,
                selectable: false,
                excelVisible: true,
                ...initData,
            }, // sub api can't support only query
            initSyncData,
        );
        onMounted(() => {
            watch([this.resourceId, this.keyPath], async (origin, before) => {
                let id;
                let path;
                let preId;
                let prePath;
                if (origin) {
                    id = origin[0];
                    path = origin[1];
                }
                if (before) {
                    preId = before[0];
                    prePath = before[1];
                }

                if (id && path && (id !== preId || path !== prePath)) {
                    await this.getData();
                }
            });
        });
    }
}


export class TabSearchTableFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>,
    action extends QueryAPI<any, any> = QueryAPI<parameter, resp>,
    > extends SearchTableFluentAPI<parameter, resp, initData, initSyncData, T, action> {
    constructor(
        action: action,
        protected isShow: forceRefArg<boolean>,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
    ) {
        super(
            action,
            initData, // sub api can't support only query
            initSyncData,
        );
        onMounted(() => {
            watch(this.isShow, async (show, preShow) => {
                if (show && show !== preShow) {
                    await this.getData();
                }
            });
        });
    }
}

export const defaultAdminFields = [
    { name: 'Resource Type', key: 'resource_type' },
    { name: 'Resource ID', key: 'resource_id' },
    { name: 'Resource Name', key: 'name' },
    {
        name: 'labels', key: 'labels', type: 'list', options: { item: { view_type: 'badge' } },
    },
    { name: 'User ID', key: 'user_info.user_id' },
    { name: 'Name', key: 'user_info.name' },
    { name: 'Email', key: 'user_info.email' },
];

export const defaultAdminOptions = {
    fields: defaultAdminFields,
};

export const defaultAdminLayout = {
    type: 'table',
    options: defaultAdminOptions,
};

export class AdminFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>,
    action extends MemberListAction<any, any> = MemberListAction<parameter, resp>,
    > extends TabSearchTableFluentAPI<parameter, resp, initData, initSyncData, T, action> implements DynamicTableOptions {
    getAction = () => this.getSearchTableDefaultAction()
        .setIds(this.target.tableTS.selectState.selectItems.map(item => item[this.idField]));

    constructor(
        action: action,
        isShow: forceRefArg<boolean>,
        protected idField: string,
        protected target: BaseTableFluentAPI,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
        public options = defaultAdminOptions,
    ) {
        super(
            action,
            isShow,
            {
                striped: true,
                border: false,
                shadow: false,
                padding: false,
                multiSelect: false,
                selectable: false,
                ...initData,
            }, // sub api can't support only query
            initSyncData,
        );
        watch(() => this.target.tableTS.selectState.selectItems, async (selected, before) => {
            if (isShow.value && selected.length >= 1 && selected !== before) {
                await this.getData();
            }
        });
    }
}

export const defaultHistoryFields = [
    { name: 'Update By', key: 'updated_by' },
    { name: 'Key', key: 'key' },
    {
        name: 'Update At',
        key: 'updated_at',
        type: 'datetime',
        options: {
            source_type: 'timestamp',
            source_format: 'seconds',
        },
    },

];
export const defaultHistoryOptions = {
    fields: defaultHistoryFields,
    root_path: 'collection_info.update_history',
};

export const defaultHistoryLayout = {
    type: 'table',
    options: defaultHistoryOptions,
};

export class HistoryFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>,
    action extends GetDataAction<any, any> = GetDataAction<parameter, resp>,
    > extends TabSearchTableFluentAPI<parameter, resp, initData, initSyncData, T, action> implements DynamicTableOptions {
    getAction = () => this.getSearchTableDefaultAction()
        .setKeyPath('collection_info.update_history')
        .setId(this.resourceId.value);


    constructor(
        action: action,
        isShow: forceRefArg<boolean>,
        protected resourceId: forceRefArg<string>,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
        public options: any = defaultHistoryOptions,
    ) {
        super(
            action,
            isShow,
            {
                striped: true,
                border: false,
                shadow: false,
                padding: false,
                multiSelect: false,
                selectable: false,

                ...initData,
            }, // sub api can't support only query
            initSyncData,
        );

        onMounted(() => {
            watch(this.resourceId, async (id, preId) => {
                if (isShow.value && id && id !== preId) {
                    await this.getData();
                }
            });
        });
    }
}


export interface ACHandlerMeta {
    handlerClass: typeof baseAutocompleteHandler;
    args: any;
}

export const defaultACHandler: ACHandlerMeta = {
    handlerClass: QuerySearchTableACHandler,
    args: {
        keys: [],
        suggestKeys: [],
    },
};


export class QuerySearchTableFluentAPI<
    parameter = any,
    resp extends ListType<any> = ListType<any>,
    initData = any,
    initSyncData = any,
    T extends QuerySearchTableToolSet<initData, initSyncData> = QuerySearchTableToolSet<initData, initSyncData>,
    action extends QueryAPI<parameter, resp> = QueryAPI<parameter, resp>,
    > extends BaseTableFluentAPI<parameter, resp, initData, initSyncData, T, action> {
    constructor(
        action: action,
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
        acHandlerMeta: ACHandlerMeta = defaultACHandler,
    ) {
        super(action);
        this.tableTS = new QuerySearchTableToolSet(acHandlerMeta.handlerClass, acHandlerMeta.args, initData, initSyncData) as T;
        watch(this.tableTS.querySearch.tags, async (tags, preTags) => {
            if (tags !== preTags && this.action) {
                await this.getData();
            }
        });
    }

    getAction = () => {
        if (Array.isArray(this.tableTS.querySearch.tags.value)) {
            return this.getDefaultAction().setFilter(...this.tableTS.querySearch.tags.value);
        }
        return this.getDefaultAction();
    }

    resetAll = () => {
        this.defaultReset();
        this.tableTS.querySearch.state.searchText = '';
    };
}


export abstract class BaseTableAPI<
        initData = any,
        initSyncData = any,
        T extends ToolboxTableToolSet<initData, initSyncData> = ToolboxTableToolSet<initData, initSyncData>
    > extends getDataAPI {
    tableTS: T;

    vm: Vue;

    apiState: UnwrapRef<BaseApiState>


    protected constructor(
        url: readonlyRefArg<string>,
        only: readonlyRefArg<string[]> = [],
        extraParams: readonlyRefArg<any> = {},
        fixSearchQuery: SearchQueryType[] = [],
        transformHandler: transformHandlerType|null = null,
    ) {
        super();
        // @ts-ignore
        this.vm = getCurrentInstance();
        this.apiState = reactive({
            url,
            only,
            fixSearchQuery, // default fix query
            extraParams, // for api extra parameters
            transformHandler,
        });
        this.tableTS = new ToolboxTableToolSet<initData, initSyncData>() as T;
    }

    protected abstract paramQuery: Ref<ApiQuery>;

    // @ts-ignore
    protected requestData = async () => {
        const params = {
            query: this.paramQuery.value,
            ...this.apiState.extraParams,
        };
        const resp = await this.$http.post(this.apiState.url, params).then((response) => {
            let result = response;
            if (this.apiState.transformHandler) {
                try {
                    result = this.apiState.transformHandler(response);
                } catch (e) {
                    console.debug(e);
                }
            }
            return result;
        });
        return resp;
    };


    getData = async () => {
        this.tableTS.syncState.loading = true;
        this.tableTS.state.items = [];
        this.tableTS.syncState.selectIndex = [];
        try {
            const res = await this.requestData();
            this.tableTS.state.items = res.data.results;
            this.tableTS.setAllPage(res.data.total_count);
        } catch (e) {
            this.tableTS.state.items = [];
            this.tableTS.state.allPage = 1;
        }
        this.tableTS.syncState.loading = false;
    };

    protected defaultReset = () => {
        this.tableTS.state.allPage = 1;
        this.tableTS.state.items = [];
        this.tableTS.syncState.thisPage = 1;
        this.tableTS.syncState.selectIndex = [];
        this.tableTS.syncState.sortBy = '';
        this.tableTS.syncState.sortDesc = true;
    };

    resetAll = () => {
        this.defaultReset();
    }
}

export class SearchTableAPI<initData = any, initSyncData = any,
    T extends SearchTableToolSet<initData, initSyncData> = SearchTableToolSet<initData, initSyncData>> extends BaseTableAPI<initData, initSyncData, T> {
    constructor(
        url: readonlyRefArg<string>,
        only: readonlyRefArg<string[]> = [],
        extraParams: readonlyRefArg<any> = {},
        fixSearchQuery: SearchQueryType[] = [],
        initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
    ) {
        super(url, only, extraParams, fixSearchQuery);
        this.tableTS = new SearchTableToolSet(initData, initSyncData) as T;
    }

    protected paramQuery = computed(() => defaultQuery(
        (this.tableTS.syncState.thisPage as number), (this.tableTS.syncState.pageSize as number),
        this.tableTS.syncState.sortBy, this.tableTS.syncState.sortDesc, this.tableTS.searchText.value,
        // @ts-ignore
        this.apiState.fixSearchQuery, undefined, this.apiState.only,
    ));

    resetAll = () => {
        this.defaultReset();
        this.tableTS.searchText.value = '';
    }
}

interface DataSource {
    name: string;
    key: string;
    view_type?: string;
    view_option?: any;

}


export class TabSearchTableAPI<initData = any, initSyncData = any> extends SearchTableAPI<initData, initSyncData> {
    protected isShow: forceRefArg<boolean>;

    constructor(
        url: readonlyRefArg<string>,
        extraParams: forceRefArg<any>,
        fixSearchQuery: SearchQueryType[] = [],
        initData: initData = {} as initData, initSyncData: initSyncData = {} as initSyncData,
        public dataSource: DataSource[] = [],
        isShow: forceRefArg<boolean>,
    ) {
        super(
            url,
            undefined, // sub api can't support only query
            extraParams,
            fixSearchQuery,
        );
        this.tableTS = new SearchTableToolSet(initData, initSyncData);
        this.isShow = isShow;
        const params = computed(() => this.apiState.extraParams);
        onMounted(() => {
            watch([isShow, params], (origine, before) => {
                let show;
                let parm;
                let preShow;
                let preParm;
                if (origine) {
                    show = origine[0];
                    parm = origine[1];
                }
                if (before) {
                    preShow = before[0];
                    preParm = before[1];
                }

                if (show && parm && (show !== preShow || parm !== preParm)) {
                    this.getData();
                }
            });
        });
    }
}

export class AdminTableAPI<initData, initSyncData> extends TabSearchTableAPI<initData, initSyncData> {
    constructor(
        url: readonlyRefArg<string>,
        extraParams: forceRefArg<any>,
        fixSearchQuery: SearchQueryType[] = [],
        initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
        public dataSource: DataSource[] = defaultAdminFields,
        isShow: forceRefArg<boolean>,
    ) {
        super(url, extraParams, fixSearchQuery, initData, initSyncData, dataSource, isShow);
    }
}

export const MockAdminTableAPI = () => new AdminTableAPI('', computed(() => ({})), [], undefined, undefined, [], computed(() => false));

export class SubDataAPI<initData = any, initSyncData = any> extends SearchTableAPI<initData, initSyncData> {
    // @ts-ignore
    constructor(
        url: readonlyRefArg<string>,
        idKey: string,
        private keyPath: readonlyRefArg<string>,
        private id: readonlyRefArg<string>,
        initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
    ) {
        super(url, undefined, undefined, undefined, initData, initSyncData);
        this.apiState.extraParams = computed(() => ({
            key_path: isRef(this.keyPath) ? this.keyPath.value : this.keyPath,
            [idKey]: isRef(this.id) ? this.id.value : this.id,
        }));
    }
}


export class HistoryAPI<initData = any, initSyncData = any> extends TabSearchTableAPI<initData, initSyncData> {
    // @ts-ignore
    constructor(
        url: readonlyRefArg<string>,
        idKey: string,
        private id: readonlyRefArg<cnaRefArgs<string>>,
        initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
        public dataSource: DataSource[] = defaultHistoryFields,
        isShow: forceRefArg<boolean>,
    ) {
        super(url, computed(() => ({})), undefined, initData, initSyncData, dataSource, isShow);
        this.apiState.extraParams = computed(() => ({
            key_path: 'collection_info.update_history',
            [idKey]: isRef(this.id) ? this.id.value : this.id,
        }));
    }
}


export class QuerySearchTableAPI<initData = any, initSyncData = any,
    T extends QuerySearchTableToolSet<initData, initSyncData> = QuerySearchTableToolSet<initData, initSyncData>> extends BaseTableAPI<initData, initSyncData, T> {
    constructor(
        url: string, only?: string[], extraParams?: object, fixSearchQuery: SearchQueryType[] = [],
        initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
        acHandlerMeta: ACHandlerMeta = defaultACHandler,
    ) {
        super(url, only, extraParams, fixSearchQuery);
        this.tableTS = new QuerySearchTableToolSet(acHandlerMeta.handlerClass, acHandlerMeta.args, initData, initSyncData) as T;
        watch(this.tableTS.querySearch.tags, (tags, preTags) => {
            if (tags !== preTags) {
                this.getData();
            }
        });
    }

    protected queryTags: Ref<readonly SearchQueryType[]> = computed(() => {
        // @ts-ignore
        const fix = (this.apiState.fixSearchQuery as SearchQueryType[]);
        const sq: SearchQueryType[] = this.tableTS.querySearch.tags.value;
        return [...fix, ...sq];
    });

    protected paramQuery = computed(() => defaultQuery(
        (this.tableTS.syncState.thisPage as number), (this.tableTS.syncState.pageSize as number),
        this.tableTS.syncState.sortBy, this.tableTS.syncState.sortDesc, undefined,
        this.queryTags.value, undefined, this.apiState.only,
    ));


    resetAll = () => {
        this.defaultReset();
        this.tableTS.querySearch.state.searchText = '';
    };
}

// export class TabQuerySearchTableAPI<initData = any, initSyncData = any,
//     T extends QuerySearchTableToolSet<initData, initSyncData> = QuerySearchTableToolSet<initData, initSyncData>> extends QuerySearchTableAPI<initData, initSyncData> {
//     public constructor(
//         url: string, only?: string[], extraParams?: object, fixSearchQuery: SearchQueryType[] = [],
//         initData: initData = <initData>{}, initSyncData: initSyncData = <initSyncData>{},
//         acHandlerMeta: ACHandlerMeta = defaultACHandler,
//         isShow: forceRefArg<boolean>,
//     ) {
//         super(url, only, extraParams, fixSearchQuery, initData, initSyncData, acHandlerMeta);
//         this.isShow = isShow;
//         onMounted(() => {
//             watch([isShow], (origin, before) => {
//                 let show;
//                 let preShow;
//                 if (origin) {
//                     show = origin[0];
//                 }
//                 if (before) {
//                     preShow = before[0];
//                 }
//                 if (show && (show !== preShow)) {
//                     this.getData();
//                 }
//             });
//         });
//     }
// }
