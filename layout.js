var $ = require('/libs/jquery');

module.exports = init;

function init (config, ready) {
    var self = this;
    var pageName = '_page_' + self._name;

    self._conf = {
        title: "",
        locale: null
    };

    config = $.extend(self._conf, config);

    // locale stuff
    self.locale = {};
    function verifyDeps() {

        if (typeof $ === "undefined") {
            throw new Error("jQuery is required for layout module");
        }

        if (config.locale && typeof $.cookie === "undefined") {
            throw new Error("jQuery cookie library is required when using locale");
        }
    }

    verifyDeps();

    /**
     * locale.set
     * Sets the locale value (in cookie and in Z._i18n)
     *
     * @name set
     * @function
     * @param {Object} ev Event object
     * @param {Object|String} data An object containing the following fields:
     *  - i18n (or locale or value): the locale value
     *  - cookie (optional): the cookie that should be set
     * If it's a string, it will represent the locale value.
     * @return {String} The locale that was set.
     */
    self.locale.set = function (ev, data) {
        var locale = data.i18n || data.locale || data.value || data;
        var cookie = data.cookie || config.locale.cookie;

        // If the locale doesn't match this regular
        // expression, set the default language
        if (!config.locale.possible.test(locale)) {
            locale = config.locale.value;
        }

        // Update cookie and Z._i18n
        if (data.setCookie !== false) {
            $.cookie(cookie, locale);
        }

        Z._i18n = locale;

        // Emit the event
        if (data.emitEvent !== false) {
            self.emit("localeSet", null, {
                locale: locale,
                cookie: cookie,
                i18n: locale
            });
        }

        return locale;
    };

    /**
     * get
     * Callbacks, emits via an event, and returns the locale value.
     *
     * @name get
     * @function
     * @param {Object} ev Event object
     * @param {Object|undefined} data An object containing the following fields:
     *  - cookie (optional): the cookie value
     *  - callback: if provided, the function will be called with an err and locale value
     * @return {String} The locale that is set.
     */
    self.locale.get = function (ev, data) {
        var cookie = data && data.cookie || config.locale.cookie;

        if (typeof ev === "function") { data = { callback: ev }; }
        if (typeof data === "function") { data = { callback: data }; }

        var localeVal = $.cookie(cookie);

        // If the locale doesn't match this regular
        // expression, set the default language
        if (!config.locale.possible.test(localeVal)) {
            localeVal = self.locale.set(null, {
                locale: localeVal,
                emitEvent: false
            });
        }

        // Callback, emit and reutrn locale
        data && typeof data.callback === "function" && data.callback(null, localeVal);
        self.emit("localeGet", null, {
            i18n: localeVal
        });

        return localeVal;
    };

    // Handle locale settings
    if (config.locale) {

        if (typeof config.locale === "string") {
            config.locale = {
                value: config.locale
            };
        }

        // Add defaults
        config.locale.cookie = config.locale.cookie || "_loc";
        config.locale.possible = config.locale.possible || /.*/;

        if (typeof config.locale.possible === "string") {
            config.locale.possible = new RegExp(config.locale.possible);
        }

        if (typeof config.locale.value !== "string") {
            throw new Error("config.locale.value shoud be a string.");
        }

        if (typeof config.locale.cookie !== "string") {
            throw new Error("config.locale.cookie shoud be a string.");
        }

        // Prevent locale overriding
        var cLoc = self.locale.get();
        self.locale.set(null, {
            value: cLoc || config.locale.value,
            cookie: config.locale.cookie,
            setCookie: config.locale.value === cLoc || !cLoc,
            emitEvent: false
        });
    }


    // set document title
    if (config.title) {
        self.title = config.title;
        document.title = config.title;
    }

    // attach state handler to instance
    self.page = page;
    self.transition = transition;
    self.render = render;
    self.fetch = fetch;
    self.$jq = $jq;
    self.state = state;

    // state handler to handle css in pages
    self.pageSelector = '.' + pageName;

    // render views
    if (self._renderOrder) {
        for (var i = 0; i < self._renderOrder.length; ++i) {
            self.view[self._renderOrder[i]].render([{page: pageName}]);
        }
    }

    // get pages dom refs
    self.pages = $(self.pageSelector);

    // hide all pages in init state
    self.pages.hide();

    // handle not found
    if ((self.notFound = $(config.notFound))) {
        self.on('route', notFoundHandler);
    }

    ready();
}

function page (state, data) {
    var self = this;
    var target = data.show;
    var options = data.options;

    // return when no target page is given
    if (!target) {
        return;
    }

    // state found
    self._state = true;

    options = options || {};

    // hide not found
    if (self.notFound) {
        self.notFound.hide();
    }

    // set document title
    if (self.title) {
        document.title = self.title;
    }

    self.pages.hide();

    var targetPage = $(target);

    // animate page transition
    if (options.animate) {
        animate.call(self, targetPage, options.animate);

    // show requested page
    } else {
        targetPage.show();
    }
}

// TODO: implement animations
function transition (state, data) {

    if (!data) {
        return;
    }

    data.hide && $(data.hide).hide();
    data.show && $(data.show).show();
}

// THIS IS JUST AN IDEA..
function state (event, data, callback) {
    var self = this;

    console.log(event);
    console.log(data);

    callback();

    //self.view[data.view].state(data.state);
}

function fetch (event, data, callback) {
    var self = this;
    var model = data.model;
    var query = data.query;
    data = data.data;

    if (!model || !query) {
        return callback('No model or query.');
    }

    if (!self.model || !self.model[model]) {
        return callback('Model not found.');
    }

    self.model[model].req(query, data, function (err, data) {

        if (err) {
            return callback(err);
        }

        // emit callback event
        callback(null, {data: data});
    });
}

// render data to a view
function render (event, data, callback) {
    var self = this;
    var view = data.view;
    data = data.data;

    if (!self.view || !self.view[view] || !data) {
        return callback('View "' + view + '" don\'t exists.' );
    }

    // TODO Handle pages on manual rendering
    // data.item && (data.item.page = '_page_' + self._name);

    // push a single item to an array
    if (!(data instanceof Array)) {
        data = [data];
    }

    // render data
    self.view[view].render(data);

    // emit callback event
    callback(null, self.view[view]);
}

// mainpulate dom with jquery
function $jq (event, data, callback) {
    var self = this;
    var selector = data.selector;

    // call jquery function
    if ($.fn[data.method]) {

        // get selector dom ref
        if (typeof selector === 'string') {

            // get selector
            switch (selector) {
                case 'cur':
                    selector = event.currentTarget;
                    break;
                case 'src':
                    selector = event.srcElement;
                    break;
                case 'all':
                    selector = event.elms;
                    break;
            }
        }

        // get scope dom ref
        if (typeof data.scope === 'string') {
            data.scope = document.querySelector(data.scope);
        }

        // call method
        selector = $(selector, data.scope || event._scope);

        selector[data.method].apply(selector, data.args);

        return callback();
    }

    callback('jQuery method "' + method + '" doesn\'t exists.');
}

function notFoundHandler (state) {
    var self = this;

    if (self._url === state.url) {
        return;
    }

    if (!self._state) {
        self.pages.hide();
        self.notFound.show();
    }

    self._state = false;
}
