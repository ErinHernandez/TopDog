/**
 * VX Components Showcase
 * 
 * A page to preview and test all shared VX components.
 */

import React, { useState } from 'react';
import Head from 'next/head';

// Import all shared components
import {
  // Buttons
  Button,
  IconButton,
  // Inputs
  Input,
  SearchInput,
  Select,
  // Cards
  Card,
  CardHeader,
  CardFooter,
  // Badges
  Badge,
  StatusBadge,
  CountBadge,
  PositionTag,
  // Modals
  Modal,
  Sheet,
  ConfirmDialog,
  // Toast
  ToastProvider,
  useToast,
  // Navigation
  Tabs,
  TabPanel,
  SegmentedControl,
  // Progress
  ProgressBar,
  CircularProgress,
  DraftProgress,
  PositionProgress,
  Steps,
  // Stats
  Stat,
  StatGroup,
  StatCard,
  InlineStat,
  StatList,
  // Countdown
  Countdown,
  DraftTimer,
  SimpleTimer,
  // Avatar
  Avatar,
  AvatarGroup,
  UserAvatar,
  // Layout
  Divider,
  SectionHeader,
  // Switch
  Switch,
  SwitchGroup,
  // Menu
  Menu,
  ActionMenu,
  // Empty States
  EmptyState,
  EmptyQueue,
  NoPlayers,
  ErrorState,
  // Loading
  LoadingSpinner,
  Skeleton,
  // Position
  PositionBadge,
  PositionBadgeInline,
  // Team
  TeamLogo,
  // Constants
  POSITION_COLORS,
  BG_COLORS,
  TEXT_COLORS,
} from '../../components/vx';

// ============================================================================
// SHOWCASE SECTIONS
// ============================================================================

