/*jslint devel:true */
var define, brackets, CodeMirror;
define(function (require, exports, module) {
  'use strict';

  var LanguageManager = brackets.getModule("language/LanguageManager");
  var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

  CodeMirror.defineMode("jsx", function(config, parserConfig) {
    var jsMode = CodeMirror.getMode(config, "javascript");
    var xmlMode =  CodeMirror.getMode(config, {name: "xml", htmlMode: true});

    function js(stream, state) {
      if ((state.jsState.lastType == "operator"
           || state.jsState.lastType == "keyword c"
           || /^[\[{}\(,;:]$/.test(state.jsState.lastType))
          && stream.match(/^<[a-zA-Z]+/i, false)) {
        state.token = xml;
        return xmlMode.token(stream, state.localState);
        state.localState = xmlMode.startState(jsMode.indent(state.jsState, ""));
        state.localMode = xmlMode;
        state.indented = stream.backUp(1);
        return xml(stream, state);
      }
      return jsMode.token(stream, state.jsState);;
    }

    function xml(stream, state) {
      if (!state.localState.context) {
        state.token = js;
        return jsMode.token(stream, state.jsState);
      }
      return xmlMode.token(stream, state.localState);;
    }

    return {
      startState: function() {
        var state = jsMode.startState();
        var xmlState = xmlMode.startState();
        return {token: js, localState: xmlState, jsState: state};
      },

      copyState: function(state) {
        return {token: state.token,
                localState: CodeMirror.copyState(xmlMode, state.localState),
                jsState: CodeMirror.copyState(jsMode, state.jsState)};
      },

      token: function(stream, state) {
        return state.token(stream, state);
      },

      indent: function(state, textAfter) {
        if (state.token == js)
          return jsMode.indent(state.jsState, textAfter);
        else
          return xmlMode.indent(state.localState, textAfter);
      },

      electricChars: "/{}:"
    };
  });

  CodeMirror.defineMIME("text/jsx", "jsx");

  LanguageManager.getLanguage("javascript").removeFileExtension('jsx');
  LanguageManager.defineLanguage("jsx", {
    "name": "JSX",
    "mode": "jsx",
    "fileExtensions": ["jsx", "react.js"],
    "blockComment": ["/*", "*/"]
  });
});
