import { SpaceConnector } from '@spaceone/console-core-lib/space-connector';
import { ProjectResourceMap } from '@/store/modules/resource/project/type';
import ErrorHandler from '@/common/composables/error/errorHandler';
import { REFERENCE_LOAD_TTL } from '@/store/modules/resource/config';
import { Action } from 'vuex';
import { ResourceState } from '@/store/modules/resource/type';

let lastLoadedTime = 0;

export const load = async ({ state, commit }, lazyLoad = false): Promise<void|Error> => {
    const currentTime = new Date().getTime();

    if (
        (lastLoadedTime !== 0 && currentTime - lastLoadedTime < REFERENCE_LOAD_TTL)
        || (lazyLoad && Object.keys(state.items).length > 0)
    ) return;
    lastLoadedTime = currentTime;

    try {
        const response = await SpaceConnector.client.identity.project.list({
            query: {
                only: ['project_id', 'name', 'project_group_info'],
            },
        }, { timeout: 3000 });
        const projects: ProjectResourceMap = {};

        response.results.forEach((projectInfo: any): void => {
            const groupInfo = projectInfo.project_group_info;
            projects[projectInfo.project_id] = {
                label: `${groupInfo.name} > ${projectInfo.name}`,
                name: projectInfo.name,
                data: {
                    groupInfo: {
                        id: groupInfo.project_group_id,
                        name: groupInfo.name,
                    },
                },
            };
        });

        commit('setProjects', projects);
    } catch (e) {
        ErrorHandler.handleError(e);
    }
};

export const sync: Action<ResourceState, any> = ({ state, commit }, projectInfo): void => {
    const groupInfo = projectInfo.project_group_info;

    const projects: ProjectResourceMap = {
        ...state.items,
        [projectInfo.project_id]: {
            label: `${groupInfo.name} > ${projectInfo.name}`,
            name: projectInfo.name,
            icon: {
                groupInfo: {
                    id: groupInfo.project_group_id,
                    name: groupInfo.name,
                },
            },
        },
    };
    commit('setCollectors', projects);
};
