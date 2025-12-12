/**
 * VX Module - Central Export
 * 
 * Import everything from VX in one place:
 * 
 * import { 
 *   // Components
 *   PositionBadge, TeamLogo, LoadingSpinner, ErrorBoundary,
 *   // Hooks
 *   useTimer, useAutoScroll, useLocalStorage,
 *   // Constants
 *   POSITION_COLORS, BG_COLORS, MOBILE,
 *   // Utilities
 *   formatPlayerName, getByeWeek,
 *   // Types
 *   Player, Participant, Pick,
 * } from '@/components/vx';
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  // Colors
  POSITION_COLORS,
  BRAND_COLORS,
  BG_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  STATE_COLORS,
  UI_COLORS,
  NFL_TEAM_COLORS,
  getPositionColor,
  getTeamColors,
  // Sizes
  TOUCH_TARGETS,
  MOBILE,
  TABLET,
  DESKTOP,
  SPACING,
  TYPOGRAPHY,
  FONT_SIZE,
  BREAKPOINTS,
  PLATFORM,
  Z_INDEX,
  // Positions
  POSITIONS,
  FLEX_POSITIONS,
  FILTER_POSITIONS,
  STARTING_LINEUP,
  BENCH_SPOTS,
  ROSTER_SIZE,
  ROSTER_REQUIREMENTS,
  POSITION_CONFIG,
  SORT_OPTIONS,
  isFlexEligible,
  getPositionConfig,
  filterByPosition,
  // Animations
  DURATION,
  DURATION_MS,
  EASING,
  TRANSITION,
  KEYFRAMES,
  ANIMATION_CLASSES,
  prefersReducedMotion,
  getAnimationDuration,
} from './constants';

export type {
  PositionColorKey,
  FantasyPosition,
  RosterPosition,
  AllPositions,
  PositionConfig,
  SortDirection,
  SortField,
  SortOption,
} from './constants';

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

export {
  // Position badge
  PositionBadge,
  PositionBadgeInline,
  // Loading
  LoadingSpinner,
  Skeleton,
  PlayerRowSkeleton,
  PickCardSkeleton,
  // Error handling
  ErrorBoundary,
  withErrorBoundary,
  InlineError,
  // Team logo
  TeamLogo,
  TeamLogoSmall,
  TeamLogoLarge,
  // Modal/Sheet
  Modal,
  Sheet,
  ConfirmDialog,
  // Toast
  ToastProvider,
  useToast,
  // Button
  Button,
  IconButton,
  // Input
  Input,
  SearchInput,
  Select,
  Textarea,
  // Card
  Card,
  CardHeader,
  CardFooter,
  CardContent,
  // Badge
  Badge,
  StatusBadge,
  CountBadge,
  PositionTag,
  // Empty State
  EmptyState,
  NoSearchResults,
  NoPlayers,
  EmptyQueue,
  ErrorState,
  SuccessState,
  // Tabs
  Tabs,
  TabPanel,
  SegmentedControl,
  // Progress
  ProgressBar,
  CircularProgress,
  DraftProgress,
  PositionProgress,
  Steps,
  // Avatar
  Avatar,
  AvatarGroup,
  UserAvatar,
  // Divider
  Divider,
  SectionHeader,
  // Switch
  Switch,
  SwitchGroup,
  // Menu
  Menu,
  ActionMenu,
  // Stat
  Stat,
  StatGroup,
  StatCard,
  InlineStat,
  StatList,
  // Countdown
  Countdown,
  DraftTimer,
  SimpleTimer,
  // Icons
  Icons,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  X,
  Check,
  Edit,
  Trash,
  Copy,
  Share,
  Download,
  Upload,
  Search,
  Filter,
  Sort,
  Menu as MenuIcon,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Refresh,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Users,
  Play,
  Pause,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart,
  Grid,
  List,
  Star,
  StarFilled,
  Heart,
  Eye,
  EyeOff,
} from './shared';

export type {
  PositionBadgeProps,
  PositionBadgeInlineProps,
  LoadingSpinnerProps,
  SkeletonProps,
  ErrorBoundaryProps,
  InlineErrorProps,
  TeamLogoProps,
  ModalProps,
  SheetProps,
  ConfirmDialogProps,
  Toast,
  ToastType,
  ToastContextType,
  ToastProviderProps,
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  IconButtonProps,
  InputProps,
  SearchInputProps,
  SelectProps,
  TextareaProps,
  CardProps,
  CardHeaderProps,
  CardFooterProps,
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  StatusBadgeProps,
  CountBadgeProps,
  PositionTagProps,
  EmptyStateProps,
  Tab,
  TabsProps,
  TabPanelProps,
  SegmentedControlProps,
  ProgressBarProps,
  CircularProgressProps,
  DraftProgressProps,
  PositionProgressProps,
  StepsProps,
  AvatarProps,
  AvatarSize,
  AvatarGroupProps,
  DividerProps,
  SectionHeaderProps,
  SwitchProps,
  SwitchGroupProps,
  MenuItem,
  MenuProps,
  ActionMenuItem,
  ActionMenuProps,
  StatProps,
  StatGroupProps,
  StatCardProps,
  InlineStatProps,
  StatListProps,
  CountdownProps,
  DraftTimerProps,
  SimpleTimerProps,
  IconProps,
  // Data types
  Player,
  Participant,
  Pick,
  DraftState,
} from './shared';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  // NFL data
  BYE_WEEKS,
  TEAM_NAMES,
  getByeWeek,
  getTeamName,
  // Formatting
  formatPlayerName,
  formatPlayerNameShort,
  formatPickNumber,
  formatADP,
  formatProjection,
  // Draft helpers
  getParticipantForPick,
  // String utilities
  truncate,
  truncateWithEllipsis,
} from './shared';

// ============================================================================
// HOOKS
// ============================================================================

export {
  // Timer
  useTimer,
  useCountdown,
  // Scroll
  useAutoScroll,
  useScrollToPick,
  useHorizontalScroll,
  // Storage
  useLocalStorage,
  useSortPreference,
  useFilterPreference,
  useViewMode,
  useCollapsedState,
} from './hooks';

export type {
  UseTimerOptions,
  UseTimerReturn,
  UseCountdownOptions,
  UseAutoScrollOptions,
  UseAutoScrollReturn,
  UseScrollToPickOptions,
  UseHorizontalScrollReturn,
} from './hooks';
