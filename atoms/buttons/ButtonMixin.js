export default {
    events: ['click'],
    props: {
        forceClass: {
            type: Array,
            default: null,
        },
        /** @type {string} */
        href: {
            type: String,
            default: null,
        },
        /** @type {boolean} */
        disabled: {
            type: Boolean,
            default: false,
        },
        /** @type {boolean} */
        outline: {
            type: Boolean,
            default: false,
        },
        /** @type {string} */
        styleType: {
            type: String,
            default: null,
            validator(value) {
                return [
                    null,
                    'primary',
                    'secondary',
                    'success',
                    'danger',
                    'warning',
                    'info',
                    'light',
                    'dark',
                ].indexOf(value) !== -1;
            },
        },
        /** @type {boolean} */
        link: {
            type: Boolean,
            default: false,
        },
        /** @type {boolean} */
        block: {
            type: Boolean,
            default: false,
        },
        /** @type {string} */
        size: {
            type: String,
            default: null,
            validator(value) {
                return [
                    null,
                    'sm',
                    'lg',
                ].indexOf(value) !== -1;
            },
        },
        /** @type {string} */
        shape: {
            type: String,
            default: null,
            validator(value) {
                return [
                    null,
                    'circle',
                ].indexOf(value) !== -1;
            },
        },
    },
};
