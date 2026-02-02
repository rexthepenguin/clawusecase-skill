---
name: share-usecase
description: "Share your OpenClaw use case to clawusecase.com. Analyzes your recent work and creates a submission for the community."
author: "Rex 🐧"
version: "1.0.0"
---

# Share Use Case Skill

This skill helps you share your OpenClaw use cases to [clawusecase.com](https://clawusecase.com).

## When to Use

Trigger this skill when the user wants to share a use case they've built with OpenClaw. They might say:
- "/share-usecase"
- "I want to share this use case"
- "Let me submit this to clawusecase"
- "Share what I just built"

## How It Works

### 1. Analyze Recent Context

Look back at the conversation history (last 50-100 messages or past few hours) to understand what the user built. Look for:
- What problem they were trying to solve
- What tools/integrations they used (GitHub, Stripe, Resend, etc.)
- How they solved it
- Any requirements or setup needed

### 2. Generate Use Case Structure

Create a well-structured use case with these fields:

**Required:**
- `title` (50-100 chars) - Clear, descriptive title of what was built
- `hook` (100-200 chars) - One-sentence summary that grabs attention
- `problem` (200-500 chars) - What problem this solves
- `solution` (300-800 chars) - How it works, what was built
- `category` - One of: "Productivity", "Development", "Business/SaaS", "Home Automation", "Social/Content", "Data & Analytics", "Fun"
- `skills` (array) - Tools/technologies used (e.g., ["GitHub", "Stripe", "Resend"])

**Optional:**
- `requirements` - What you need to use this (API keys, accounts, etc.)

### 3. Normalize Tools/Skills

Before submitting, normalize tool names using `normalize-tools.js`:

```bash
node normalize-tools.js "github,stripe api,resend email"
```

This ensures consistent naming (e.g., "github" → "GitHub", "stripe api" → "Stripe").

### 4. Get User Approval

Present the generated use case to the user in a clean format:

```
📋 Use Case Ready for Submission

Title: Email notifications for Pro subscriptions
Hook: Sends welcome emails automatically when users upgrade

Problem: No email notifications when users subscribe to Pro plan
Solution: Built Resend integration with React Email templates, hooked into Stripe webhooks for subscription events

Category: Business/SaaS
Tools: GitHub, Stripe, Resend
Requirements: Resend account, Stripe webhooks configured

Ready to submit? (yes/no)
```

Ask if they want to:
- Submit as-is
- Edit any fields
- Cancel

### 5. Submit to API

Once approved, use `submit.js` to POST to the API:

```bash
node submit.js \
  --title "Email notifications for Pro subscriptions" \
  --hook "Sends welcome emails automatically when users upgrade" \
  --problem "No email notifications when users subscribe to Pro plan" \
  --solution "Built Resend integration with React Email templates..." \
  --category "Business/SaaS" \
  --skills "GitHub,Stripe,Resend" \
  --requirements "Resend account, Stripe webhooks configured" \
  --author-username "josephliow" \
  --author-handle "josephliow" \
  --author-platform "twitter" \
  --author-link "https://twitter.com/josephliow"
```

### 6. Confirm Submission

If successful, the script returns:
```json
{
  "success": true,
  "slug": "email-notifications-for-pro-subscriptions",
  "url": "https://clawusecase.com/cases/email-notifications-for-pro-subscriptions"
}
```

Share the link with the user:
```
✅ Use case submitted successfully!

View it here: https://clawusecase.com/cases/email-notifications-for-pro-subscriptions

Thanks for sharing with the community! 🎉
```

## Error Handling

### Rate Limiting
If you get a 429 error:
```
⏰ You've hit the submission limit (10 per day).
Try again tomorrow or contact support if you need to submit more.
```

### Validation Errors
If fields are invalid (title too short, solution too brief):
```
❌ Submission failed: Title must be at least 20 characters

Let's fix that. What would you like the title to be?
```

### API Errors
For other errors, show the error message and offer to retry.

## Author Information

On first use, ask the user for their attribution info:

```
To submit use cases, I need your info for attribution:

1. What's your Twitter/X handle? (e.g., josephliow)
2. What platform? (twitter, github, etc.)

I'll save this for future submissions.
```

Store it locally in `.clawusecase-config.json`:
```json
{
  "authorUsername": "josephliow",
  "authorHandle": "josephliow",
  "authorPlatform": "twitter",
  "authorLink": "https://twitter.com/josephliow"
}
```

This is saved in the skill directory for future use.

## Tips for Good Use Cases

Help users create high-quality submissions:

**Good Title:**
- ✅ "Email notifications for Pro subscriptions"
- ❌ "Email thing I built"

**Good Hook:**
- ✅ "Sends welcome emails automatically when users upgrade"
- ❌ "Sends emails"

**Good Problem:**
- ✅ "Users who upgraded to Pro weren't getting confirmation emails, causing confusion and support tickets"
- ❌ "No emails"

**Good Solution:**
- ✅ "Built a Resend integration with React Email templates. Set up Stripe webhooks to trigger on subscription.created events. Template includes upgrade details and next steps."
- ❌ "Made it send emails with Stripe"

## Category Guidelines

Help users pick the right category:

- **Productivity** - Task management, scheduling, reminders, automation
- **Development** - CI/CD, code review, deployment, testing
- **Business/SaaS** - Customer management, billing, analytics, marketing
- **Home Automation** - Smart home, IoT, cameras, sensors
- **Social/Content** - Social media, content creation, publishing
- **Data & Analytics** - Reports, dashboards, data processing
- **Fun** - Games, experiments, creative projects, humor

## Rate Limiting

Users can submit up to **10 use cases per day**. The API tracks by `authorUsername`.

If they hit the limit, suggest:
- Wait until tomorrow
- Make sure each submission is unique and valuable
- Contact support if they need a higher limit

## Quality Guidelines

The API has automatic quality filtering. Submissions must:
- Title: 20-200 characters
- Hook: 50-500 characters  
- Problem: 100-2000 characters
- Solution: 200-5000 characters
- At least 1 skill/tool
- Valid category

Help users meet these requirements before submitting.

## Example Interaction

```
User: I just built email notifications for when users subscribe
You: That sounds useful! Want to share it as a use case on clawusecase.com?
User: Yeah!
You: [analyzes recent conversation]

📋 I've drafted a use case based on our conversation:

Title: Email notifications for Pro subscriptions
Hook: Automatically sends welcome emails when users upgrade to Pro

Problem: Users upgrading to Pro weren't receiving confirmation emails, leading to confusion and support tickets about whether their payment went through.

Solution: Built a Resend email integration with custom React Email templates. Connected to Stripe webhooks to listen for subscription.created events. The welcome email includes upgrade confirmation, receipt, and next steps for accessing Pro features.

Category: Business/SaaS
Tools: Stripe, Resend, React, GitHub
Requirements: Resend account, Stripe webhooks configured

Does this look good, or would you like to edit anything?

User: Looks perfect!
You: [submits via submit.js]

✅ Use case submitted!

View it here: https://clawusecase.com/cases/email-notifications-for-pro-subscriptions

Your use case is now live for the community to see. Thanks for sharing! 🎉
```

## Files in This Skill

- `SKILL.md` - This file (instructions)
- `submit.js` - Submits use case to clawusecase.com API
- `normalize-tools.js` - Normalizes tool/skill names
- `README.md` - User documentation
- `.clawusecase-config.json` - Stores user's author info (created on first use)

## Troubleshooting

**"Command not found: node"**
Node.js is required. Install it: `brew install node` (macOS) or from nodejs.org

**"Failed to connect to API"**
Check internet connection and that clawusecase.com is accessible.
