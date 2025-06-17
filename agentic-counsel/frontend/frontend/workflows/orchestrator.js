#!/usr/bin/env node

/**
 * Claude-Flow Workflow Orchestrator
 * Coordinates multiple development workflows
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WorkflowOrchestrator {
  constructor() {
    this.configPath = path.join(__dirname, '../claude-flow.config.json');
    this.config = this.loadConfig();
    this.activeWorkflows = new Map();
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('❌ Failed to load claude-flow.config.json');
      return {};
    }
  }

  /**
   * Execute a SPARC workflow
   */
  async executeWorkflow(workflowName, task, options = {}) {
    const workflow = this.config.workflows[workflowName];
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    console.log(`🚀 Starting workflow: ${workflowName}`);
    console.log(`📋 Task: ${task}`);
    console.log(`📝 Description: ${workflow.description}`);

    const results = [];
    
    for (const step of workflow.steps) {
      const [mode, instruction] = step.split(': ');
      console.log(`\n🔄 Executing step: ${mode} - ${instruction}`);
      
      try {
        const result = await this.executeStep(mode, `${instruction} for: ${task}`, options);
        results.push({ mode, instruction, result, success: true });
        console.log(`✅ Step completed: ${mode}`);
      } catch (error) {
        console.error(`❌ Step failed: ${mode} - ${error.message}`);
        results.push({ mode, instruction, error: error.message, success: false });
        
        if (options.stopOnError) {
          break;
        }
      }
    }

    return {
      workflow: workflowName,
      task,
      results,
      success: results.every(r => r.success)
    };
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(mode, instruction, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`  📌 Mode: ${mode}`);
      console.log(`  📝 Instruction: ${instruction}`);
      
      // Simulate step execution (in real implementation, this would interface with Claude)
      setTimeout(() => {
        resolve({
          mode,
          instruction,
          output: `Completed ${mode} step for: ${instruction}`,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  }

  /**
   * Generate a new component using the component-generation workflow
   */
  async generateComponent(componentName, description, options = {}) {
    console.log(`🧩 Generating component: ${componentName}`);
    
    const ComponentGenerator = require('./component-generator.js');
    const generator = new ComponentGenerator();
    
    return await generator.generateComponent(componentName, description, options);
  }

  /**
   * Run feature development workflow
   */
  async developFeature(featureName, requirements) {
    return await this.executeWorkflow('feature-development', `${featureName}: ${requirements}`);
  }

  /**
   * Run code review workflow
   */
  async reviewCode(filePath) {
    return await this.executeWorkflow('code-review', `Review code in ${filePath}`);
  }

  /**
   * Prepare for deployment
   */
  async prepareDeployment() {
    return await this.executeWorkflow('deployment-prep', 'Prepare application for deployment');
  }

  /**
   * List available workflows
   */
  listWorkflows() {
    return Object.keys(this.config.workflows || {});
  }

  /**
   * List available SPARC modes
   */
  listModes() {
    return this.config.sparc?.modes || [];
  }

  /**
   * Get workflow status
   */
  getStatus() {
    return {
      activeWorkflows: Array.from(this.activeWorkflows.keys()),
      availableWorkflows: this.listWorkflows(),
      availableModes: this.listModes(),
      config: this.config.name
    };
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const orchestrator = new WorkflowOrchestrator();

  if (args.length === 0) {
    console.log(`
🌊 Claude-Flow Workflow Orchestrator

Usage:
  node orchestrator.js <command> [options]

Commands:
  workflow <name> <task>     Execute a workflow
  component <name> [desc]    Generate a component
  feature <name> <req>       Develop a feature
  review <file>              Review code
  deploy                     Prepare deployment
  status                     Show status
  list                       List workflows

Examples:
  node orchestrator.js component Button "A reusable button"
  node orchestrator.js feature "User Auth" "Login and registration"
  node orchestrator.js workflow feature-development "Shopping Cart"
  node orchestrator.js review src/components/Header.tsx
    `);
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'status':
      console.log('📊 Claude-Flow Status:');
      console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
      break;

    case 'list':
      console.log('📋 Available Workflows:');
      orchestrator.listWorkflows().forEach(w => console.log(`  - ${w}`));
      console.log('\n🎯 Available Modes:');
      orchestrator.listModes().forEach(m => console.log(`  - ${m}`));
      break;

    case 'component':
      const componentName = args[1];
      const componentDesc = args[2] || '';
      if (!componentName) {
        console.error('❌ Component name required');
        process.exit(1);
      }
      orchestrator.generateComponent(componentName, componentDesc)
        .then(result => {
          if (result.success) {
            console.log('🎉 Component generated successfully!');
          } else {
            console.error('💥 Component generation failed!');
          }
        });
      break;

    case 'workflow':
      const workflowName = args[1];
      const task = args[2];
      if (!workflowName || !task) {
        console.error('❌ Workflow name and task required');
        process.exit(1);
      }
      orchestrator.executeWorkflow(workflowName, task)
        .then(result => {
          console.log(`\n🏁 Workflow completed: ${result.success ? '✅' : '❌'}`);
          console.log(`📊 Steps: ${result.results.length}`);
          console.log(`✅ Successful: ${result.results.filter(r => r.success).length}`);
        });
      break;

    case 'feature':
      const featureName = args[1];
      const requirements = args[2];
      if (!featureName || !requirements) {
        console.error('❌ Feature name and requirements required');
        process.exit(1);
      }
      orchestrator.developFeature(featureName, requirements)
        .then(result => {
          console.log(`\n🎯 Feature development: ${result.success ? '✅' : '❌'}`);
        });
      break;

    case 'review':
      const filePath = args[1];
      if (!filePath) {
        console.error('❌ File path required');
        process.exit(1);
      }
      orchestrator.reviewCode(filePath)
        .then(result => {
          console.log(`\n🔍 Code review: ${result.success ? '✅' : '❌'}`);
        });
      break;

    case 'deploy':
      orchestrator.prepareDeployment()
        .then(result => {
          console.log(`\n🚀 Deployment prep: ${result.success ? '✅' : '❌'}`);
        });
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

module.exports = WorkflowOrchestrator;