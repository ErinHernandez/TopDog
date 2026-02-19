/**
 * @fileoverview TopDog Studio Canvas MCP Server
 *
 * Exposes tldraw canvas operations as MCP tools. Allows AI assistants to
 * perform canvas operations like adding shapes, moving/resizing, exporting,
 * and managing canvas state through a structured interface.
 *
 * @module services/mcp/topdog-canvas
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents a shape property or parameter
 */
export interface ShapeProperty {
  readonly key: string;
  readonly value: unknown;
}

/**
 * Definition of a shape to add to the canvas
 */
export interface ShapeDefinition {
  readonly type: "rectangle" | "circle" | "line" | "text" | "image";
  readonly position: { readonly x: number; readonly y: number };
  readonly size?: { readonly width: number; readonly height: number };
  readonly props?: readonly ShapeProperty[];
}

/**
 * Canvas operation to be executed
 */
export interface CanvasOperation {
  readonly operationType: "add" | "move" | "delete" | "export" | "clear";
  readonly shapeId?: string;
  readonly shape?: ShapeDefinition;
  readonly newPosition?: { readonly x: number; readonly y: number };
  readonly newSize?: { readonly width: number; readonly height: number };
  readonly format?: "svg" | "png";
}

/**
 * Result of a canvas operation
 */
export interface CanvasOperationResult {
  readonly success: boolean;
  readonly result?: unknown;
  readonly error?: string;
}

/**
 * Current canvas state snapshot
 */
export interface CanvasState {
  readonly shapes: readonly { readonly id: string; readonly definition: ShapeDefinition }[];
  readonly lastModified: Date;
  readonly version: number;
}

/**
 * MCP tool definition for canvas operations
 */
