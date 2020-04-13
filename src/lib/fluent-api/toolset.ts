/* eslint-disable camelcase, @typescript-eslint/no-explicit-any */
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import { api } from '@/lib/api/axios';
import {
    ApiMethods,
    FilterType,
    Query,
    FilterItem,
    ShortFilterType, GetActionState, RawParameterActionState, QueryApiState, StatQueryApiState, StatQuery,
} from '@/lib/fluent-api/type';
import { isNotEmpty } from '@/lib/util';


export abstract class ActionAPI<parameter=any, resp=any> {
    protected abstract path: string;

    protected method: ApiMethods = 'post';

    protected baseUrl: string;

    protected apiState: any;

    protected transformer: ((resp) => any|Promise<any>)|null;

    public abstract getParameter: () => parameter

    async execute(): Promise<AxiosResponse<resp>|any> {
        let resp: AxiosResponse<resp> | any;
        if (this.method === 'get') {
            resp = await api.instance[this.method](this.url);
        } else {
            resp = await api.instance[this.method as string](this.url, this.getParameter());
        }
        if (this.transformer) {
            resp = await this.transformer(resp);
        }
        return resp;
    }

    protected constructor(
        baseUrl: string,
        apiState?: any,
        transformer: ((any) => any|Promise<any>)|null = null,
    ) {
        this.baseUrl = baseUrl;
        this.apiState = apiState || {} as any;
        this.transformer = transformer;
    }

    setTransformer(func: (resp: AxiosResponse<resp>) => any|Promise<any>): this {
        this.transformer = func;
        return this.clone();
    }


    get url(): string {
        return this.baseUrl + this.path;
    }

    debug(...states: string[]): void {
        console.debug('*********************');
        console.debug('url : ', this.url);
        console.debug('method : ', this.method);
        console.debug('state : ', this.apiState);
        if (states) {
            states.forEach(((key) => {
                console.debug(`state.${key} : ${JSON.stringify(this.apiState[key])}`);
            }));
        }
        console.debug('*********************');
    }

    clone(): this {
        // @ts-ignore
        return new this.constructor(this.baseUrl, this.apiState, this.transformer);
    }
}
export const OPERATOR_MAP = Object.freeze({
    '': 'contain_in', // merge operator
    '!': 'not_contain', // merge operator
    '>': 'gt',
    '>=': 'gte',
    '<': 'lt',
    '<=': 'lte',
    '=': 'in', // merge operator
    '!=': 'not_in', // merge operator
    $: 'regex',
});
const MERGE_OPERATOR_SET = new Set(['contain_in', 'not_contain_in', 'in', 'not_in']);

type MergeQueryType = {[k: string]: ShortFilterType};

const mergeQuery = (targetQuery: MergeQueryType, q: FilterItem, op: string): void => {
    const prefix = `${q.key}:${op}`;
    const vals = Array.isArray(q.value) ? q.value : [q.value];
    if (targetQuery[prefix]) {
        targetQuery[prefix].v = _.merge(targetQuery[prefix].v, vals);
    } else {
        targetQuery[prefix] = {
            k: q.key,
            v: vals,
            o: op,
        };
    }
};

export const filterItemToQuery = (filters: FilterItem[], fixedFilters: FilterItem[] = []): FilterType[] | undefined => {
    const filter: FilterType[] = [];

    const mergeOpQuery: MergeQueryType = {};
    const rawFilters: FilterItem[] = [...fixedFilters, ...filters];

    rawFilters.forEach((q: FilterItem) => {
        const op = OPERATOR_MAP[q.operator];

        if (MERGE_OPERATOR_SET.has(op)) {
            mergeQuery(mergeOpQuery, q, op);
        } else {
            filter.push({ k: q.key, v: q.value, o: op });
        }
    });

    if (filter.length > 0 || !_.isEmpty(mergeOpQuery)) {
        return [...filter, ...Object.values(mergeOpQuery)];
    }
    return undefined;
};

function getQueryWithApiState<T>(keys: string[], apiState: any): T {
    const res: T = {} as T;
    keys.forEach((k) => {
        if (apiState[k]) res[k] = apiState[k];
    });
    return res;
}

export abstract class QueryAPI<parameter, resp> extends ActionAPI<parameter, resp> {
    protected apiState: QueryApiState<parameter> ;