function ButtonsSection() {
  return (
    <ShowcaseSection title="Buttons">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button fullWidth>Full Width</Button>
        </div>
        <div className="flex gap-3">
          <IconButton
            icon={<PlusIcon />}
            variant="primary"
            aria-label="Add"
          />
          <IconButton
            icon={<CloseIcon />}
            variant="secondary"
            aria-label="Close"
          />
          <IconButton
            icon={<MenuIcon />}
            variant="ghost"
            aria-label="Menu"
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function InputsSection() {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [select, setSelect] = useState('');

  return (
    <ShowcaseSection title="Inputs">
      <div className="space-y-4 max-w-md">
        <Input
          label="Username"
          value={text}
          onChange={setText}
          placeholder="Enter username..."
        />
        <Input
          label="With Error"
          value=""
          onChange={() => {}}
          error="This field is required"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search players..."
        />
        <Select
          value={select}
          onChange={setSelect}
          options={[
            { value: '', label: 'Select position...' },
            { value: 'QB', label: 'Quarterback' },
            { value: 'RB', label: 'Running Back' },
            { value: 'WR', label: 'Wide Receiver' },
            { value: 'TE', label: 'Tight End' },
          ]}
        />
      </div>
    </ShowcaseSection>
  );
}

function BadgesSection() {
  return (
    <ShowcaseSection title="Badges">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="success" label="Active" />
          <StatusBadge status="warning" label="Pending" />
          <StatusBadge status="error" label="Eliminated" />
        </div>
        <div className="flex flex-wrap gap-3">
          <CountBadge count={5} />
          <CountBadge count={42} />
          <CountBadge count={150} max={99} />
        </div>
        <div className="flex flex-wrap gap-3">
          <PositionTag position="QB" />
          <PositionTag position="RB" />
          <PositionTag position="WR" />
          <PositionTag position="TE" />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function CardsSection() {
  return (
    <ShowcaseSection title="Cards">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4">Basic Card</div>
        </Card>
        <Card variant="elevated">
          <CardHeader title="With Header" />
          <div className="p-4">Card content here</div>
        </Card>
        <Card>
          <CardHeader 
            title="Full Card" 
            action={<IconButton icon={<CloseIcon />} size="sm" variant="ghost" />}
          />
          <div className="p-4">Card with header and footer</div>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </div>
    </ShowcaseSection>
  );
}

function ProgressSection() {
  return (
    <ShowcaseSection title="Progress">
      <div className="space-y-6 max-w-md">
        <div>
          <div className="text-sm text-gray-400 mb-2">Progress Bar</div>
          <ProgressBar value={65} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">With Label</div>
          <ProgressBar value={42} showLabel labelPosition="top" />
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-sm text-gray-400 mb-2">Circular</div>
            <CircularProgress value={75} size={64} />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Draft Timer</div>
            <DraftTimer seconds={25} isUserTurn showRing totalTime={30} />
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Position Progress</div>
          <PositionProgress counts={{ QB: 1, RB: 4, WR: 5, TE: 2 }} />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Steps</div>
          <Steps
            steps={[
              { label: 'Queue', completed: true },
              { label: 'Draft' },
              { label: 'Review' },
            ]}
            currentStep={1}
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function StatsSection() {
  return (
    <ShowcaseSection title="Statistics">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-2">Stat Group</div>
          <StatGroup
            stats={[
              { label: 'Points', value: '285.4', trend: 'up', trendValue: '+12%' },
              { label: 'Rank', value: '3', sublabel: 'of 12' },
              { label: 'ADP', value: '2.4' },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <StatCard label="Projected" value="1,820" trend="up" trendValue="+5%" />
          <StatCard label="Current" value="145.6" />
        </div>
        <div className="max-w-xs">
          <div className="text-sm text-gray-400 mb-2">Stat List</div>
          <StatList
            items={[
              { label: 'Entry Fee', value: '$25' },
              { label: 'Entries', value: '571,480' },
              { label: '1st Place', value: '$2M' },
            ]}
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function CountdownSection() {
  return (
    <ShowcaseSection title="Countdown & Timers">
      <div className="space-y-6">
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-gray-400 mb-2">Full Format</div>
            <Countdown seconds={3725} format="full" />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Compact</div>
            <Countdown seconds={185} format="compact" />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Minimal</div>
            <Countdown seconds={45} format="minimal" size="lg" />
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-gray-400 mb-2">Draft Timer (Safe)</div>
            <DraftTimer seconds={25} showRing totalTime={30} />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Warning</div>
            <DraftTimer seconds={8} showRing totalTime={30} />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2">Danger</div>
            <DraftTimer seconds={3} showRing totalTime={30} />
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

function AvatarsSection() {
  return (
    <ShowcaseSection title="Avatars">
      <div className="space-y-6">
        <div className="flex gap-4 items-end">
          <Avatar name="John Doe" size="xs" />
          <Avatar name="Jane Smith" size="sm" />
          <Avatar name="Bob Wilson" size="md" />
          <Avatar name="Alice Brown" size="lg" />
          <Avatar name="Charlie Davis" size="xl" />
        </div>
        <div className="flex gap-4">
          <Avatar name="Online User" status="online" />
          <Avatar name="Away User" status="away" />
          <Avatar name="Busy User" status="busy" />
          <Avatar name="Offline User" status="offline" />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Avatar Group</div>
          <AvatarGroup
            avatars={[
              { name: 'User 1' },
              { name: 'User 2' },
              { name: 'User 3' },
              { name: 'User 4' },
              { name: 'User 5' },
            ]}
            max={3}
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function NavigationSection() {
  const [activeTab, setActiveTab] = useState('players');
  const [segment, setSegment] = useState('all');

  return (
    <ShowcaseSection title="Navigation">
      <div className="space-y-6 max-w-md">
        <div>
          <div className="text-sm text-gray-400 mb-2">Tabs (Default)</div>
          <Tabs
            tabs={[
              { id: 'players', label: 'Players', badge: 3 },
              { id: 'queue', label: 'Queue' },
              { id: 'roster', label: 'Roster' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Tabs (Underline)</div>
          <Tabs
            tabs={[
              { id: 'players', label: 'Players' },
              { id: 'queue', label: 'Queue' },
              { id: 'roster', label: 'Roster' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-2">Segmented Control</div>
          <SegmentedControl
            options={[
              { value: 'all', label: 'All' },
              { value: 'qb', label: 'QB' },
              { value: 'rb', label: 'RB' },
              { value: 'wr', label: 'WR' },
            ]}
            value={segment}
            onChange={setSegment}
            fullWidth
          />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function SwitchSection() {
  const [checked, setChecked] = useState(false);

  return (
    <ShowcaseSection title="Switches">
      <div className="space-y-4 max-w-md">
        <Switch
          checked={checked}
          onChange={setChecked}
          label="Autopick"
          description="Automatically select best available player when timer expires"
        />
        <Switch
          checked={true}
          onChange={() => {}}
          label="Notifications"
        />
        <Switch
          checked={false}
          onChange={() => {}}
          label="Disabled Switch"
          disabled
        />
      </div>
    </ShowcaseSection>
  );
}

function EmptyStatesSection() {
  return (
    <ShowcaseSection title="Empty States">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <EmptyState
            title="No results found"
            description="Try adjusting your search or filters"
          />
        </Card>
        <Card className="p-6">
          <EmptyQueue />
        </Card>
      </div>
    </ShowcaseSection>
  );
}

function LoadingSection() {
  return (
    <ShowcaseSection title="Loading States">
      <div className="space-y-6">
        <div className="flex gap-6">
          <LoadingSpinner size="sm" />
          <LoadingSpinner size="md" />
          <LoadingSpinner size="lg" />
        </div>
        <div className="space-y-2 max-w-md">
          <Skeleton height="16px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </div>
        <div className="flex gap-4">
          <Skeleton variant="circle" size={48} />
          <Skeleton variant="circle" size={48} />
          <Skeleton variant="circle" size={48} />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function TeamLogosSection() {
  const teams = ['KC', 'BUF', 'PHI', 'SF', 'DAL', 'MIA', 'CIN', 'BAL'];
  
  return (
    <ShowcaseSection title="Team Logos">
      <div className="flex flex-wrap gap-4">
        {teams.map(team => (
          <div key={team} className="flex flex-col items-center gap-1">
            <TeamLogo team={team} size="lg" />
            <span className="text-xs text-gray-400">{team}</span>
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}

function IconsSection() {
  return (
    <ShowcaseSection title="Icons">
      <div className="space-y-6">
        <div>
          <div className="text-sm text-gray-400 mb-3">Navigation</div>
          <div className="flex flex-wrap gap-4">
            {[PlusIcon, CloseIcon, MenuIcon, SearchIcon, ChevronDownIcon].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg">
                  <Icon size={20} color="#fff" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-3">Draft-Specific</div>
          <div className="flex flex-wrap gap-4">
            {[ClockIcon, TrophyIcon, TrendingUpIcon, UserIcon, SettingsIcon].map((Icon, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg">
                  <Icon size={20} color="#fff" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-3">Different Sizes</div>
          <div className="flex items-end gap-4">
            <PlusIcon size={16} color="#9ca3af" />
            <PlusIcon size={20} color="#9ca3af" />
            <PlusIcon size={24} color="#9ca3af" />
            <PlusIcon size={32} color="#9ca3af" />
            <PlusIcon size={48} color="#9ca3af" />
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-3">With Colors</div>
          <div className="flex gap-4">
            <PlusIcon size={24} color="#F472B6" />
            <PlusIcon size={24} color="#0fba80" />
            <PlusIcon size={24} color="#FBBF25" />
            <PlusIcon size={24} color="#7C3AED" />
            <PlusIcon size={24} color="#3B82F6" />
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

function PositionBadgesSection() {
  return (
    <ShowcaseSection title="Position Badges">
      <div className="space-y-4">
        <div className="flex gap-4">
          <PositionBadgeInline position="QB" size="sm" />
          <PositionBadgeInline position="RB" size="sm" />
          <PositionBadgeInline position="WR" size="sm" />
          <PositionBadgeInline position="TE" size="sm" />
        </div>
        <div className="flex gap-4">
          <PositionBadgeInline position="QB" size="md" />
          <PositionBadgeInline position="RB" size="md" />
          <PositionBadgeInline position="WR" size="md" />
          <PositionBadgeInline position="TE" size="md" />
        </div>
        <div className="flex gap-4">
          <PositionBadgeInline position="QB" size="lg" />
          <PositionBadgeInline position="RB" size="lg" />
          <PositionBadgeInline position="WR" size="lg" />
          <PositionBadgeInline position="TE" size="lg" />
        </div>
      </div>
    </ShowcaseSection>
  );
}

function ModalsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <ShowcaseSection title="Modals & Overlays">
      <div className="flex gap-4">
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Button onClick={() => setSheetOpen(true)} variant="secondary">Open Sheet</Button>
        <Button onClick={() => setConfirmOpen(true)} variant="danger">Confirm Dialog</Button>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
        <div className="p-4">
          <p className="text-gray-300 mb-4">This is a modal dialog with a title and content.</p>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Sheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-4">Bottom Sheet</h3>
          <p className="text-gray-300 mb-4">This is a bottom sheet overlay.</p>
          <Button onClick={() => setSheetOpen(false)}>Close</Button>
        </div>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm Action"
        message="Are you sure you want to proceed? This action cannot be undone."
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel="Proceed"
        confirmVariant="danger"
      />
    </ShowcaseSection>
  );
}

function ToastSection() {
  const { showToast } = useToast();

  return (
    <ShowcaseSection title="Toast Notifications">
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => showToast({ type: 'success', message: 'Player drafted successfully!' })}>
          Success Toast
        </Button>
        <Button onClick={() => showToast({ type: 'error', message: 'Failed to draft player' })} variant="danger">
          Error Toast
        </Button>
        <Button onClick={() => showToast({ type: 'warning', message: 'Draft ending soon!' })} variant="secondary">
          Warning Toast
        </Button>
        <Button onClick={() => showToast({ type: 'info', message: 'New player available' })} variant="ghost">
          Info Toast
        </Button>
      </div>
    </ShowcaseSection>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ShowcaseSection({ title, children }) {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">
        {title}
      </h2>
      {children}
    </div>
  );
}

// Import icons from the new icon library
import {
  Plus as PlusIcon,
  X as CloseIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  Clock as ClockIcon,
  Trophy as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  ChevronDown as ChevronDownIcon,
} from '../../components/vx';

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function VXComponentsShowcase() {
  return (
    <ToastProvider>
      <Head>
        <title>VX Components Showcase</title>
      </Head>
      
      <div 
        className="min-h-screen"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* Header */}
        <div className="sticky top-0 z-50 bg-[#101927] border-b border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">VX Component Library</h1>
          <p className="text-gray-400 text-sm">60+ shared components for the Version X architecture</p>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <ButtonsSection />
          <InputsSection />
          <BadgesSection />
          <CardsSection />
          <ProgressSection />
          <StatsSection />
          <CountdownSection />
          <AvatarsSection />
          <NavigationSection />
          <SwitchSection />
          <IconsSection />
          <PositionBadgesSection />
          <TeamLogosSection />
          <EmptyStatesSection />
          <LoadingSection />
          <ModalsSection />
          <ToastSection />
        </div>
      </div>
    </ToastProvider>
  );
}

