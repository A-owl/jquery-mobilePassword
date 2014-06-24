/*
 * Mobile password input
 *
 * @author          Marvelous Owl
 * @copyright       Copyright (c) 2014 Marvelousowl.com
 * @license         Licensed under the MIT and GPL licenses.
 * @link            http://www.marvelousowl.com
 * @github          http://github.com/marvelousowl
 * @version         1.0
 *
 */
;
(function ($) {
    var defaults = {
        checkInterval: 200, //set timeout to check whether all the characters are the same
        transDelay   : 200, //delay to transform last letter
        character    : '%u25CF', //instead of the character
        callback     : null
    };

    /**
     * The actual plugin constructor
     * @param $elem
     * @param options
     * @constructor
     */
    function Password($elem, options) {
        this.$elem = $elem;
        this.options = options;
        this.transTimeout = null;
        this.checkTimeout = null;
        this.init();
        return this;
    }

    /**
     * Initialization
     */
    Password.prototype.init = function () {
        var that = this;

        var suffix = 'Clone';

        var id = this.$elem[0].id || '';
        var name = this.$elem[0].name || '';
        var newId = id + suffix;
        var newName = name + suffix;

        this.$newElem = $('<input>');
        this.$newElem.attr($.extend(extractAttributes(this.$elem[0]), {
                'id'          : newId,
                'name'        : newName,
                'autocomplete': 'off',
                'type'        : 'text',
                'ime-mode'    : 'disabled'
            }));

        this.$elem.after(this.$newElem).attr({'accessKey': '', tabIndex: ''}).hide();


        this.$newElem.on('focus', function () {
//            that.checkTimeout = setTimeout(function () {
//                that._checkChange();
//            }, that.options.checkInterval);
            that._checkChange();
        });
        this.$newElem.on('blur', function () {
            that._charReplace();
            clearTimeout(that.checkTimeout);
        });

//        $('label').each(function () {
//            if ($(this)[0].htmlFor == id) {
//                $(this)[0].htmlFor = newId;
//            } else if (that.$elem[0].parentNode.tagName.toLowerCase() == 'label') {
//                that.$elem.parentNode.htmlFor = newId;
//            }
//        });
        if( this.options.callback && typeof this.options.callback ==='function'){
            this.options.callback.call(this);
        }
    };

    Password.prototype.destroy = function (){
        this.$newElem.remove();
        this.$newElem = null;
        this.$elem.show();
        clearTimeout(this.checkTimeout);
        clearTimeout(this.transTimeout);
        return this;
    };

    /*
     * check whether all the characters is changed
     * eg. user input and paste the characters
     */
    Password.prototype._checkChange =  function (oldValue) {
        var that = this;
        var curValue = this.$newElem.val();
        if (curValue != oldValue) {
            that._saveString();
        } else {
            that._charReplace();
        }
        oldValue = curValue;
        that.checkTimeout = setTimeout(function () {
            that._checkChange(oldValue);
        }, that.options.checkInterval);
    };


    /*
     * save string from new input
     */
    Password.prototype._saveString = function() {
        var pos = getCurPos(this.$newElem[0]);
        var lastInputChar = false;
        var inpObj = this.$newElem;
        var passObj =this.$elem;
        var inputChars = inpObj.val().split('');
        var passChars = passObj.val().split('');
        if (this.transTimeout) {
            clearTimeout(this.transTimeout);
            this.transTimeout = null;
        }
        for (var i = 0; i < inputChars.length; i++) {
            if (inputChars[i] != passChars[i]) {
                if (inputChars[i] != unescape(this.options.character)) {
                    passChars.splice(i, 0, inputChars[i])
                } else {
                    passChars[i] = passChars[i]
                }
            } else {
                passChars.splice(i, 0, inputChars[i])
            }
        }
        if (inputChars.length < passChars.length) {
            passChars.splice(pos.start, passChars.length - inputChars.length, '')
        }
        for (i = 0; i < inputChars.length; i++) {
            if (inputChars[i] != unescape(this.options.character)) {
                lastInputChar = i
            }
        }
        for (i = 0; i < inputChars.length; i++) {
            if (i < lastInputChar) {
                inputChars[i] = unescape(this.options.character)
            }
        }
        inpObj.val(inputChars.join(''));
        passObj.val(passChars.join(''));
        setCurPos(this.$newElem[0], pos)
    };

    /*
     * instead of the character
     * Unicode for the symbol that will be displayed
     * You can find a good overview here:
     * http://www.fileformat.info/format/w3c/entitytest.htm?sort=Unicode+Character
     */
    Password.prototype._charReplace = function () {
        var that = this;
        var regex = new RegExp('[^' + this.options.character + ']', 'gi');

        var pos = getCurPos(this.$newElem[0]);
        var curValue = this.$newElem.val();
        if (!this.transTimeout && curValue.match(regex) != null) {
            this.transTimeout = setTimeout(function () {
                that.$newElem.val(curValue.replace(regex, unescape(that.options.character)));
                setCurPos(that.$newElem[0], pos)
            }, that.options.transDelay);
        }
    };

    // Return an object of element attributes
    function extractAttributes(elem) {
        var attr = elem.attributes,
            copy = {}, skip = /^jQuery\d+/;
        for (var i = 0; i < attr.length; i++) {
            if (attr[i].specified && !skip.test(attr[i].name)) {
                copy[attr[i].name] = attr[i].value;
            }
        }
        return copy;
    }


    function getCurPos(input) {
        var pos = {
            start: 0,
            end  : 0
        };
        if (input.setSelectionRange) {
            pos.start = input.selectionStart;
            pos.end = input.selectionEnd
        } else if (input.createTextRange) {
            var bookmark = document.selection.createRange().getBookmark();
            var selection = input.createTextRange();
            var before = selection.duplicate();
            selection.moveToBookmark(bookmark);
            before.setEndPoint('EndToStart', selection);
            pos.start = before.text.length;
            pos.end = pos.start + selection.text.length;
        }
        return pos;
    }

    function setCurPos(input, pos) {
        if (input.setSelectionRange) {
            input.setSelectionRange(pos.start, pos.end);
        } else if (input.createTextRange) {
            var selection = input.createTextRange();
            selection.collapse(true);
            selection.moveEnd('character', pos.end);
            selection.moveStart('character', pos.start);
            selection.select();
        }
    }


    $.fn.mobilePassword = function (options) {
        return this.each(function () {
            var settings = $.extend({}, defaults, options || {});
            if (!$.data(this, 'mobilePassword')) {
                $.data(this, 'mobilePassword', new Password($(this), settings));
            }
        });
    };


})(jQuery);