    constructor(
        baseUrl: string,
        initState: QueryApiState<parameter> = {} as unknown as QueryApiState<parameter>,
        transformer: null|((any) => any) = null,
    ) {
        super(baseUrl, undefined, transformer);
        this.apiState = {
            filter: [] as unknown as FilterItem[],
            fixFilter: [] as unknown as FilterItem[],
            only: [] as unknown as string[],
            thisPage: 1,
            pageSize: 15,
            sortBy: '',
            sortDesc: true,
            keyword: '',
            extraParameter: {},
            count_only: false,
            ...initState,
        };
    }

    protected query = (): Query => {
        const query: Query = {};
        if (this.apiState.thisPage !== 0) {
            query.page = {
                start: ((this.apiState.thisPage - 1) * this.apiState.pageSize) + 1,
                limit: this.apiState.pageSize,
            };
        }
        if (this.apiState.sortBy) {
            query.sort = {
                key: this.apiState.sortBy,
                desc: this.apiState.sortDesc,
            };
        }
        if (this.apiState.only.length > 0) {
            query.only = this.apiState.only;
        }
        if (this.apiState.count_only) {
            query.count_only = this.apiState.count_only;
        }
        if (this.apiState.keyword) {
            query.keyword = this.apiState.keyword;
        }
        if (this.apiState.filter.length > 0 || this.apiState.fixFilter.length > 0) {
            const newFilter: FilterType[] | undefined = filterItemToQuery(this.apiState.filter, this.apiState.fixFilter);
            if (newFilter) query.filter = newFilter;
        }
        return query as Query;
    };


    getParameter = (): {query: Query} & parameter => ({
        query: this.query(),
        ...this.apiState.extraParameter,
    });

    setOnly(...args: string[]): this {
        this.apiState.only = args;
        return this.clone();
    }

    setCountOnly(value = true): this {
        this.apiState.count_only = value;
        return this.clone();
    }

    setFilter(...args: FilterItem[]): this {
        this.apiState.filter = args;
        return this.clone();
    }

    setFixFilter(...args: FilterItem[]): this {
        this.apiState.fixFilter = args;
        return this.clone();
    }

    setThisPage(thisPage: number): this {
        this.apiState.thisPage = thisPage;
        return this.clone();
    }

    setPageSize(pageSize: number): this {
        this.apiState.pageSize = pageSize;
        return this.clone();
    }

    setSortBy(sortBy: string): this {
        this.apiState.sortBy = sortBy;
        return this.clone();
    }

    setSortDesc(sortDesc: boolean): this {
        this.apiState.sortDesc = sortDesc;
        return this.clone();
    }

    setKeyword(keyword: string): this {
        this.apiState.keyword = keyword;
        return this.clone();
    }
}


export abstract class StatisticsQueryAPI<parameter, resp> extends ActionAPI<parameter, resp> {
    protected apiState: StatQueryApiState<parameter>;

    constructor(
        baseUrl: string,
        initState: StatQueryApiState<parameter> = {} as StatQueryApiState<parameter>,
        transformer: null|((any) => any) = null,
    ) {
        super(baseUrl, undefined, transformer);
        this.apiState = {
            filter: [],
            limit: undefined,
            start: undefined,
            end: undefined,
            aggregate: [],
            merge: [],
            extraParameter: {} as parameter,
            ...initState,
        };
    }

    protected query = (): StatQuery => {
        const query: StatQuery = getQueryWithApiState<StatQuery>(['limit', 'start', 'end', 'aggregate', 'merge'], this.apiState);
        if (isNotEmpty(this.apiState.filter)) {
            const newFilter = filterItemToQuery(this.apiState.filter || []);
            if (newFilter) query.filter = newFilter;
        }
        return query as StatQuery;
    };

    getParameter = (): {query: StatQuery} & parameter => ({
        query: this.query(),
        ...this.apiState.extraParameter as parameter,
    });

    setFilter(...args: FilterItem[]): this {
        this.apiState.filter = args;
        return this.clone();
    }

    setAggregate(...args: Array<string|undefined>): this {
        this.apiState.aggregate = args;
        return this.clone();
    }

    setMerge(...args: Array<string|undefined>): this {
        this.apiState.merge = args;
        return this.clone();
    }

