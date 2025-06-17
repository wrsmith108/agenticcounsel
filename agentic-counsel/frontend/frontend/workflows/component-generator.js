#!/usr/bin/env node

/**
 * Claude-Flow Component Generator
 * Automated React component generation with TypeScript
 */

const fs = require('fs');
const path = require('path');

class ComponentGenerator {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates/components');
    this.componentsDir = path.join(__dirname, '../src/components');
  }

  /**
   * Generate a new React component
   * @param {string} componentName - Name of the component
   * @param {string} description - Component description
   * @param {object} options - Generation options
   */
  async generateComponent(componentName, description = '', options = {}) {
    const {
      withTest = true,
      withStory = false,
      directory = 'components'
    } = options;

    console.log(`🧩 Generating component: ${componentName}`);

    try {
      // Create component directory
      const componentDir = path.join(this.componentsDir, componentName);
      if (!fs.existsSync(componentDir)) {
        fs.mkdirSync(componentDir, { recursive: true });
      }

      // Generate component file
      await this.generateFromTemplate('component.template.txt', componentDir, componentName, description);
      
      // Generate test file if requested
      if (withTest) {
        await this.generateFromTemplate('test.template.txt', componentDir, componentName, description);
      }

      // Generate index file for easy imports
      await this.generateIndexFile(componentDir, componentName);

      console.log(`✅ Component ${componentName} generated successfully!`);
      console.log(`📁 Location: ${componentDir}`);
      
      return {
        success: true,
        componentPath: componentDir,
        files: this.getGeneratedFiles(componentDir)
      };

    } catch (error) {
      console.error(`❌ Error generating component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate file from template
   */
  async generateFromTemplate(templateName, outputDir, componentName, description) {
    const templatePath = path.join(this.templatesDir, templateName);
    const template = fs.readFileSync(templatePath, 'utf8');
    
    const content = template
      .replace(/\{\{ComponentName\}\}/g, componentName)
      .replace(/\{\{ComponentDescription\}\}/g, description || `${componentName} component`)
      .replace(/\{\{component-name\}\}/g, this.kebabCase(componentName));

    const extension = templateName.includes('test') ? '.test.tsx' : '.tsx';
    const outputPath = path.join(outputDir, `${componentName}${extension}`);
    
    fs.writeFileSync(outputPath, content);
    console.log(`📄 Generated: ${path.basename(outputPath)}`);
  }

  /**
   * Generate index file for component
   */
  async generateIndexFile(componentDir, componentName) {
    const indexContent = `export { ${componentName} } from './${componentName}';\nexport type { ${componentName}Props } from './${componentName}';\n`;
    const indexPath = path.join(componentDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    console.log(`📄 Generated: index.ts`);
  }

  /**
   * Get list of generated files
   */
  getGeneratedFiles(componentDir) {
    return fs.readdirSync(componentDir).map(file => path.join(componentDir, file));
  }

  /**
   * Convert PascalCase to kebab-case
   */
  kebabCase(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * List existing components
   */
  listComponents() {
    if (!fs.existsSync(this.componentsDir)) {
      return [];
    }
    
    return fs.readdirSync(this.componentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const generator = new ComponentGenerator();

  if (args.length === 0) {
    console.log(`
🧩 Claude-Flow Component Generator

Usage:
  node component-generator.js <ComponentName> [description] [options]

Examples:
  node component-generator.js Button "A reusable button component"
  node component-generator.js Modal "Modal dialog component" --with-story
  node component-generator.js Card --no-test

Options:
  --with-story     Generate Storybook story
  --no-test        Skip test file generation
  --list           List existing components
    `);
    process.exit(0);
  }

  if (args[0] === '--list') {
    const components = generator.listComponents();
    console.log('📦 Existing components:');
    components.forEach(comp => console.log(`  - ${comp}`));
    process.exit(0);
  }

  const componentName = args[0];
  const description = args[1] || '';
  const options = {
    withTest: !args.includes('--no-test'),
    withStory: args.includes('--with-story')
  };

  generator.generateComponent(componentName, description, options)
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Component generation completed!');
      } else {
        console.error('\n💥 Component generation failed!');
        process.exit(1);
      }
    });
}

module.exports = ComponentGenerator;