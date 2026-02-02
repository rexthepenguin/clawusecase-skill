#!/usr/bin/env node

/**
 * Submit a use case to clawusecase.com
 * 
 * Usage:
 *   node submit.js \
 *     --title "Email notifications for Pro subscriptions" \
 *     --hook "Sends welcome emails automatically" \
 *     --problem "Users weren't getting confirmation emails..." \
 *     --solution "Built Resend integration..." \
 *     --category "Business/SaaS" \
 *     --skills "GitHub,Stripe,Resend" \
 *     --requirements "Resend account, Stripe webhooks" \
 *     --author-username "josephliow" \
 *     --author-handle "josephliow" \
 *     --author-platform "twitter" \
 *     --author-link "https://twitter.com/josephliow"
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, 'config.json');
const config = fs.existsSync(configPath) 
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : {};

// API Configuration (env var overrides config file)
const API_URL = process.env.CLAWUSECASE_API_URL || config.apiUrl || 'clawusecase.com';
const API_PATH = process.env.CLAWUSECASE_API_PATH || config.apiPath || '/api/submissions';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '').replace(/-/g, '_');
    const value = args[i + 1];
    parsed[key] = value;
  }
  
  return parsed;
}

// Generate slug from title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Load or create config for author info
function getConfig() {
  const configPath = path.join(process.cwd(), '.clawusecase-config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
      console.error('⚠️  Failed to read config:', err.message);
    }
  }
  
  return {};
}

// Save config
function saveConfig(config) {
  const configPath = path.join(process.cwd(), '.clawusecase-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// Validate required fields
function validate(data) {
  const errors = [];
  
  if (!data.title || data.title.length < 20) {
    errors.push('Title must be at least 20 characters');
  }
  if (!data.hook || data.hook.length < 50) {
    errors.push('Hook must be at least 50 characters');
  }
  if (!data.problem || data.problem.length < 100) {
    errors.push('Problem must be at least 100 characters');
  }
  if (!data.solution || data.solution.length < 200) {
    errors.push('Solution must be at least 200 characters');
  }
  if (!data.category) {
    errors.push('Category is required');
  }
  if (!data.skills || data.skills.length === 0) {
    errors.push('At least one skill/tool is required');
  }
  if (!data.authorUsername) {
    errors.push('Author username is required');
  }
  
  return errors;
}

// Submit to API
async function submit(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    
    // Use http for localhost, https otherwise
    const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');
    const protocol = isLocalhost ? http : https;
    
    const options = {
      hostname: API_URL.replace(/:\d+$/, ''), // Remove port from hostname
      port: API_URL.match(/:(\d+)$/)?.[1] || (isLocalhost ? 3000 : 443),
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve(response);
          } else {
            reject(new Error(response.error || `HTTP ${res.statusCode}: ${body}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
    
    req.write(payload);
    req.end();
  });
}

// Main
async function main() {
  const args = parseArgs();
  
  // Load config for author info
  const config = getConfig();
  
  // Build submission data
  const data = {
    title: args.title,
    hook: args.hook,
    problem: args.problem,
    solution: args.solution,
    category: args.category,
    skills: args.skills ? args.skills.split(',').map(s => s.trim()) : [],
    requirements: args.requirements || undefined,
    authorUsername: args.author_username || config.authorUsername,
    authorHandle: args.author_handle || config.authorHandle,
    authorPlatform: args.author_platform || config.authorPlatform || 'twitter',
    authorLink: args.author_link || config.authorLink,
    slug: slugify(args.title),
    implementationPrompt: `I want to implement this use case from clawusecase.com:

**${args.title}**

Problem: ${args.problem}

Solution: ${args.solution}

Requirements: ${args.requirements || 'None specified'}

Tools needed: ${args.skills}

Can you help me build this step-by-step?`
  };
  
  // Validate
  const errors = validate(data);
  if (errors.length > 0) {
    console.error('❌ Validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  // Save author info to config for future use
  if (data.authorUsername && !config.authorUsername) {
    saveConfig({
      authorUsername: data.authorUsername,
      authorHandle: data.authorHandle,
      authorPlatform: data.authorPlatform,
      authorLink: data.authorLink
    });
  }
  
  // Submit
  try {
    console.error('📤 Submitting use case...');
    const result = await submit(data);
    
    // Output result as JSON for the assistant to parse
    console.log(JSON.stringify(result, null, 2));
    
  } catch (err) {
    console.error('❌ Submission failed:', err.message);
    
    // Check for specific error codes
    if (err.message.includes('429')) {
      console.error('⏰ Rate limit reached (10 submissions per day)');
      console.error('Try again tomorrow!');
    } else if (err.message.includes('400')) {
      console.error('📝 Validation error - check your inputs');
    }
    
    process.exit(1);
  }
}

main();
