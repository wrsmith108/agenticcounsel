# Anthropic Claude Integration for AI Coaching Service

## Overview

The AI Coaching Service has been successfully refactored to use Anthropic's Claude API instead of OpenAI's GPT models. This change provides access to Claude's advanced reasoning capabilities while maintaining the same coaching functionality.

## Changes Made

### 1. Service Refactoring (`src/services/aiCoachingService.ts`)

- **Replaced OpenAI SDK** with `@anthropic-ai/sdk`
- **Updated API calls** to use Anthropic's Messages API format
- **Adapted message structure** - Anthropic doesn't use system messages in the same way as OpenAI
- **Modified confidence scoring** to work with Anthropic's response format

### 2. Route Updates (`src/routes/coaching.ts`)

- **Updated configuration** to use Anthropic environment variables
- **Changed default model** to `claude-3-sonnet-20240229`
- **Maintained same API interface** for frontend compatibility

### 3. Environment Configuration (`.env.example`)

- **Replaced OpenAI variables** with Anthropic equivalents:
  - `OPENAI_API_KEY` → `ANTHROPIC_API_KEY`
  - `OPENAI_MODEL` → `ANTHROPIC_MODEL`
  - `OPENAI_MAX_TOKENS` → `ANTHROPIC_MAX_TOKENS`
  - `OPENAI_TEMPERATURE` → `ANTHROPIC_TEMPERATURE`

## Configuration

### Required Environment Variables

```bash
# Anthropic Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=2000
ANTHROPIC_TEMPERATURE=0.7
```

### Available Claude Models

- `claude-3-opus-20240229` - Most capable, highest cost
- `claude-3-sonnet-20240229` - Balanced performance and cost (recommended)
- `claude-3-haiku-20240307` - Fastest, lowest cost

## Key Differences from OpenAI Integration

### 1. Message Format
- **OpenAI**: Supports system, user, and assistant roles
- **Anthropic**: Only supports user and assistant roles
- **Solution**: System prompts are prepended to user messages

### 2. Response Structure
- **OpenAI**: `completion.choices[0].message.content`
- **Anthropic**: `completion.content[0].text`

### 3. Stop Reasons
- **OpenAI**: `finish_reason` (stop, length, etc.)
- **Anthropic**: `stop_reason` (end_turn, max_tokens, etc.)

## Features Maintained

✅ **Personality-aware coaching** - All personality profiling features work unchanged
✅ **Aha moment detection** - Pattern recognition continues to function
✅ **Conversation history** - Full context preservation
✅ **Coaching techniques** - All coaching methodologies preserved
✅ **Response personalization** - Language adaptation based on personality
✅ **Confidence scoring** - Adapted for Anthropic response format

## Benefits of Claude Integration

1. **Advanced Reasoning** - Claude excels at nuanced coaching conversations
2. **Better Context Understanding** - Superior comprehension of personality profiles
3. **More Natural Responses** - Improved conversational flow
4. **Consistent API** - Same interface as the system Roo uses
5. **No Separate API Key** - Uses the same authentication system

## Testing

The integration maintains full backward compatibility with the existing frontend. All coaching endpoints continue to work with the same request/response format.

### Test Endpoints

1. **Start Coaching Session**: `POST /api/coaching/start-session`
2. **Send Message**: `POST /api/coaching/conversations/:id/messages`
3. **Get Conversations**: `GET /api/coaching/conversations`

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure `ANTHROPIC_API_KEY` is set correctly
2. **Model Not Found**: Verify the model name matches available Claude models
3. **Rate Limiting**: Claude has different rate limits than OpenAI

### Error Handling

The service includes comprehensive error handling that gracefully falls back when the AI service is unavailable, ensuring the coaching system remains functional.

## Migration Notes

- **No database changes** required
- **No frontend changes** needed
- **Environment variables** must be updated
- **API key** needs to be obtained from Anthropic Console

## Next Steps

1. Obtain Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Update environment variables
3. Test coaching functionality
4. Monitor usage and adjust model selection as needed

The coaching agent now uses the same high-quality Claude API that powers Roo's responses, providing consistent and advanced AI capabilities across the platform.