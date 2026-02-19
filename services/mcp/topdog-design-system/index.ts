/**
 * @fileoverview TopDog Studio Design System MCP Server
 *
 * Exposes design tokens, component metadata, and design system resources
 * as an MCP server. Provides resources for colors, spacing, typography, and
 * component definitions that can be accessed by AI assistants.
 *
 * @module services/mcp/topdog-design-system
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Represents a single design token (color, spacing, typography, etc.)
 */
export interface DesignToken {
  readonly id: string;
  readonly category: "color" | "spacing" | "typography" | "shadow" | "border-radius";
  readonly name: string;
  readonly value: string;
  readonly description: string;
  readonly deprecated?: boolean;
}

/**
 * Metadata for a registered UI component
 */
export interface ComponentMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: "input" | "display" | "layout" | "navigation" | "feedback";
  readonly props: readonly string[];
  readonly accessibility?: readonly string[];
  readonly relatedComponents?: readonly string[];
}

/**
 * MCP resource representation for tool consumption
 */
export interface MCPResource {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
}

/**
 * MCP server configuration with resources and tools
 */
export interface MCPServerConfig {
  readonly name: string;
  readonly version: string;
  readonly resources: readonly MCPResource[];
  readonly tools: readonly { readonly name: string; readonly description: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens Data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default design tokens for TopDog Studio
 */
const DESIGN_TOKENS: readonly DesignToken[] = [
  // Primary Colors
  {
    id: "color-primary-50",
    category: "color",
    name: "Primary 50",
    value: "#f0f4ff",
    description: "Lightest primary color for backgrounds",
  },
  {
    id: "color-primary-500",
    category: "color",
    name: "Primary 500",
    value: "#3b82f6",
    description: "Main primary brand color",
  },
  {
    id: "color-primary-900",
    category: "color",
    name: "Primary 900",
    value: "#1e3a8a",
    description: "Darkest primary color for text",
  },

  // Secondary Colors
  {
    id: "color-secondary-500",
    category: "color",
    name: "Secondary 500",
    value: "#f59e0b",
    description: "Secondary accent color",
  },

  // Surface Colors
  {
    id: "color-surface-bg",
    category: "color",
    name: "Surface Background",
    value: "#ffffff",
    description: "Primary background color",
  },
  {
    id: "color-surface-elevated",
    category: "color",
    name: "Surface Elevated",
    value: "#f9fafb",
    description: "Elevated surface for cards and panels",
  },

  // Text Colors
  {
    id: "color-text-primary",
    category: "color",
    name: "Text Primary",
    value: "#111827",
    description: "Primary text color",
  },
  {
    id: "color-text-secondary",
    category: "color",
    name: "Text Secondary",
    value: "#6b7280",
    description: "Secondary text color for reduced emphasis",
  },

  // Spacing Scale
  {
    id: "spacing-xs",
    category: "spacing",
    name: "Extra Small",
    value: "4px",
    description: "Extra small spacing unit",
  },
  {
    id: "spacing-sm",
    category: "spacing",
    name: "Small",
    value: "8px",
    description: "Small spacing unit",
  },
  {
    id: "spacing-md",
    category: "spacing",
    name: "Medium",
    value: "16px",
    description: "Medium spacing unit",
  },
  {
    id: "spacing-lg",
    category: "spacing",
    name: "Large",
    value: "24px",
    description: "Large spacing unit",
  },
  {
    id: "spacing-xl",
    category: "spacing",
    name: "Extra Large",
    value: "32px",
    description: "Extra large spacing unit",
  },

  // Typography Scale
  {
    id: "typography-xs",
    category: "typography",
    name: "Extra Small",
    value: "12px / 16px",
    description: "Caption and helper text",
  },
  {
    id: "typography-sm",
    category: "typography",
    name: "Small",
    value: "14px / 20px",
    description: "Body small and labels",
  },
  {
    id: "typography-base",
    category: "typography",
    name: "Base",
    value: "16px / 24px",
    description: "Default body text",
  },
  {
    id: "typography-lg",
    category: "typography",
    name: "Large",
    value: "18px / 28px",
    description: "Emphasis text",
  },
  {
    id: "typography-h3",
    category: "typography",
    name: "Heading 3",
    value: "24px / 32px",
    description: "Section heading",
  },

  // Shadows
  {
    id: "shadow-sm",
    category: "shadow",
    name: "Small Shadow",
    value: "0 1px 2px 0 rgba(0,0,0,0.05)",
    description: "Subtle elevation shadow",
  },
  {
    id: "shadow-md",
    category: "shadow",
    name: "Medium Shadow",
    value: "0 4px 6px -1px rgba(0,0,0,0.1)",
    description: "Standard elevation shadow",
  },
  {
    id: "shadow-lg",
    category: "shadow",
    name: "Large Shadow",
    value: "0 10px 15px -3px rgba(0,0,0,0.1)",
    description: "Prominent elevation shadow",
  },

  // Border Radius
  {
    id: "radius-sm",
    category: "border-radius",
    name: "Small Radius",
    value: "4px",
    description: "Subtle rounding",
  },
  {
    id: "radius-md",
    category: "border-radius",
    name: "Medium Radius",
    value: "8px",
    description: "Standard rounding",
  },
  {
    id: "radius-lg",
    category: "border-radius",
    name: "Large Radius",
    value: "12px",
    description: "Generous rounding",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component Metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default component metadata registry
 */
const COMPONENTS: readonly ComponentMetadata[] = [
  {
    id: "btn",
    name: "Button",
    description: "Primary action button component",
    category: "input",
    props: ["variant", "size", "disabled", "loading"],
    accessibility: ["aria-label", "aria-disabled"],
    relatedComponents: ["btn-group"],
  },
  {
    id: "input",
    name: "Input Field",
    description: "Text input with validation",
    category: "input",
    props: ["type", "placeholder", "disabled", "required"],
    accessibility: ["aria-label", "aria-describedby"],
  },
  {
    id: "card",
    name: "Card",
    description: "Container for grouped content",
    category: "layout",
    props: ["variant", "padding", "bordered"],
    relatedComponents: ["section"],
  },
  {
    id: "badge",
    name: "Badge",
    description: "Small label or status indicator",
    category: "display",
    props: ["variant", "color", "size"],
  },
  {
    id: "alert",
    name: "Alert",
    description: "User notification or warning message",
    category: "feedback",
    props: ["type", "title", "dismissible"],
    accessibility: ["role=alert"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve all design tokens
 * @returns Readonly array of all design tokens
 */
export function getDesignTokens(): readonly DesignToken[] {
  return DESIGN_TOKENS;
}

/**
 * Get component metadata by ID
 * @param componentId - The component identifier
 * @returns Component metadata or undefined if not found
 */
export function getComponentMetadata(componentId: string): ComponentMetadata | undefined {
  return COMPONENTS.find((c) => c.id === componentId);
}

/**
 * List all registered components
 * @returns Readonly array of component metadata
 */
export function listComponents(): readonly ComponentMetadata[] {
  return COMPONENTS;
}

/**
 * Create the MCP server configuration with resources and tools
 * @returns MCP server configuration object
 */
export function createMCPServerConfig(): MCPServerConfig {
  // Custom URI scheme for Studio design system resources. MCP clients must implement topdog:// protocol handler.
  const resources: MCPResource[] = [
    {
      uri: "topdog://design-tokens/colors",
      name: "Color Tokens",
      description: "All color design tokens",
      mimeType: "application/json",
    },
    {
      uri: "topdog://design-tokens/spacing",
      name: "Spacing Tokens",
      description: "Spacing scale design tokens",
      mimeType: "application/json",
    },
    {
      uri: "topdog://design-tokens/typography",
      name: "Typography Tokens",
      description: "Typography scale design tokens",
      mimeType: "application/json",
    },
    {
      uri: "topdog://design-tokens/shadows",
      name: "Shadow Tokens",
      description: "Shadow elevation design tokens",
      mimeType: "application/json",
    },
    {
      uri: "topdog://components/list",
      name: "Component Registry",
      description: "All registered UI components",
      mimeType: "application/json",
    },
  ];

  const tools = [
    {
      name: "list-design-tokens",
      description: "Retrieve all design tokens by category",
    },
    {
      name: "get-component-metadata",
      description: "Fetch metadata for a specific component",
    },
    {
      name: "list-components",
      description: "List all registered components with metadata",
    },
  ];

  return {
    name: "topdog-design-system",
    version: "1.0.0",
    resources,
    tools,
  };
}