export interface MCPToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: {
    readonly type: string;
    readonly properties: Record<string, unknown>;
    readonly required: readonly string[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create the set of available canvas tools
 * @returns Readonly array of MCP tool definitions
 */
export function getCanvasTools(): readonly MCPToolDefinition[] {
  return [
    {
      name: "canvas_add_shape",
      description: "Add a new shape to the canvas",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["rectangle", "circle", "line", "text", "image"],
            description: "Shape type to add",
          },
          position: {
            type: "object",
            properties: {
              x: { type: "number", description: "X coordinate" },
              y: { type: "number", description: "Y coordinate" },
            },
            required: ["x", "y"],
            description: "Shape position",
          },
          size: {
            type: "object",
            properties: {
              width: { type: "number", description: "Width in pixels" },
              height: { type: "number", description: "Height in pixels" },
            },
            description: "Shape dimensions (optional)",
          },
          props: {
            type: "array",
            description: "Additional shape properties",
          },
        },
        required: ["type", "position"],
      },
    },
    {
      name: "canvas_move_shape",
      description: "Move or resize a shape on the canvas",
      inputSchema: {
        type: "object",
        properties: {
          shapeId: {
            type: "string",
            description: "ID of the shape to move",
          },
          position: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" },
            },
            description: "New position (optional)",
          },
          size: {
            type: "object",
            properties: {
              width: { type: "number" },
              height: { type: "number" },
            },
            description: "New size (optional)",
          },
        },
        required: ["shapeId"],
      },
    },
    {
      name: "canvas_delete_shape",
      description: "Delete a shape from the canvas",
      inputSchema: {
        type: "object",
        properties: {
          shapeId: {
            type: "string",
            description: "ID of the shape to delete",
          },
        },
        required: ["shapeId"],
      },
    },
    {
      name: "canvas_export",
      description: "Export the canvas as SVG or PNG",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["svg", "png"],
            description: "Export format",
          },
          filename: {
            type: "string",
            description: "Output filename (optional)",
          },
        },
        required: ["format"],
      },
    },
    {
      name: "canvas_clear",
      description: "Clear all shapes from the canvas",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas State Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-session state storage to prevent race conditions
 * Maps sessionId -> { canvasState, shapeIdCounter }
 */
interface SessionState {
  readonly canvasState: CanvasState;
  readonly shapeIdCounter: number;
}

const sessions = new Map<string, SessionState>();

/**
 * Initialize or get session state by sessionId
 * @param sessionId - Unique session identifier
 * @returns Session state for the given session
 */
function getOrCreateSessionState(sessionId: string): SessionState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      canvasState: {
        shapes: [],
        lastModified: new Date(),
        version: 1,
      },
      shapeIdCounter: 0,
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * Update session state
 * @param sessionId - Unique session identifier
 * @param updates - Partial updates to session state
 */
function updateSessionState(
  sessionId: string,
  updates: Partial<SessionState>,
): void {
  const current = getOrCreateSessionState(sessionId);
  sessions.set(sessionId, { ...current, ...updates });
}

// ─────────────────────────────────────────────────────────────────────────────
// Operation Handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate shape definition structure
 * @param shape - Shape definition to validate
 * @returns True if shape is valid
 */
function validateShapeDefinition(shape: ShapeDefinition): boolean {
  if (!shape.type || !shape.position) {
    return false;
  }
  if (typeof shape.position.x !== "number" || typeof shape.position.y !== "number") {
    return false;
  }
  return true;
}

/**
 * Execute a canvas operation
 * @param op - Canvas operation to execute
 * @param sessionId - Unique session identifier for state isolation
 * @returns Promise resolving to operation result
 */
export async function executeCanvasOperation(
  op: CanvasOperation,
  sessionId: string,
): Promise<CanvasOperationResult> {
  try {
    switch (op.operationType) {
      case "add": {
        if (!op.shape || !validateShapeDefinition(op.shape)) {
          return {
            success: false,
            error: "Invalid shape definition",
          };
        }
        const session = getOrCreateSessionState(sessionId);
        const newCounter = session.shapeIdCounter + 1;
        const shapeId = `shape-${newCounter}`;
        const newShapes = [
          ...session.canvasState.shapes,
          { id: shapeId, definition: op.shape },
        ];
        const updatedCanvasState: CanvasState = {
          ...session.canvasState,
          shapes: newShapes,
          lastModified: new Date(),
          version: session.canvasState.version + 1,
        };
        updateSessionState(sessionId, {
          canvasState: updatedCanvasState,
          shapeIdCounter: newCounter,
        });
        return {
          success: true,
          result: { shapeId, shape: op.shape },
        };
      }

      case "move": {
        if (!op.shapeId) {
          return {
            success: false,
            error: "Shape ID is required",
          };
        }
        const session = getOrCreateSessionState(sessionId);
        const shapeIndex = session.canvasState.shapes.findIndex((s) => s.id === op.shapeId);
        if (shapeIndex === -1) {
          return {
            success: false,
            error: `Shape with ID ${op.shapeId} not found`,
          };
        }
        const shape = session.canvasState.shapes[shapeIndex]!;
        const updatedDef: ShapeDefinition = {
          ...shape.definition,
          position: op.newPosition ?? shape.definition.position,
          size: op.newSize ?? shape.definition.size,
        };
        const updatedShapes = [...session.canvasState.shapes];
        updatedShapes[shapeIndex] = { id: shape.id, definition: updatedDef };
        const updatedCanvasState: CanvasState = {
          ...session.canvasState,
          shapes: updatedShapes,
          lastModified: new Date(),
          version: session.canvasState.version + 1,
        };
        updateSessionState(sessionId, { canvasState: updatedCanvasState });
        return {
          success: true,
          result: { shapeId: op.shapeId, definition: updatedDef },
        };
      }

      case "delete": {
        if (!op.shapeId) {
          return {
            success: false,
            error: "Shape ID is required",
          };
        }
        const session = getOrCreateSessionState(sessionId);
        const filteredShapes = session.canvasState.shapes.filter((s) => s.id !== op.shapeId);
        if (filteredShapes.length === session.canvasState.shapes.length) {
          return {
            success: false,
            error: `Shape with ID ${op.shapeId} not found`,
          };
        }
        const updatedCanvasState: CanvasState = {
          ...session.canvasState,
          shapes: filteredShapes,
          lastModified: new Date(),
          version: session.canvasState.version + 1,
        };
        updateSessionState(sessionId, { canvasState: updatedCanvasState });
        return {
          success: true,
          result: { deletedId: op.shapeId },
        };
      }

      case "export": {
        const format = op.format ?? "svg";
        const session = getOrCreateSessionState(sessionId);
        return {
          success: true,
          result: {
            format,
            shapeCount: session.canvasState.shapes.length,
            exportedAt: new Date().toISOString(),
          },
        };
      }

      case "clear": {
        const session = getOrCreateSessionState(sessionId);
        const updatedCanvasState: CanvasState = {
          shapes: [],
          lastModified: new Date(),
          version: session.canvasState.version + 1,
        };
        updateSessionState(sessionId, { canvasState: updatedCanvasState });
        return {
          success: true,
          result: { message: "Canvas cleared" },
        };
      }

      default:
        return {
          success: false,
          error: "Unknown operation type",
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get current canvas state for a session
 * @param sessionId - Unique session identifier
 * @returns Current canvas state snapshot
 */
export function getCanvasState(sessionId: string): CanvasState {
  const session = getOrCreateSessionState(sessionId);
  return { ...session.canvasState };
}

/**
 * Cleanup a session (remove from memory when session ends)
 * @param sessionId - Unique session identifier to cleanup
 */
export function cleanupSession(sessionId: string): void {
  sessions.delete(sessionId);
}