    setLimit(limit: number|undefined): this {
        this.apiState.limit = limit;
        return this.clone();
    }

    setStart(start: string|undefined): this {
        this.apiState.start = start;
        return this.clone();
    }

    setEnd(end: string|undefined): this {
        this.apiState.end = end;
        return this.clone();
    }
}

interface SingleItemActionInterface{
    setId: (id: string) => any;
}
export abstract class RawParameterAction<parameter, resp> extends ActionAPI<parameter, resp> {
    getParameter = (): parameter => this.apiState.parameter;

    protected apiState: RawParameterActionState<parameter>;

    constructor(
        baseUrl: string,
        initState: RawParameterActionState<parameter> = { parameter: {} as parameter },
        transformer: ((any) => any|Promise<any>)|null = null,
    ) {
        super(baseUrl, initState, transformer);
        this.apiState = {
            ...initState,
        };
    }
}

export abstract class SetParameterAction<parameter, resp> extends RawParameterAction<parameter, resp> {
    setParameter(parameter: parameter): this {
        this.apiState.parameter = parameter;
        return this.clone();
    }
}

export abstract class CreateAction<parameter, resp> extends SetParameterAction<parameter, resp> {
    protected path = 'create'
}

export abstract class UpdateAction<parameter, resp> extends SetParameterAction<parameter, resp> {
    protected path = 'update'
}

export abstract class SingleItemAction<parameter, resp> extends RawParameterAction<parameter, resp> implements SingleItemActionInterface {
    protected abstract idField: string;


    setId(id: string): this {
        this.apiState.parameter[this.idField] = id;
        return this.clone();
    }
}

interface TreeActionState<parameter = any> {
    rootItemType: string;
    item_id: string;
    item_type: string;
    sortBy: string;
    sortDesc: boolean;
    extraParameter: parameter;
    exclude_type: string;
}

export abstract class TreeAction<parameter, resp> extends ActionAPI<parameter, resp> {
    protected path = 'tree';

    protected apiState: TreeActionState<parameter>;

    constructor(baseUrl: string, initState: TreeActionState<parameter> = {} as unknown as TreeActionState<parameter>, transformer: null|((any) => any) = null) {
        super(baseUrl, undefined, transformer);
        this.apiState = {
            rootItemType: 'ROOT',
            item_id: '',
            item_type: '',
            sortBy: '',
            sortDesc: true,
            exclude_type: '',
            extraParameter: {},
            ...initState,
        };
    }

    setRootItemType(name = 'ROOT'): this {
        this.apiState.rootItemType = name;
        return this.clone();
    }

    setRoot(): this {
        this.apiState.item_type = this.apiState.rootItemType;
        this.apiState.item_id = '';
        return this.clone();
    }

    setItemType(val: string): this {
        this.apiState.item_type = val;
        return this.clone();
    }

    setItemId(val: string): this {
        this.apiState.item_id = val;
        return this.clone();
    }


    setSortBy(sortBy: string): this {
        this.apiState.sortBy = sortBy;
        return this.clone();
    }

    setSortDesc(sortDesc: boolean): this {
        this.apiState.sortDesc = sortDesc;
        return this.clone();
    }

    protected setExcludeType(val: string): this {
        this.apiState.exclude_type = val;
        return this.clone();
    }

    getParameter = (): parameter & any => {
        const params: any = {};

        if (this.apiState.item_type) {
            params.item_type = this.apiState.item_type;
            if (this.apiState.item_id) {
                params.item_id = this.apiState.item_id;
            }
        }

        if (this.apiState.sortBy) {
            params.sort = {
                key: this.apiState.sortBy,
                desc: this.apiState.sortDesc,
            };
        }

        if (this.apiState.exclude_type) {
            params.exclude_type = this.apiState.exclude_type;
        }

        return {
            ...params,
            ...this.apiState.extraParameter,
        };
    };
}
export abstract class GetAction<parameter, resp> extends SingleItemAction<parameter, resp> {
    protected path = 'get';

    protected apiState: GetActionState<parameter>;

    constructor(
        baseUrl: string,
        apiState: GetActionState<parameter> = {
            parameter: {} as parameter,
            only: [] as string[],
        },
        transformer: ((any) => any|Promise<any>)|null = null,
    ) {
        super(baseUrl, undefined, transformer);
        this.apiState = apiState;
    }

