#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
};

class FullDiagnostic {
  constructor() {
    this.issues = {
      typescript: [],
      imports: [],
      exports: [],
      dependencies: [],
      syntax: [],
      firebase: [],
      navigation: [],
      styles: [],
    };
    this.projectRoot = path.join(__dirname, '..');
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  logHeader(message) {
    console.log('\n' + '='.repeat(60));
    this.log(` 🔍 ${message}`, colors.cyan);
    console.log('='.repeat(60));
  }

  logSuccess(message) {
    this.log(` ✅ ${message}`, colors.green);
  }

  logWarning(message) {
    this.log(` ⚠️  ${message}`, colors.yellow);
  }

  logError(message) {
    this.log(` ❌ ${message}`, colors.red);
  }

  logInfo(message) {
    this.log(` ℹ️  ${message}`, colors.blue);
  }

  async run() {
    this.logHeader('LUMIGRAM FULL DIAGNOSTIC TOOL');
    console.log(`Started at: ${new Date().toLocaleString()}\n`);

    await this.checkTypeScript();
    await this.checkImports();
    await this.checkExports();
    await this.checkDependencies();
    await this.checkFirebase();
    await this.checkNavigation();
    await this.checkStyles();
    await this.checkSyntax();
    await this.checkFileStructure();

    this.printReport();
    this.printFixInstructions();
  }

  async checkTypeScript() {
    this.logHeader('TypeScript Errors');
    
    try {
      // Run TypeScript compiler check
      const result = execSync('npx tsc --noEmit', { 
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      this.logSuccess('No TypeScript errors found');
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const lines = output.split('\n').filter(line => line.includes('error TS'));
      
      if (lines.length === 0) {
        this.logSuccess('No TypeScript errors found');
      } else {
        this.logError(`Found ${lines.length} TypeScript errors:`);
        lines.forEach(line => {
          const match = line.match(/(.+\.tsx?\(\d+,\d+\):.+)/);
          if (match) {
            this.log(`   ${match[1]}`, colors.red);
            this.issues.typescript.push(match[1]);
          }
        });
      }
    }
  }

  async checkImports() {
    this.logHeader('Import/Export Issues');
    
    const checkFile = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for relative imports
        const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          
          // Skip node_modules and absolute imports
          if (importPath.startsWith('.') && !importPath.endsWith('.ts') && !importPath.endsWith('.tsx')) {
            const basePath = path.dirname(filePath);
            const resolvedPath = path.resolve(basePath, importPath);
            
            // Check for file with extensions
            const possiblePaths = [
              resolvedPath,
              resolvedPath + '.ts',
              resolvedPath + '.tsx',
              resolvedPath + '/index.ts',
              resolvedPath + '/index.tsx',
            ];
            
            const exists = possiblePaths.some(p => fs.existsSync(p));
            
            if (!exists) {
              this.logError(`${path.relative(this.projectRoot, filePath)}:${index + 1} - Import not found: ${importPath}`);
              this.issues.imports.push({ file: path.relative(this.projectRoot, filePath), line: index + 1, import: importPath });
            }
          }
        }
      });
    };

    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          checkFile(filePath);
        }
      }
    };

    walkDir(path.join(this.projectRoot, 'src'));

    if (this.issues.imports.length === 0) {
      this.logSuccess('All imports resolved correctly');
    }
  }

  async checkExports() {
    this.logHeader('Missing Exports');

    const expectedExports = {
      'src/components/common/Button.tsx': ['Button'],
      'src/components/common/Input.tsx': ['Input'],
      'src/components/common/LoadingSpinner.tsx': ['LoadingSpinner'],
      'src/components/common/ErrorMessage.tsx': ['ErrorMessage'],
      'src/components/common/ThemeToggle.tsx': ['ThemeToggle'],
      'src/components/common/PostCard.tsx': ['PostCard'],
      'src/components/home/FeedPost.tsx': ['FeedPost'],
      'src/hooks/useAuth.ts': ['useAuth'],
      'src/hooks/useTheme.ts': ['useTheme'],
      'src/hooks/usePosts.ts': ['usePosts'],
      'src/hooks/useFavorites.ts': ['useFavorites'],
      'src/utils/theme.ts': ['lightTheme', 'darkTheme', 'createStyles'],
      'src/utils/validators.ts': ['validateEmail', 'validatePassword', 'validateUsername'],
    };

    for (const [file, exports] of Object.entries(expectedExports)) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        for (const exp of exports) {
          const hasExport = content.includes(`export const ${exp}`) || 
                           content.includes(`export default ${exp}`) ||
                           content.includes(`export { ${exp}`) ||
                           content.includes(`export {${exp}`);
          
          if (!hasExport) {
            this.logError(`${file} - Missing export: ${exp}`);
            this.issues.exports.push({ file, missing: exp });
          }
        }
      } else {
        this.logError(`${file} - File not found`);
        this.issues.exports.push({ file, missing: 'file' });
      }
    }

    if (this.issues.exports.length === 0) {
      this.logSuccess('All exports are properly defined');
    }
  }

  async checkDependencies() {
    this.logHeader('Dependencies Check');

    const packagePath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.logError('package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      'expo',
      'react',
      'react-native',
      '@react-navigation/native',
      '@react-navigation/bottom-tabs',
      '@react-navigation/stack',
      '@react-navigation/native-stack',
      'react-native-screens',
      'react-native-safe-area-context',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-vector-icons',
      'firebase',
      'expo-image-picker',
      'expo-media-library',
      '@react-native-async-storage/async-storage',
      'react-native-flash-message',
      'date-fns',
      '@shopify/flash-list',
    ];

    const missing = [];
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        missing.push(dep);
        this.logError(`Missing dependency: ${dep}`);
      }
    }

    if (missing.length > 0) {
      this.issues.dependencies.push({ missing });
      this.logInfo(`Run: npm install ${missing.join(' ')}`);
    } else {
      this.logSuccess('All required dependencies are installed');
    }
  }

  async checkFirebase() {
    this.logHeader('Firebase Configuration');

    const firebasePath = path.join(this.projectRoot, 'src/services/firebase.ts');
    if (!fs.existsSync(firebasePath)) {
      this.logError('Firebase service file missing');
      this.issues.firebase.push('Missing firebase.ts');
      return;
    }

    const content = fs.readFileSync(firebasePath, 'utf8');
    
    // Check for Firebase imports
    const requiredImports = [
      'getAuth',
      'getFirestore',
      'getStorage',
    ];

    for (const imp of requiredImports) {
      if (!content.includes(imp)) {
        this.logError(`Missing Firebase import: ${imp}`);
        this.issues.firebase.push(`Missing import: ${imp}`);
      }
    }

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
        this.logWarning(`Environment variable ${envVar} not found in firebase.ts`);
        this.issues.firebase.push(`Missing env var: ${envVar}`);
      }
    }

    // Check for .env file
    const envPath = path.join(this.projectRoot, '.env');
    if (!fs.existsSync(envPath)) {
      this.logWarning('.env file not found');
      this.issues.firebase.push('Missing .env file');
    }

    if (this.issues.firebase.length === 0) {
      this.logSuccess('Firebase configuration looks good');
    }
  }

  async checkNavigation() {
    this.logHeader('Navigation Structure');

    const navigationFiles = [
      'src/navigation/index.tsx',
      'src/navigation/AuthStack.tsx',
      'src/navigation/TabNavigator.tsx',
      'src/navigation/types.ts',
    ];

    for (const file of navigationFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.logError(`Missing navigation file: ${file}`);
        this.issues.navigation.push(`Missing: ${file}`);
      }
    }

    // Check TabNavigator for all required screens
    const tabPath = path.join(this.projectRoot, 'src/navigation/TabNavigator.tsx');
    if (fs.existsSync(tabPath)) {
      const content = fs.readFileSync(tabPath, 'utf8');
      const requiredScreens = ['Home', 'Search', 'AddPost', 'Favorites', 'Profile'];
      
      for (const screen of requiredScreens) {
        if (!content.includes(`${screen}Screen`)) {
          this.logError(`Missing ${screen} screen in TabNavigator`);
          this.issues.navigation.push(`Missing screen: ${screen}`);
        }
      }
    }

    if (this.issues.navigation.length === 0) {
      this.logSuccess('Navigation structure is correct');
    }
  }

  async checkStyles() {
    this.logHeader('Theme and Styles');

    const themePath = path.join(this.projectRoot, 'src/utils/theme.ts');
    if (!fs.existsSync(themePath)) {
      this.logError('Theme file missing');
      this.issues.styles.push('Missing theme.ts');
      return;
    }

    const content = fs.readFileSync(themePath, 'utf8');

    // Check for theme exports
    const requiredExports = ['lightTheme', 'darkTheme', 'createStyles'];
    for (const exp of requiredExports) {
      if (!content.includes(`export const ${exp}`)) {
        this.logError(`Missing export: ${exp}`);
        this.issues.styles.push(`Missing export: ${exp}`);
      }
    }

    // Check for required color properties in lightTheme
    if (content.includes('lightTheme')) {
      const requiredColors = ['primary', 'background', 'surface', 'text'];
      for (const color of requiredColors) {
        if (!content.includes(`'${color}':`)) {
          this.logError(`Missing color property in lightTheme: ${color}`);
          this.issues.styles.push(`Missing color: ${color}`);
        }
      }
    }

    if (this.issues.styles.length === 0) {
      this.logSuccess('Theme configuration is correct');
    }
  }

  async checkSyntax() {
    this.logHeader('Syntax Errors');

    const checkFile = (filePath) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for unclosed JSX tags
        const openTags = (content.match(/<[A-Z][^>]*>/g) || []).length;
        const closeTags = (content.match(/<\/[A-Z][^>]*>/g) || []).length;
        
        if (openTags !== closeTags) {
          this.logError(`${path.relative(this.projectRoot, filePath)} - Unmatched JSX tags (opens: ${openTags}, closes: ${closeTags})`);
          this.issues.syntax.push({ file: path.relative(this.projectRoot, filePath), issue: 'Unmatched JSX tags' });
        }

        // Check for missing imports of used components
        const componentUses = content.match(/<([A-Z][A-Za-z]+)/g) || [];
        for (const use of componentUses) {
          const component = use.replace('<', '');
          if (component !== 'View' && component !== 'Text' && component !== 'TouchableOpacity' && 
              component !== 'Image' && component !== 'TextInput' && component !== 'ScrollView' &&
              component !== 'FlatList' && component !== 'ActivityIndicator' && component !== 'KeyboardAvoidingView') {
            if (!content.includes(`import ${component}`) && !content.includes(`import { ${component}`)) {
              this.logWarning(`${path.relative(this.projectRoot, filePath)} - Component ${component} might be missing import`);
            }
          }
        }

      } catch (error) {
        this.logError(`Error reading ${filePath}: ${error.message}`);
      }
    };

    const walkDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.tsx')) {
          checkFile(filePath);
        }
      }
    };

    walkDir(path.join(this.projectRoot, 'src'));

    if (this.issues.syntax.length === 0) {
      this.logSuccess('No syntax errors detected');
    }
  }

  async checkFileStructure() {
    this.logHeader('File Structure');

    const requiredDirectories = [
      'src/components/common',
      'src/components/home',
      'src/components/profile',
      'src/contexts',
      'src/hooks',
      'src/navigation',
      'src/screens/auth',
      'src/screens/home',
      'src/screens/add-post',
      'src/screens/favorites',
      'src/screens/profile',
      'src/screens/search',
      'src/services',
      'src/types',
      'src/utils',
      'scripts',
    ];

    for (const dir of requiredDirectories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        this.logWarning(`Missing directory: ${dir}`);
      }
    }

    this.logSuccess('File structure check complete');
  }

  printReport() {
    this.logHeader('DIAGNOSTIC REPORT');
    
    let totalIssues = 0;
    for (const [category, issues] of Object.entries(this.issues)) {
      totalIssues += issues.length;
    }

    if (totalIssues === 0) {
      this.logSuccess('No issues found! Your project is perfect! 🎉');
      return;
    }

    this.logError(`Found ${totalIssues} total issues:\n`);

    for (const [category, issues] of Object.entries(this.issues)) {
      if (issues.length > 0) {
        this.log(`📁 ${category.toUpperCase()}: ${issues.length} issues`, colors.yellow);
      }
    }
  }

  printFixInstructions() {
    if (Object.values(this.issues).every(arr => arr.length === 0)) {
      return;
    }

    this.logHeader('FIX INSTRUCTIONS');

    // TypeScript errors
    if (this.issues.typescript.length > 0) {
      this.log('\n📘 TypeScript Errors:', colors.cyan);
      this.log('Run: npx tsc --noEmit to see detailed errors');
      this.log('Common fixes:');
      this.log('  • Add proper type annotations');
      this.log('  • Check for null/undefined handling');
      this.log('  • Import missing types');
    }

    // Import issues
    if (this.issues.imports.length > 0) {
      this.log('\n📦 Import Issues:', colors.cyan);
      this.log('Create missing files or fix import paths:');
      this.issues.imports.forEach(imp => {
        this.log(`  • ${imp.file}:${imp.line} - ${imp.import}`);
      });
    }

    // Export issues
    if (this.issues.exports.length > 0) {
      this.log('\n📤 Export Issues:', colors.cyan);
      this.log('Add missing exports to files:');
      this.issues.exports.forEach(exp => {
        this.log(`  • ${exp.file} - Add export: ${exp.missing}`);
      });
    }

    // Dependencies
    if (this.issues.dependencies.length > 0) {
      this.log('\n📦 Missing Dependencies:', colors.cyan);
      this.issues.dependencies.forEach(dep => {
        this.log(`  • Run: npm install ${dep.missing.join(' ')}`);
      });
    }

    // Firebase
    if (this.issues.firebase.length > 0) {
      this.log('\n🔥 Firebase Issues:', colors.cyan);
      this.log('Check your Firebase configuration:');
      this.issues.firebase.forEach(issue => {
        this.log(`  • ${issue}`);
      });
      this.log('\nMake sure you have a .env file with:');
      this.log(`EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id`);
    }

    // Navigation
    if (this.issues.navigation.length > 0) {
      this.log('\n🧭 Navigation Issues:', colors.cyan);
      this.issues.navigation.forEach(issue => {
        this.log(`  • ${issue}`);
      });
    }

    // Styles
    if (this.issues.styles.length > 0) {
      this.log('\n🎨 Style Issues:', colors.cyan);
      this.issues.styles.forEach(issue => {
        this.log(`  • ${issue}`);
      });
    }

    this.log('\n' + '='.repeat(60));
    this.log('To auto-fix common issues, run:', colors.green);
    this.log('node scripts/test-script.js --fix', colors.green);
    this.log('='.repeat(60));
  }
}

// Run the diagnostic
const diagnostic = new FullDiagnostic();
diagnostic.run().catch(error => {
  console.error('Diagnostic failed:', error);
});
