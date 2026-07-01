import { defineConfig, type Plugin, type UserConfig } from 'vite';

type LegacyForgeOutputOptions = {
  inlineDynamicImports?: boolean;
};

const preloadOutputConfig = {
  codeSplitting: false,
} satisfies NonNullable<NonNullable<NonNullable<UserConfig['build']>['rolldownOptions']>['output']>;

const removeDeprecatedInlineDynamicImports = (): Plugin => ({
  name: 'remove-deprecated-inline-dynamic-imports',
  config(config) {
    const buildConfig = config.build as
      | {
          rollupOptions?: {
            output?: LegacyForgeOutputOptions | LegacyForgeOutputOptions[];
          };
        }
      | undefined;
    const output = buildConfig?.rollupOptions?.output;

    if (output && !Array.isArray(output)) {
      delete output.inlineDynamicImports;
    }
  },
});

export default defineConfig({
  plugins: [removeDeprecatedInlineDynamicImports()],
  build: {
    rolldownOptions: {
      output: preloadOutputConfig,
    },
  },
});