    getParameter = (): {query: Query} & parameter => {
        const query = { only: this.apiState.only };
        return {
            ...this.apiState.parameter,
            query,
        };
    };

    setOnly(...args: string[]): this {
        this.apiState.only = args;
        return this.clone();
    }

    getIdField(): string {
        return this.idField;
    }
}

export abstract class SingleDeleteAction<parameter, resp> extends SingleItemAction<parameter, resp> {
    protected path = 'delete';
}

export abstract class SingleEnableAction<parameter, resp> extends SingleItemAction<parameter, resp> {
    protected path = 'enable';
}

export abstract class SingleDisableAction<parameter, resp> extends SingleItemAction<parameter, resp> {
    protected path = 'disable';
}


// use when one source sub items add or delete ex) add group credential
export abstract class SubMultiItemAction<parameter, resp> extends SingleItemAction<parameter, resp> {
    protected abstract subIdsField: string;

    setSubIds(subIds: any[]): this {
        this.apiState.parameter[this.subIdsField] = subIds;
        return this.clone();
    }
}

export abstract class SubMultiItemAddAction<parameter, resp> extends SubMultiItemAction<parameter, resp> {
    protected path = 'add'
}

export abstract class SubMultiItemRemoveAction<parameter, resp> extends SubMultiItemAction<parameter, resp> {
    protected path = 'remove'
}


export abstract class MultiItemAction<parameter, resp> extends RawParameterAction<parameter, resp> {
    protected abstract idsField: string;

    setIds(ids: string[]): this {
        this.apiState.parameter[this.idsField] = ids;
        return this.clone();
    }
}
export abstract class MultiItemQueryAction<parameter, resp> extends QueryAPI<parameter, resp> {
    protected abstract idsField: string;

    setIds(ids: string[]): this {
        this.apiState.extraParameter[this.idsField] = ids;
        return this.clone();
    }
}

export abstract class MemberListAction<parameter, resp> extends MultiItemQueryAction<parameter, resp> {
    path = 'member/list'
}

export abstract class MultiEnableAction<parameter, resp> extends MultiItemAction<parameter, resp> {
    protected path = 'enable';
}
export abstract class MultiDisableAction<parameter, resp> extends MultiItemAction<parameter, resp> {
    protected path = 'disable';
}

export abstract class MultiDeleteAction<parameter, resp> extends MultiItemAction<parameter, resp> {
    protected path = 'delete';
}


export abstract class ListAction<parameter, resp> extends QueryAPI<parameter, resp> {
    protected path = 'list';
}

export abstract class GetDataAction<parameter, resp> extends QueryAPI<parameter, resp> implements SingleItemActionInterface {
    protected path = 'get-data';

    protected abstract idField: string;

    setId(id: string): this {
        this.apiState.extraParameter[this.idField] = id;
        return this.clone();
    }

    setKeyPath(keyPath: string): this {
        // @ts-ignore
        this.apiState.extraParameter.key_path = keyPath;
        return this.clone();
    }
}

export abstract class CollectAction<parameter, resp> extends SetParameterAction<parameter, resp> {
    protected path = 'collect';
}


export abstract class CountAction<parameter, resp> extends StatisticsQueryAPI<parameter, resp> {
    protected path = 'count';
}

export abstract class TrendsAction<parameter, resp> extends StatisticsQueryAPI<parameter, resp> {
    protected path = 'trends';
}

export abstract class DiffAction<parameter, resp> extends StatisticsQueryAPI<parameter, resp> {
    protected path = 'diff';
}
export type ResourceActions<actions extends string> = { [key in actions]: (...args: any[]) => ActionAPI};

export abstract class Resource {
    protected abstract name: string;

    get baseUrl(): string {
        return `/${this.service}/${this.name}/`;
    }

    constructor(protected service: string) {
    }
}

export type ServiceResources<resources extends string> = { [key in resources]?: (service: string) => Resource};

export abstract class Service {
    protected abstract name: string;
}

export interface BaseResources<parameter, resp> extends Resource, ResourceActions<'update'|'get'>{}

export interface DictResource<parameter, resp> extends Resource, ResourceActions<'update'|'get'> {
    update: () => UpdateAction<parameter, resp>;
    get: () => GetAction<parameter, resp>;
}
