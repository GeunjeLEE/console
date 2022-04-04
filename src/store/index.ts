import Vue from 'vue';
import Vuex from 'vuex';
import user from './modules/user';
import settings from './modules/settings';
import favorite from './modules/favorite';
import domain from './modules/domain';
import reference from './modules/reference';
import display from './modules/display';
import file from './modules/file';
import service from './modules/service';
import plugins from './plugins';
import error from './modules/error';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        user,
        settings,
        domain,
        favorite,
        reference,
        display,
        file,
        service,
        error,
    },
    plugins,
});

export { store };
