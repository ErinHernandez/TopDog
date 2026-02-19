/**
 * MobileHomeContent - Mobile Homepage Content
 * 
 * DEPRECATED - This component uses old mobile components.
 * 
 * For new development, use the VX2 app shell:
 * - components/vx2/shell/AppShellVX2.tsx
 * - /testing-grounds/vx2-mobile-app-demo
 * 
 * This file is preserved for legacy reference only.
 */

import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

import DraftBoardModal from '../DraftBoardModal';
import MobileFooter from '../MobileFooter';
import MobilePhoneFrame, { MobilePhoneContent } from '../shared/MobilePhoneFrame';
import { LobbyTab, LiveDraftsTab, MyTeamsTab, ExposureTab, ProfileTab } from '../tabs';
import TournamentModalMobile from '../TournamentModalMobile';

export default function MobileHomeContent() {
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('Lobby');
  
  // Team selection state (for My Teams tab)
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Draft board state
  const [showDraftBoard, setShowDraftBoard] = useState(false);
  const [draftBoardTeam, setDraftBoardTeam] = useState(null);
  
  // Modal states
  const [showTournamentModal, setShowTournamentModal] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    if (router.isReady && router.query.tab) {
      const validTabs = ['Lobby', 'My Teams', 'Exposure', 'Profile'];
      if (validTabs.includes(router.query.tab)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from query params
        setActiveTab(router.query.tab);
      }
    }
  }, [router.isReady, router.query.tab]);

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Lobby':
        return <LobbyTab onJoinClick={() => setShowTournamentModal(true)} />;
      
      case 'Live Drafts':
        return (
          <LiveDraftsTab 
            onJoinDraft={() => {
              setActiveTab('Lobby');
              setShowTournamentModal(true);
            }} 
          />
        );
      
      case 'My Teams':
        return (
          <div className="flex-1 min-h-0">
            <MyTeamsTab 
              selectedTeam={selectedTeam} 
              setSelectedTeam={setSelectedTeam}
              setDraftBoardTeam={setDraftBoardTeam}
              setShowDraftBoard={setShowDraftBoard}
            />
          </div>
        );
      
      case 'Exposure':
        return (
          <div className="flex-1 min-h-0">
            <ExposureTab />
          </div>
        );
      
      case 'Profile':
        return <ProfileTab />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
              <p className="text-gray-400">This feature is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <MobilePhoneFrame>
      <MobilePhoneContent>
        {/* Mobile Header */}
        <div 
          className="w-full shadow-lg relative"
          style={{
            background: 'url(/wr_blue.png) no-repeat center center',
            backgroundSize: 'cover',
            paddingTop: '44px',
            height: '60px'
          }}
        >
          {/* Back Arrow - Only show in My Teams detail view */}
          {activeTab === 'My Teams' && selectedTeam && (
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute left-4"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                minHeight: '36px',
                minWidth: '36px'
              }}
              title="Go back to teams list"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </div>
            </button>
          )}

          {/* Deposit Button - Top Right */}
          <button 
            className="absolute right-4"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              minHeight: '36px',
              minWidth: '36px'
            }}
            title="Deposit funds"
            onClick={() => router.push('/mobile-payment')}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center">
              <svg 
                className="text-white" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ width: '23px', height: '23px' }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
              </svg>
            </div>
          </button>

          <Image
            src="/logo.png"
            alt="TopDog.dog Logo"
            width={100}
            height={64}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>

        {/* Main Content */}
        <div 
          className="flex flex-col overflow-hidden"
          style={{ 
            height: (activeTab === 'Exposure' || activeTab === 'My Teams')
              ? 'calc(100% - 80px + 15px)'
              : 'calc(100% - 60px - 80px)'
          }}
        >
          {renderTabContent()}
        </div>

        {/* Mobile Footer Navigation */}
        <MobileFooter 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTabClick={() => {}} 
        />

        {/* Tournament Modal */}
        {showTournamentModal && (
          <TournamentModalMobile 
            open={showTournamentModal} 
            onClose={() => setShowTournamentModal(false)}
            tournamentType="topdog"
          />
        )}

        {/* Draft Board Modal */}
        {showDraftBoard && draftBoardTeam && (
          <DraftBoardModal 
            team={draftBoardTeam}
            onClose={() => {
              setShowDraftBoard(false);
              setDraftBoardTeam(null);
            }}
          />
        )}
      </MobilePhoneContent>
    </MobilePhoneFrame>
  );
}

