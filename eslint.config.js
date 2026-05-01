import js from '@eslint/js'

export default [
  {
    ignores: ['node_modules/'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['error', 'never'],
      'semi-style': ['error', 'last'],
      'no-unused-vars': ['error', { args: 'none' }],
      'array-bracket-spacing': ['warn', 'always', { arraysInArrays: false, objectsInArrays: false }],
      'no-trailing-spaces': ['error'],
      'space-before-function-paren': ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'indent': ['error', 2, { SwitchCase: 1 }],
      'key-spacing': [
        'warn',
        {
          singleLine: {
            beforeColon: false,
            afterColon: true,
          },
          multiLine: {
            beforeColon: false,
            afterColon: true,
            align: 'colon',
            mode: 'minimum',
          },
        },
      ],
      'comma-dangle': [
        'warn',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          functions: 'only-multiline',
        },
      ],
      'arrow-parens': ['error', 'as-needed'],
      'brace-style': ['error', 'stroustrup'],
      'dot-notation': 'error',
      'prefer-const': 'warn',
    },
  },
]
