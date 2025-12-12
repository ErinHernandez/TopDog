/**
 * VX Shared Components - Index
 */

export { default as PositionBadge, PositionBadgeInline } from './PositionBadge';
export type { PositionBadgeProps, PositionBadgeInlineProps } from './PositionBadge';

// Loading components
export { 
  default as LoadingSpinner,
  Skeleton,
  PlayerRowSkeleton,
  PickCardSkeleton,
} from './LoadingSpinner';
export type { LoadingSpinnerProps, SkeletonProps } from './LoadingSpinner';

// Error handling
export {
  default as ErrorBoundary,
  withErrorBoundary,
  InlineError,
} from './ErrorBoundary';
export type { ErrorBoundaryProps, InlineErrorProps } from './ErrorBoundary';

// Team logo
export {
  default as TeamLogo,
  TeamLogoSmall,
  TeamLogoLarge,
} from './TeamLogo';
export type { TeamLogoProps } from './TeamLogo';

// Modal/Sheet
export {
  default as Modal,
  Sheet,
  ConfirmDialog,
} from './Modal';
export type { ModalProps, SheetProps, ConfirmDialogProps } from './Modal';

// Toast notifications
export {
  default as ToastProvider,
  useToast,
} from './Toast';
export type { Toast, ToastType, ToastContextType, ToastProviderProps } from './Toast';

// Button
export {
  default as Button,
  IconButton,
} from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize, IconButtonProps } from './Button';

// Input
export {
  Input,
  SearchInput,
  Select,
  Textarea,
} from './Input';
export type { InputProps, SearchInputProps, SelectProps, TextareaProps } from './Input';

// Card
export {
  default as Card,
  CardHeader,
  CardFooter,
  CardContent,
} from './Card';
export type { CardProps, CardHeaderProps, CardFooterProps } from './Card';

// Badge
export {
  default as Badge,
  StatusBadge,
  CountBadge,
  PositionTag,
} from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize, StatusBadgeProps, CountBadgeProps, PositionTagProps } from './Badge';

// Empty State
export {
  default as EmptyState,
  NoSearchResults,
  NoPlayers,
  EmptyQueue,
  ErrorState,
  SuccessState,
} from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// Tabs
export {
  default as Tabs,
  TabPanel,
  SegmentedControl,
} from './Tabs';
export type { Tab, TabsProps, TabPanelProps, SegmentedControlProps } from './Tabs';

// Progress
export {
  default as ProgressBar,
  CircularProgress,
  DraftProgress,
  PositionProgress,
  Steps,
} from './Progress';
export type { ProgressBarProps, CircularProgressProps, DraftProgressProps, PositionProgressProps, StepsProps } from './Progress';

// Avatar
export {
  default as Avatar,
  AvatarGroup,
  UserAvatar,
} from './Avatar';
export type { AvatarProps, AvatarSize, AvatarGroupProps } from './Avatar';

// Divider
export {
  default as Divider,
  SectionHeader,
} from './Divider';
export type { DividerProps, SectionHeaderProps } from './Divider';

// Switch
export {
  default as Switch,
  SwitchGroup,
} from './Switch';
export type { SwitchProps, SwitchGroupProps } from './Switch';

// Menu
export {
  default as Menu,
  ActionMenu,
} from './Menu';
export type { MenuItem, MenuProps, ActionMenuItem, ActionMenuProps } from './Menu';

// Stat
export {
  default as Stat,
  StatGroup,
  StatCard,
  InlineStat,
  StatList,
} from './Stat';
export type { StatProps, StatGroupProps, StatCardProps, InlineStatProps, StatListProps } from './Stat';

// Countdown
export {
  default as Countdown,
  DraftTimer,
  SimpleTimer,
} from './Countdown';
export type { CountdownProps, DraftTimerProps, SimpleTimerProps } from './Countdown';

// Icons
export {
  default as Icons,
  // Navigation
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  // Actions
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
  // UI
  Search,
  Filter,
  Sort,
  Menu as MenuIcon,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Refresh,
  // Status
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  // User
  User,
  Users,
  // Media
  Play,
  Pause,
  // Draft
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
} from './Icons';
export type { IconProps } from './Icons';

// Shared types
export type { Player, Participant, Pick, DraftState } from './types';

// Shared utilities
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
} from './utils';

