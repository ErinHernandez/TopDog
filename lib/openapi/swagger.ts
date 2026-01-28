/**
 * OpenAPI/Swagger Configuration
 *
 * Generates OpenAPI 3.0 specification for all TopDog API endpoints.
 * This provides documentation and enables API clients generation.
 *
 * @module lib/openapi/swagger
 */

import type { OpenAPIV3 } from 'openapi-types';

/**
 * TopDog API OpenAPI Specification
 */
export const openAPISpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'TopDog Fantasy Football API',
    version: '1.0.0',
    description: `
TopDog Fantasy Football API provides endpoints for:
- User authentication and profile management
- Draft room operations
- Payment processing (Stripe, Paystack, PayMongo, Xendit)
- NFL player and schedule data
- Tournament management

## Authentication
Most endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:
\`\`\`
Authorization: Bearer <firebase-id-token>
\`\`\`

## Rate Limiting
API endpoints are rate limited to prevent abuse:
- Payment endpoints: 10 requests/minute
- Draft endpoints: 60 requests/minute
- General endpoints: 100 requests/minute

## Error Responses
All errors follow a standard format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
\`\`\`
    `,
    contact: {
      name: 'TopDog Support',
      email: 'support@topdog.com',
    },
  },
  servers: [
    {
      url: 'https://topdog.com/api',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Development',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Users', description: 'User profile and settings management' },
    { name: 'Drafts', description: 'Draft room and draft operations' },
    { name: 'Payments', description: 'Payment processing and transactions' },
    { name: 'NFL', description: 'NFL player and schedule data' },
    { name: 'Tournaments', description: 'Tournament management' },
    { name: 'Webhooks', description: 'Payment provider webhooks' },
    { name: 'Health', description: 'System health checks' },
  ],
  paths: {
    // Health endpoints
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns the health status of the API',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Authentication endpoints
    '/auth/verify-token': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify Firebase token',
        description: 'Verifies a Firebase ID token and returns user information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Token is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // User endpoints
    '/user/profile': {
      get: {
        tags: ['Users'],
        summary: 'Get user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserProfileUpdate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // NFL endpoints
    '/nfl/players': {
      get: {
        tags: ['NFL'],
        summary: 'Get NFL players',
        description: 'Returns all NFL players with stats and projections',
        parameters: [
          {
            name: 'position',
            in: 'query',
            schema: { type: 'string', enum: ['QB', 'RB', 'WR', 'TE'] },
            description: 'Filter by position',
          },
          {
            name: 'team',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by team abbreviation',
          },
          {
            name: 'forceRefresh',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Force refresh from data source',
          },
        ],
        responses: {
          '200': {
            description: 'List of players',
            headers: {
              'Cache-Control': {
                schema: { type: 'string' },
                description: 'Caching directive',
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    players: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NFLPlayer' },
                    },
                    lastUpdated: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/nfl/schedule': {
      get: {
        tags: ['NFL'],
        summary: 'Get NFL schedule',
        description: 'Returns the NFL schedule for the current season',
        parameters: [
          {
            name: 'week',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 18 },
            description: 'Filter by week number',
          },
        ],
        responses: {
          '200': {
            description: 'NFL schedule',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    schedule: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/NFLGame' },
                    },
                    currentWeek: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Payment endpoints
    '/stripe/payment-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create Stripe payment intent',
        description: 'Creates a payment intent for deposits',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: {
                    type: 'integer',
                    minimum: 100,
                    description: 'Amount in cents',
                  },
                  currency: {
                    type: 'string',
                    default: 'usd',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment intent created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clientSecret: { type: 'string' },
                    paymentIntentId: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { $ref: '#/components/responses/RateLimited' },
        },
      },
    },

    // Webhook endpoints
    '/stripe/webhook': {
      post: {
        tags: ['Webhooks'],
        summary: 'Stripe webhook',
        description: 'Receives Stripe webhook events. Signature verified.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    received: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/paystack/webhook': {
      post: {
        tags: ['Webhooks'],
        summary: 'Paystack webhook',
        description: 'Receives Paystack webhook events. Signature verified.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed',
          },
        },
      },
    },

    '/paymongo/webhook': {
      post: {
        tags: ['Webhooks'],
        summary: 'PayMongo webhook',
        description: 'Receives PayMongo webhook events. Signature verified.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed',
          },
        },
      },
    },

    '/xendit/webhook': {
      post: {
        tags: ['Webhooks'],
        summary: 'Xendit webhook',
        description: 'Receives Xendit webhook events. Token verified.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook processed',
          },
        },
      },
    },

    // Draft endpoints
    '/draft/join': {
      post: {
        tags: ['Drafts'],
        summary: 'Join a draft room',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roomId'],
                properties: {
                  roomId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successfully joined',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    seat: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': {
            description: 'Room full or already joined',
          },
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Firebase ID token',
      },
    },

    schemas: {
      User: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          email: { type: 'string', format: 'email' },
          emailVerified: { type: 'boolean' },
          displayName: { type: 'string' },
        },
      },

      UserProfile: {
        type: 'object',
        properties: {
          uid: { type: 'string' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          balance: { type: 'number', description: 'Balance in cents' },
          createdAt: { type: 'string', format: 'date-time' },
          preferences: {
            type: 'object',
            properties: {
              notifications: { type: 'boolean' },
              emailUpdates: { type: 'boolean' },
            },
          },
        },
      },

      UserProfileUpdate: {
        type: 'object',
        properties: {
          displayName: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          preferences: { type: 'object' },
        },
      },

      NFLPlayer: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          team: { type: 'string' },
          position: { type: 'string', enum: ['QB', 'RB', 'WR', 'TE'] },
          adp: { type: 'number' },
          projectedPoints: { type: 'number' },
          bye: { type: 'integer' },
          injuryStatus: { type: 'string' },
        },
      },

      NFLGame: {
        type: 'object',
        properties: {
          gameId: { type: 'string' },
          week: { type: 'integer' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          gameTime: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
        },
      },

      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
    },

    responses: {
      BadRequest: {
        description: 'Bad request - invalid parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - invalid or missing authentication',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      RateLimited: {
        description: 'Too many requests',
        headers: {
          'Retry-After': {
            schema: { type: 'integer' },
            description: 'Seconds until rate limit resets',
          },
        },
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
};

export default openAPISpec;
