import { useState } from 'react';
import { Feed } from '@/components/dashboard/Feed';
import { CreateVibeEcho } from '@/components/dashboard/CreateVibeEcho';
import { Matches } from '@/components/dashboard/Matches';
import { Messages } from '@/components/dashboard/Messages';
import { Communities } from '@/components/dashboard/Communities';
import { Profile } from '@/components/dashboard/Profile';
import { Navigation } from '@/components/dashboard/Navigation';

type TabType = 'feed' | 'matches' | 'messages' | 'communities' | 'profile';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="space-y-6">
            <CreateVibeEcho />
            <Feed />
          </div>
        );
      case 'matches':
        return <Matches />;
      case 'messages':
        return <Messages />;
      case 'communities':
        return <Communities />;
      case 'profile':
        return <Profile />;
      default:
        return <Feed />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 pt-20 pb-6">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;