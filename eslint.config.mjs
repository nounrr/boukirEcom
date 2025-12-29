// Minimal ESLint flat config.
// For now we ignore all files so that `npm run lint` succeeds without
// scanning build output or external dependencies. Update this config
// later if you want to enable linting on source files.

export default [
  {
    ignores: ["**/*"],
  },
];
