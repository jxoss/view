M.wrap('github/jillix/layout/v0.0.1/layout.js', function (require, module, exports) {

var View = require('github/jillix/view/v0.0.1/view');

function page (state, target, options) {
    
    // return when no target page is given
    if (!target) {
        return;
    }

    var self = this;
    var pages = $(self.mono.config.data.pages, self.view.template.dom);
    var targetPage = $(target);
    
    options = options || {};
    
    // load page modules
    if (options.modules) {
        for (var i = 0; i < options.modules.length; ++i) {
            M(options.modules[i]);
        }
    }

    // TODO plug a css3 animation library here
    // hide all pages
    pages.hide();
    // show requested page
    targetPage.show();
}

// animate page transitions
function animate (config) {

    if (options.animate) {
        // getting the in animation
        var inAnimation = options.animate.in === 'string' ? options.animate.in : (options.animate.in.effect || "fadeIn");
        var inDuration = options.animate.in.duration || "0s";
        var inDelay = options.animate.in.delay || "0s";

        // getting the current out animation
        var outAnimation = oldState.attr("active");
        var outDuration = oldState.attr("duration");
        var outDelay = oldState.attr("delay");

        oldState.removeAttr("active");
        oldState.removeAttr("duration");
        oldState.removeAttr("delay");

        // setting the future out animation
        if (!options.animate.outAnimation || options.animate.outAnimation === "none") {
            newState.attr("active", "fadeOut");
            newState.attr("duration", "0s");
            newState.attr("delay", "0s");
        } else {
            newState.attr("active", options.animate.outAnimation.effect);
            newState.attr("duration", options.animate.outAnimation.duration || ".5s");
            newState.attr("delay", options.animate.outAnimation.delay || "0s");
        }

        // hiding all elements
        $(self.mono.config.data.selector).hide();

        // there is no old state (the first time a page is loaded)
        if (oldState.length === 0) {
            newState.css("-webkit-animation-duration", inDuration);
            newState.css("-webkit-animation-delay", inDelay);
            newState.addClass("animated " + inAnimation);
            newState.show();
        } else {
            if (outDuration === "0s") {
                newState.removeClass("animated " + inAnimation + " " + outAnimation);
                newState.css("-webkit-animation-duration", inDuration);
                newState.css("-webkit-animation-delay", inDelay);
                newState.addClass("animated " + inAnimation);
                newState.show();
            } else {
                // out animation is done
                oldState.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                    oldState.hide();
                    oldState.removeClass("animated " + inAnimation + " " + outAnimation);
                    newState.css("-webkit-animation-duration", inDuration);
                    newState.css("-webkit-animation-delay", inDelay);
                    newState.addClass("animated " + inAnimation);
                    newState.show();
                });
                oldState.css("-webkit-animation-duration", outDuration);
                oldState.css("-webkit-animation-delay", outDelay);
                oldState.addClass("animated " + outAnimation);
                oldState.show();
            }
        }
    }
}

function init () {
    var self = this;
    
    config = self.mono.config.data;
    
    // set document title
    if (config.title) {
        document.title = config.title;
    }

    // state handler to handle css in pages
    self.page = page;
    
    // init view
    View(self).load(config.view, function (err, view) {
        
        if (err) {
            return console.log('[layout: ' + err.toString() + ']');
        }
        
        // check if template has dom
        if (!view.template || !view.template.dom) {
            return console.error('[layout: no dom available]');
        }
        
        // save view instance
        self.view = view;
        
        // render template
        view.template.render();
        
        // emit an empty state is the same like: state.emit(location.pathname);
        view.state.emit();
        self.emit('ready');
    });
}

module.exports = init;

return module;

});

