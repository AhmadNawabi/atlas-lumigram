#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const REQUIRED_FILES = [
  'package.json',
  'App.tsx',
  'app.json',
  'tsconfig.json',
  'babel.config.js',
  'src/navigation/index.tsx',
  'src/navigation/AuthStack.tsx',
  'src/navigation/TabNavigator.tsx',
  'src/navigation/types.ts',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/RegisterScreen.tsx',
  'src/screens/home/HomeScreen.tsx',
  'src/screens/add-post/AddPostScreen.tsx',
  'src/screens/favorites/FavoritesScreen.tsx',
  'src/screens/profile/ProfileScreen.tsx',
  'src/screens/profile/EditProfileScreen.tsx',
  'src/screens/search/SearchScreen.tsx',
  'src/services/firebase.ts',
  'src/services/auth.service.ts',
  'src/services/posts.service.ts',
  'src/services/favorites.service.ts',
  'src/services/profile.service.ts',
  'src/services/storage.service.ts',
  'src/contexts/AuthContext.tsx',
  'src/contexts/ThemeContext.tsx',
  'src/hooks/useAuth.ts',
  'src/hooks/useTheme.ts',
  'src/hooks/usePosts.ts',
  'src/hooks/useFavorites.ts',
  'src/utils/theme.ts',
  'src/utils/validators.ts',
  'src/types/index.ts',
];

