(function() {
    var count = 0,
        countMax = 10,
        intervalStep = 100,
        interval = intervalStep,

        nodeIdPrefix = '_no-clickjacking-',
        nodeIdCount = 0,
        strikes = {};

    var main = function () {
        if (window.top === window) {
            detactAndClear();
        }
    }

    var log = function() {
        return;
        console.log.apply(console, arguments);
    }

    var detactAndClear = function () {
        var transparentNodeIds = detectTransparents();
        transparentNodeIds.length > 0 && hideTransparentNodes(transparentNodeIds);

        detectAgain();
    }

    var detectAgain = function () {
        if (count < countMax) {
            count++;
            interval += count * intervalStep;
            window.setTimeout(detactAndClear, interval);
        } else {
            log('stopped');
        }
    }

    var detectTransparents = function () {
        var iframes = document.getElementsByTagName('iframe'),
            transparentNodeIds = [];

        for (var i in iframes) {
            var iframe = iframes[i],
                node = iframe,
                style = null,
                nodeId = null;
            
            while (node) {
                style = getComputedStyle(node);

                if (style && parseFloat('0' + style.opacity) < 0.1) {
                    log('found', node, iframe);

                    // reset interval to check as fast as possible
                    interval = intervalStep;
                    count = 0;

                    // give each node an id
                    nodeId = node.id;
                    if (!nodeId) {
                        nodeId = nodeIdPrefix + nodeIdCount;
                        nodeIdCount++;
                        node.id = nodeId;
                    }
                    transparentNodeIds.push(nodeId);
                }

                node = node.parentNode;
            }
        }
        return transparentNodeIds;
    }

    var hideTransparentNodes = function (transparentNodeIds) {
        var css = '';
        transparentNodeIds.forEach(function (nodeId) {
            var node = document.getElementById(nodeId);

            if (strikes[nodeId] === undefined) {
                // first strike
                strikes[nodeId] = 1;
            } else {
                // hmm, subsequent strike... something is fishy
                strikes[nodeId]++;
            }

            if (strikes[nodeId] > 3) {
                node.parentNode.removeChild(node);
                log('too many strikes, removed', nodeId);
                console.log('[ClickJackBlocker] remove an iframe');
            } else {
                css += '#' + nodeId + '{display:none !important}';
                node.style.display = 'none';
                console.log('[ClickJackBlocker] hide an iframe');
            }
        });

        if (css.length > 0) {
            var style = document.createElement('style');
            style.innerText = css;
            document.getElementsByTagName('head')[0].appendChild(style);
        }
    }

    main();
})();