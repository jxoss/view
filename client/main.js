Z.wrap('github/ionicabizau/list/v0.0.1/client/main.js', function (require, module, exports) {

    var List = require("./list");
    var Ui = require("./ui");

    function init (config, ready) {
        var self = this;

        if (!self.view.layout) {
            throw new Error("A view named 'layout' is required.");
        }
        if (!self.view.item) {
            throw new Error("A view named 'item' is required.");
        }

        self.view.layout.render();

        self._conf = {
            "options": {
                "query": {},
                "options": {}
            },
            "model": "",
            "autoinit": true
        };

        config = $.extend(self._conf, config);

        var list = new List(self);
        var ui = new Ui(self);

        self.model = self.model[self._conf.model];
        if (!self.model) {
            throw new Error("Model is not loaded. Please load the model using the composition configuration");
        }

        if (self._conf.autoinit) {
            var req = config.options;
            list.read(req.query, req.options, function (err, data) {
                if (err) { return errorHandler(err); }
                ui.render(data);
                ready();
            });
        } else {
            // TODO
        }
    }

    module.exports = init;

    return module;
});
