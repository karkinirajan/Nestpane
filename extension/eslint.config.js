const globals = require("globals");

module.exports = [
  {
    files: ["app.js", "popup.js", "fouc.js", "build.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: "readonly",
        NestpaneFormat: "readonly",
        NestpaneMigrations: "readonly",
        NestpaneDriveConflict: "readonly",
        NestpaneAutosave: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    },
  },
  {
    files: ["lib/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
    },
  },
];
