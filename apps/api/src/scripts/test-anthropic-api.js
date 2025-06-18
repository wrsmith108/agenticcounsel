#!/usr/bin/env node

/**
 * Simple script to test Anthropic API connectivity and diagnose issues
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

async function testAnthropicAPI() {
  console.log('🔍 Testing Anthropic API connectivity...\n');
  
  // Check environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
  
  console.log('📋 Configuration:');
  console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'}`);
  console.log(`   Model: ${model}`);
  console.log('');
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found in environment variables');
    return;
  }
  
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: apiKey
  });
  
  try {
    console.log('🚀 Making test API call...');
    
    const completion = await anthropic.messages.create({
      model: model,
      max_tokens: 100,
      temperature: 0.7,
      messages: [
        { 
          role: 'user', 
          content: 'Say hello and confirm the API is working.' 
        }
      ]
    });
    
    const response = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
    
    console.log('✅ API call successful!');
    console.log('📤 Response:', response);
    console.log('');
    console.log('💰 Usage info:');
    console.log(`   Input tokens: ${completion.usage?.input_tokens || 'N/A'}`);
    console.log(`   Output tokens: ${completion.usage?.output_tokens || 'N/A'}`);
    console.log(`   Stop reason: ${completion.stop_reason}`);
    
  } catch (error) {
    console.error('❌ API call failed:');
    console.error('   Error:', error.message);
    console.error('   Status:', error.status);
    console.error('   Type:', error.error?.type);
    
    if (error.status === 401) {
      console.log('\n🔧 Troubleshooting 401 errors:');
      console.log('   - Check if your API key is correct');
      console.log('   - Verify the API key has not expired');
      console.log('   - Ensure you have access to the Anthropic API');
    } else if (error.status === 429) {
      console.log('\n🔧 Troubleshooting 429 errors:');
      console.log('   - You have exceeded your rate limit');
      console.log('   - Wait and try again later');
      console.log('   - Consider upgrading your plan');
    } else if (error.status === 529) {
      console.log('\n🔧 Troubleshooting 529 errors:');
      console.log('   - Anthropic servers are overloaded');
      console.log('   - Your account may have insufficient credits');
      console.log('   - Check your Anthropic console for billing status');
      console.log('   - Try again in a few minutes');
    }
  }
}

// Run the test
testAnthropicAPI().catch(console.error);