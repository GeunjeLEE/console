export const loadAll = async ({ dispatch }): Promise<void|Error> => {
    await Promise.allSettled([
        dispatch('provider/load'),
        dispatch('project/load'),
        dispatch('serviceAccount/load'),
        dispatch('secret/load'),
        dispatch('collector/load'),
        dispatch('region/load'),
        dispatch('plugin/load'),
        dispatch('user/load'),
        dispatch('protocol/load'),
    ]);
};
