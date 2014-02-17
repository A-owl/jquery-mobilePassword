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
(function($) {
  $.fn.mobilePassword = function(options) {
    var opts = $.extend({}, $.fn.mobilePassword.defaults, options);

    var checkTimeout = [];
    var transTimeout = [];
    var regex = new RegExp('[^' + opts.character + ']', 'gi');
    var i = 0;

    this.each(function(index) {
      var suffix = 'Clone' + index;
      var $this = $(this);
      var id = this.id;
      var name = this.name;
      var newId = id + suffix;
      var newName = id + suffix;
      if (!id || !name) {
        alert("Please set 'id' and 'name' attributes for elements!");
        return false;
      }
      var $newObj = $('<input>')
        .attr($.extend(extractAttributes(this), { 'id': newId, 'name': newName, 'autocomplete': 'off', 'type': 'text'}))
      var newElem = $('#' + newId)[0];
      $this.after($newObj).attr({'accessKey':'',tabIndex:''}).hide();
      $newObj.on('focus', function() {
        var oldValue = $newObj.val();
        checkTimeout[index] = setTimeout(function() {
          checkChange(index, id, newId, oldValue);
        }, opts.checkInterval);
      });
      $newObj.on('blur', function() {
        charReplace(index, newId);
        clearTimeout(checkTimeout[index]);
      });
      $('label').each(function() {
        if (this.htmlFor == id) {
          this.htmlFor = newId
        } else if ($this[0].parentNode.tagName.toLowerCase() == 'label') {
          $this[0].parentNode.htmlFor = newId
        }
      })
    });

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

    /*
     * check whether all the characters are the same
     * eg. user input and paste the characters
     */
    function checkChange(index, oldId, id, oldValue) {
      var curValue = $('#' + id).val();
      if (curValue != oldValue) {
        saveString(index, oldId, id);
      } else {
        charReplace(index, id);
      }
      oldValue = curValue;
      checkTimeout[index] = setTimeout(function() {
        checkChange(index, oldId, id, oldValue);
      }, opts.checkInterval)
    };

    /*
     * save string from new input
     */
    function saveString(index, oldId, id) {
      var pos = getCurPos(id);
      var lastInputChar = false;
      var inpObj = $('#' + id);
      var passObj = $('#' + oldId);
      var inputChars = inpObj.val().split('');
      var passChars = passObj.val().split('');
      if (transTimeout[index]) {
        clearTimeout(transTimeout[index]);
        transTimeout[index] = null
      }
      for (i = 0; i < inputChars.length; i++) {
        if (inputChars[i] != passChars[i]) {
          if (inputChars[i] != unescape(opts.character)) {
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
        if (inputChars[i] != unescape(opts.character)) {
          lastInputChar = i
        }
      }
      for (i = 0; i < inputChars.length; i++) {
        if (i < lastInputChar) {
          inputChars[i] = unescape(opts.character)
        }
      }
      inpObj.val(inputChars.join(''));
      passObj.val(passChars.join(''));
      setCurPos(id, pos)
    };

    /*
     * instead of the character
     * Unicode for the symbol that will be displayed
     * You can find a good overview here:
     * http://www.fileformat.info/format/w3c/entitytest.htm?sort=Unicode+Character
     */
    function charReplace(index, id) {
      var pos = getCurPos(id);
      var inpObj = $('#' + id);
      var curValue = inpObj.val();
      if (!transTimeout[index] && curValue.match(regex) != null) {
        transTimeout[index] = setTimeout(function() {
          inpObj.val(curValue.replace(regex, unescape(opts.character)));
          setCurPos(id, pos)
        }, opts.transDelay)
      }
    };

    function getCurPos(id) {
      var input = $('#' + id)[0];
      var pos = {
        start: 0,
        end: 0
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
    };

    function setCurPos(id, pos) {
      var input = $('#' + id)[0];
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

  }

  $.fn.mobilePassword.defaults = {
    checkInterval: 200, //set timeout to check whether all the characters are the same
    transDelay: 500, //delay to transform last letter
    character: '%u25CF' //instead of the character
  };
})(jQuery);