const REQUIRED_DEPENDENCIES = [
  'expo',
  'react',
  'react-native',
  '@react-navigation/native',
  '@react-navigation/bottom-tabs',
  '@react-navigation/stack',
  'firebase',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-vector-icons',
  'expo-image-picker',
  'expo-media-library',
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class ProjectTester {
  constructor() {
    this.issues = [];
    this.fixed = [];
    this.autoFix = process.argv.includes('--fix');
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  addIssue(file, line, message, canFix = false) {
    this.issues.push({
      file,
      line,
      message,
      canFix,
    });
  }

  addFixed(file, message) {
    this.fixed.push({ file, message });
  }

  async run() {
    this.log('\n🔍 Lumigram Project Test Script\n', colors.cyan);
    this.log('Checking project structure and files...\n', colors.blue);

    // Check if project root exists
    if (!fs.existsSync(PROJECT_ROOT)) {
      this.log('❌ Project root not found!', colors.red);
      process.exit(1);
    }

    // Run all checks
    await this.checkRequiredFiles();
    await this.checkPackageJson();
    await this.checkImports();
    await this.checkExports();
    await this.checkStyles();
    await this.checkFirebaseConfig();
    await this.checkRouting();

    // Report results
    this.printReport();

    // Auto-fix if enabled
    if (this.autoFix && this.issues.length > 0) {
      await this.autoFixIssues();
    }

    // Exit with appropriate code
    process.exit(this.issues.length > 0 ? 1 : 0);
  }

  async checkRequiredFiles() {
    this.log('Checking required files...', colors.blue);

    for (const file of REQUIRED_FILES) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (!fs.existsSync(filePath)) {
        this.addIssue(file, null, 'Missing required file', true);
      } else {
        this.log(`✅ ${file}`, colors.green);
      }
    }
  }

  async checkPackageJson() {
    this.log('\nChecking package.json...', colors.blue);

    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.addIssue('package.json', null, 'package.json not found', true);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Check dependencies
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    for (const dep of REQUIRED_DEPENDENCIES) {
      if (!dependencies[dep]) {
        this.addIssue('package.json', null, `Missing dependency: ${dep}`, true);
      }
    }

    // Check scripts
    const requiredScripts = ['start', 'android', 'ios', 'web'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        this.addIssue('package.json', null, `Missing script: ${script}`, true);
      }
    }
  }

  async checkImports() {
    this.log('\nChecking imports...', colors.blue);

    const checkFileImports = (filePath) => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Skip node_modules and relative paths that don't need checking
        if (importPath.startsWith('.') && !importPath.endsWith('.ts') && !importPath.endsWith('.tsx')) {
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);
          const possibleExtensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
          
          let exists = false;
          for (const ext of possibleExtensions) {
            if (fs.existsSync(resolvedPath + ext) || fs.existsSync(resolvedPath + '/index' + ext)) {
              exists = true;
              break;
            }
          }

          if (!exists) {
            this.addIssue(filePath, this.getLineNumber(content, match.index), `Import not found: ${importPath}`, true);
          }
        }
      }
    };

    // Check all TypeScript files
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          checkFileImports(filePath);
        }
      }
    };

    walkDir(path.join(PROJECT_ROOT, 'src'));
  }

  async checkExports() {
    this.log('Checking exports...', colors.blue);

    const components = [
      { file: 'src/components/common/Button.tsx', export: 'Button' },
      { file: 'src/components/common/Input.tsx', export: 'Input' },
      { file: 'src/components/common/PostCard.tsx', export: 'PostCard' },
      { file: 'src/components/home/FeedPost.tsx', export: 'FeedPost' },
      { file: 'src/hooks/useAuth.ts', export: 'useAuth' },
      { file: 'src/hooks/useTheme.ts', export: 'useTheme' },
      { file: 'src/hooks/usePosts.ts', export: 'usePosts' },
    ];

    for (const { file, export: exportName } of components) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes(`export const ${exportName}`) && 
            !content.includes(`export default ${exportName}`)) {
          this.addIssue(file, null, `Missing export: ${exportName}`, true);
        }
      }
    }
  }

  async checkStyles() {
  this.log('Checking styles...', colors.blue);

  const themePath = path.join(PROJECT_ROOT, 'src/utils/theme.ts');
  if (fs.existsSync(themePath)) {
    const content = fs.readFileSync(themePath, 'utf8');
    
    // Check for lightTheme and darkTheme exports
    if (!content.includes('export const lightTheme')) {
      this.addIssue('src/utils/theme.ts', null, 'Missing lightTheme export', true);
    }
    if (!content.includes('export const darkTheme')) {
      this.addIssue('src/utils/theme.ts', null, 'Missing darkTheme export', true);
    }
    if (!content.includes('export const createStyles')) {
      this.addIssue('src/utils/theme.ts', null, 'Missing createStyles export', true);
    }

    // Check if colors are defined in lightTheme
    const lightThemeMatch = content.match(/lightTheme:\s*Theme\s*=\s*{[\s\S]*?colors:\s*{([\s\S]*?)}/);
    if (lightThemeMatch) {
      const colorsSection = lightThemeMatch[1];
      const requiredColors = ['primary', 'background', 'surface', 'text'];
      for (const color of requiredColors) {
        if (!colorsSection.includes(`${color}:`)) {
          this.addIssue('src/utils/theme.ts', null, `Missing ${color} in lightTheme`, true);
        }
      }
    } else {
      this.addIssue('src/utils/theme.ts', null, 'Could not parse lightTheme colors', true);
    }
  }
}

  async checkFirebaseConfig() {
    this.log('Checking Firebase configuration...', colors.blue);

    const firebasePath = path.join(PROJECT_ROOT, 'src/services/firebase.ts');
    if (fs.existsSync(firebasePath)) {
      const content = fs.readFileSync(firebasePath, 'utf8');
      
      // Check for environment variables
      const envVars = [
        'EXPO_PUBLIC_FIREBASE_API_KEY',
        'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
        'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'EXPO_PUBLIC_FIREBASE_APP_ID',
      ];

      for (const envVar of envVars) {
        if (!content.includes(envVar)) {
          this.addIssue('src/services/firebase.ts', null, `Missing environment variable: ${envVar}`, false);
        }
      }

      // Check for .env.example
      const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
      if (!fs.existsSync(envExamplePath)) {
        this.addIssue('.env.example', null, 'Missing .env.example file', true);
      }
    }
  }

  async checkRouting() {
    this.log('Checking routing...', colors.blue);

    const navigationPath = path.join(PROJECT_ROOT, 'src/navigation/index.tsx');
    if (fs.existsSync(navigationPath)) {
      const content = fs.readFileSync(navigationPath, 'utf8');
      
      // Check for auth state handling
      if (!content.includes('!user')) {
        this.addIssue('src/navigation/index.tsx', null, 'Missing auth state check', true);
      }

      // Check for tab navigator
      if (!content.includes('TabNavigator')) {
        this.addIssue('src/navigation/index.tsx', null, 'Missing TabNavigator', true);
      }

      // Check for auth stack
      if (!content.includes('AuthStack')) {
        this.addIssue('src/navigation/index.tsx', null, 'Missing AuthStack', true);
      }
    }
  }

  getLineNumber(content, index) {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }

  async autoFixIssues() {
    this.log('\n🔧 Attempting to auto-fix issues...', colors.yellow);

    for (const issue of this.issues) {
      if (issue.canFix) {
        try {
          if (issue.message.includes('Missing required file')) {
            await this.createMissingFile(issue.file);
            this.addFixed(issue.file, 'Created missing file');
          } else if (issue.message.includes('Missing export')) {
            await this.fixMissingExport(issue.file, issue.message);
            this.addFixed(issue.file, 'Added missing export');
          } else if (issue.message.includes('Missing import')) {
            // Can't auto-fix imports without knowing what to import
            continue;
          }
        } catch (error) {
          this.log(`Failed to fix ${issue.file}: ${error.message}`, colors.red);
        }
      }
    }

    // Remove fixed issues
    this.issues = this.issues.filter(issue => 
      !this.fixed.some(fixed => fixed.file === issue.file)
    );
  }

  async createMissingFile(filePath) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create appropriate template based on file type
    if (filePath.endsWith('.tsx')) {
      const componentName = path.basename(filePath, '.tsx');
      const template = `import React from 'react';
import { View, Text } from 'react-native';

export default function ${componentName}() {
  return (
    <View>
      <Text>${componentName}</Text>
    </View>
  );
}
`;
      fs.writeFileSync(fullPath, template);
    } else if (filePath.endsWith('.ts')) {
      fs.writeFileSync(fullPath, '// Auto-generated file\n');
    } else if (filePath === '.env.example') {
      const template = `EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
`;
      fs.writeFileSync(fullPath, template);
    }
  }

  async fixMissingExport(filePath, message) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const exportName = message.split(':')[1].trim();

    if (!content.includes(`export const ${exportName}`) && 
        !content.includes(`export default ${exportName}`)) {
      const newContent = content + `\n\nexport const ${exportName} = () => null;\n`;
      fs.writeFileSync(fullPath, newContent);
    }
  }

  printReport() {
    this.log('\n📊 Test Results\n', colors.cyan);
    
    if (this.issues.length === 0 && this.fixed.length === 0) {
      this.log('✅ All checks passed! The project looks great!', colors.green);
    } else {
      if (this.fixed.length > 0) {
        this.log(`\n✅ Fixed ${this.fixed.length} issues:`, colors.green);
        for (const fix of this.fixed) {
          this.log(`   • ${fix.file}: ${fix.message}`, colors.green);
        }
      }

      if (this.issues.length > 0) {
        this.log(`\n❌ Found ${this.issues.length} remaining issues:`, colors.red);
        for (const issue of this.issues) {
          const lineInfo = issue.line ? `:${issue.line}` : '';
          this.log(`   • ${issue.file}${lineInfo} - ${issue.message}`, colors.red);
        }
      }
    }

    this.log('\n📝 Summary:', colors.cyan);
    this.log(`   Total files checked: ${REQUIRED_FILES.length}`);
    this.log(`   Issues found: ${this.issues.length}`);
    this.log(`   Issues fixed: ${this.fixed.length}`);
  }
}

// Run the tests
const tester = new ProjectTester();
tester.run().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
