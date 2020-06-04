import {
    HelperToolSet,
    initReactive, optionalType, StateToolSet, SyncStateToolSet,
} from '@/lib/toolset';
import { ListType, QueryAPI } from '@/lib/fluent-api';
import { getArrayQueryString, pushRouterQuery, RouterAPIToolsetInterface } from '@/lib/router-query-string';
import { Ref, ref, watch } from '@vue/composition-api';
import Vue from 'vue';
import { ComponentInstance } from '@vue/composition-api/dist/component';
import _ from 'lodash';
import { isNotEmpty } from '@/lib/util';
import {
    ACHandlerMeta, defaultACHandler, DefaultQSGridQSPropsName, QuerySearchGridFluentAPI,
} from '@/lib/api/grid';

export const gridLayoutProps = {
    cardMinWidth: {
        type: String,
        default: '12rem',
    },
    cardMaxWidth: {
        type: String,
        default: '1fr',
    },
    cardHeight: {
        type: String,
        default: '20rem',
    },
    rowGap: {
        type: String,
        default: '1rem',
    },
    fixColumn: {
        type: Number,
        default: null,
    },
    columnGap: {
        type: String,
        default: '1rem',
    },
    cardClass: {
        type: Function,
        default: () => ['card-item'],
    },
    cardStyle: {
        type: Function,
        default: () => ({}),
    },
    items: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    selectItem: {
        type: String,
        default: '',
    },
};
export interface GridLayoutPropsType {
    items?: any[];
    cardMinWidth?: string;
    cardMaxWidth?: string;
    cardHeight?: string;
    rowGap?: string;
    fixColumn?: number;
    columnGap?: string;
    cardClass?: (...args: any[]) => any;
    cardStyle?: (...args: any[]) => any;
}


export interface GridLayoutStateType extends GridLayoutPropsType{
    items: any[];
    cardMinWidth: string;
    cardHeight: string;
    columnGap: string;
}
export interface GridLayoutSyncStateType {
   loading: boolean;
}

@StateToolSet<GridLayoutStateType>()
@SyncStateToolSet<GridLayoutSyncStateType>()
export class GridLayoutState<
    initData=any,
    initSyncData=any,
    initState extends GridLayoutStateType=GridLayoutStateType,
    initSyncState extends GridLayoutSyncStateType=GridLayoutSyncStateType,
    > {
    state: optionalType<initState, initData>;

    syncState: optionalType<initSyncState, initSyncData>;


    static initState() {
        return {
            items: [],
            cardMinWidth: '12rem',
            cardHeight: '12rem',
            columnGap: '1rem',
            cardClass: () => ['card-item'],
        };
    }


    static initSyncState() {
        return {
            loading: false,
        };
    }


    constructor(initData: initData = {} as initData, initSyncData: initSyncData = {}as initSyncData, lazy = false) {
        this.state = initReactive(lazy, GridLayoutState.initState(), initData);
        this.syncState = initReactive(lazy, GridLayoutState.initSyncState(), initSyncData);
    }
}

export interface SelectGridQSNameType {
    select: string;
}

export const makeSelectGridQSProps = (names: SelectGridQSNameType) => ({
    [names.select]: {
        type: String,
        default: null,
    },
});

export enum DefaultSingleItemSelectGridQSPropsName {
    select = 'st'
}

export enum DefaultMultiItemSelectGridQSPropsName {
    select = 'mt'
}

export const DefaultSingleItemSelectGridQSProps = makeSelectGridQSProps(DefaultSingleItemSelectGridQSPropsName);
export const DefaultMultiItemSelectGridQSProps = makeSelectGridQSProps(DefaultMultiItemSelectGridQSPropsName);

@HelperToolSet()
export class SelectGridLayoutToolSet<initData, initSyncData>
    extends GridLayoutState<initData, initSyncData>
    implements RouterAPIToolsetInterface {
    // eslint-disable-next-line no-empty-function
    routerPush = async () => {}

    applyDisplayRouter =(...args: any[]) => {};


    static initToolSet(_this: SelectGridLayoutToolSet<any, any>) {
        _this.routerPush = async () => {
            const query = {
                ..._this.vm.$route.query,
                [_this.qsName.select]: _this.select.value,
            };
            if (!_this.isShow.value) {
                delete query[_this.qsName.select];
            }
            await pushRouterQuery(_this.vm, query);
        };
        _this.applyDisplayRouter = (props: any) => {
            const selectItems = props[_this.qsName.select];
            if (isNotEmpty(selectItems)) {
                _this.select.value = selectItems;
            }
        };
        watch( _this.select, async (aft, bef) => {
            console.debug(aft);
            if (aft !== bef) {
                await _this.routerPush();
            }
        });
        watch(_this.isShow, async (aft, bef) => {
            if (aft !== bef) {
                await _this.routerPush();
            }
        });
    }


    constructor(
        public vm: Vue|ComponentInstance,
        public qsName: SelectGridQSNameType = DefaultSingleItemSelectGridQSPropsName,
        public isShow: Ref<boolean> = ref(true),
        public select: Ref<string> = ref(''),
        initData: initData = {} as initData,
        initSyncData: initSyncData = {} as initSyncData,
    ) {
        super(initData, initSyncData);
        SelectGridLayoutToolSet.initToolSet(this);
    }
}
