import { computed, reactive, Ref } from '@vue/composition-api';
import { TableState, tableProps, TablePropsType } from '@/components/molecules/tables/toolset';
import {
    HelperToolSet, initReactive, optionalType, StateToolSet, SyncStateToolSet,
} from '@/lib/toolset';
import _ from 'lodash';
import { Computed } from '@/lib/type';


export const dataTableProps = {
    ...tableProps,
    fields: Array,
    items: Array,
    sortable: {
        type: Boolean,
        default: false,
    },
    dragable: {
        type: Boolean,
        default: false,
    },
    rowClickMultiSelectMode: {
        type: Boolean,
        default: false,
    },
    selectable: {
        type: Boolean,
        default: false,
    },
    selectIndex: {
        type: [Array, Number],
        default: () => [],
    },
    sortBy: {
        type: String,
        default: null,
    },
    sortDesc: {
        type: Boolean,
        default: true,
    },
    colCopy: {
        type: Boolean,
        default: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    useSpinnerLoading: {
        type: Boolean,
        default: false,
    },
    useCursorLoading: {
        type: Boolean,
        default: false,
    },
    /**
     * @name multiSelect
     * @description When it's 'false', should NOT give value 'true' to 'dragable' prop.
     */
    multiSelect: {
        type: Boolean,
        default: true,
    },
};

export interface DataTablePropsType extends TablePropsType {
    fields?: any[];
    items?: any[];
    sortable?: boolean;
    dragable?: boolean;
    rowClickMultiSelectMode?: boolean;
    selectable?: boolean;
    colCopy?: boolean;
    useSpinnerLoading?: boolean;
    useCursorLoading?: boolean;
    multiSelect?: boolean;
}
export interface DataTableSyncType {
    sortBy: string;
    sortDesc: boolean;
    selectIndex: any[]|number;
    loading: boolean;
}
export interface DataTableSetupProps extends DataTablePropsType, DataTableSyncType{
    fields: any[];
    items: any[];
    sortable: boolean;
    dragable: boolean;
    rowClickMultiSelectMode: boolean;
    selectable: boolean;
    selectIndex: any[]|number;
    colCopy: boolean;
    loading: boolean;
    useSpinnerLoading: boolean;
    useCursorLoading: boolean;
    multiSelect: boolean;
    sortBy: string;
    sortDesc: boolean;
}

@StateToolSet<DataTablePropsType>()
@SyncStateToolSet<DataTableSyncType>()
export class DataTableState<
        initData,
        initSyncData,
        initState extends DataTablePropsType = DataTablePropsType,
        initSync extends DataTableSyncType= DataTableSyncType
    > extends TableState< initData, initState> {
    syncState: optionalType<initSync, initSyncData>;

    static initState() {
        return {
            ...TableState.initState(),
            fields: [],
            items: [],
            sortable: false,
            dragable: false,
            rowClickMultiSelectMode: false,
            selectable: false,

            colCopy: false,
            useSpinnerLoading: true,
            useCursorLoading: true,
            multiSelect: true,
        };
    }

    static initSyncState() {
        return {
            sortBy: '',
            sortDesc: true,
            selectIndex: [],
            loading: false,
        };
    }

    constructor(initData: initData = {} as initData, initSyncData: initSyncData = {} as initSyncData, lazy = false) {
        super(initData, true);
        this.state = initReactive<optionalType<initState, initData>>(lazy, DataTableState.initState(), initData);
        this.syncState = initReactive<optionalType<initSync, initSyncData>>(lazy, DataTableState.initSyncState(), initSyncData);
    }
}

export interface DataTableSelectState {
    isNotSelected: boolean;
    isSelectOne: boolean;
    isSelectMulti: boolean;
    selectItems: readonly any[];
    firstSelectItem: any;
}


export const initSelectState = (state: DataTablePropsType, syncState: DataTableSyncType): DataTableSelectState => {
    const isNotSelected: Ref<boolean> = computed(() => (syncState.selectIndex ? (syncState.selectIndex as Array<any>).length === 0 : true));
    const isSelectOne: Ref<boolean> = computed(() => (syncState.selectIndex ? (syncState.selectIndex as Array<any>).length === 1 : false));
    const isSelectMulti: Ref<boolean> = computed(() => (syncState.selectIndex ? (syncState.selectIndex as Array<any>).length > 1 : false));
    const selectItems: Ref<readonly any[]> = computed(() => (syncState.selectIndex ? (syncState.selectIndex as Array<any>).map(idx => (state.items as Array<any>)[idx]) : []));
    const firstSelectItem: Ref<any> = computed(() => (!isNotSelected.value ? (state.items as Array<any>)[(syncState.selectIndex as number[])[0]] : {}));
    return reactive({
        isNotSelected,
        isSelectOne,
        isSelectMulti,
        selectItems,
        firstSelectItem,
    });
};

export interface LinkState {
    link: string|undefined;
    openLink: () => void;
}

export const initLinkState = (selectState: DataTableSelectState): LinkState => {
    const link: Ref<string|undefined> = computed((): string|undefined => {
        if (selectState.isSelectOne) {
            return _.get(selectState.firstSelectItem, 'data.reference.link')
                || _.get(selectState.firstSelectItem, 'reference.external_link');
        }
        return undefined;
    });
    const openLink = () => {
        if (link.value) {
            window.open(link.value);
        }
    };
    return reactive({
        link,
        openLink,
    });
};

@HelperToolSet()
export class DataTableToolSet<initData, initSyncData> extends DataTableState< initData, initSyncData> {
    selectState: DataTableSelectState= null as unknown as DataTableSelectState;

    linkState: LinkState= null as unknown as LinkState;

    noLink: Computed<boolean> = null as unknown as Computed<boolean>;


    static initToolSet(_this: any) {
        _this.selectState = initSelectState(_this.state, _this.syncState);
        _this.linkState = initLinkState(_this.selectState);
        _this.noLink = computed(() => !_this.linkState.link);
    }

    constructor(initData: initData = {} as initData, initSyncData: initSyncData = {} as initSyncData) {
        super(initData, initSyncData);
        DataTableToolSet.initToolSet(this);
    }
}
