import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Older files written before CI existed: style-only issues are warnings here
    // so CI can run today. New and edited code keeps the strict rules above.
    files: [
      'src/components/AbcLesson.jsx',
      'src/components/BoardSettings.jsx',
      'src/components/ColorsLesson.jsx',
      'src/components/DrawingBoard.jsx',
      'src/components/GeneralTutor3D.jsx',
      'src/components/LoginSignup.jsx',
      'src/components/MessagesList.jsx',
      'src/components/PaperGenerator.jsx',
      'src/components/Teacher.jsx',
      'src/components/TeacherDashboard.jsx',
      'src/components/TeachingCharacter3D.jsx',
      'src/components/TeachingInterface.jsx',
      'src/hooks/useAITeacher.js',
    ],
    rules: {
      'no-irregular-whitespace': 'warn',
      'no-unused-vars': 'warn',
      'no-empty': 'warn',
    },
  },
])
