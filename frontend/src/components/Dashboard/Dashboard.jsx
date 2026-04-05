import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { campaignAPI } from '../../services/api';
import Sidebar from '../Layout/Sidebar';
import DateRangePicker from './DateRangePicker';
import CampaignTable from './CampaignTable';
import { Sun, Moon, LogOut, Bell, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout, isAuthenticated, login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({ startDate: new Date(Date.now() - 30*24*60*60*1000), endDate: new Date() });
  const [loginEmail, setLoginEmail] = useState('test@agency.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const calculateKPIs = () => {
    const totalImpressions = campaigns.reduce((sum, c) => sum + (Number(c.impressions) || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (Number(c.clicks) || 0), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + (Number(c.conversions) || 0), 0);
    const totalSpend = campaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0);
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const roas = totalSpend > 0 ? totalConversions / totalSpend : 0;
    
    return {
      impressions: totalImpressions.toLocaleString(),
      clicks: totalClicks.toLocaleString(),
      conversions: totalConversions.toLocaleString(),
      spend: `$${totalSpend.toLocaleString()}`,
      ctr: `${ctr.toFixed(2)}%`,
      roas: roas.toFixed(2),
    };
  };

  const kpis = calculateKPIs();
  const chartData = [
    { date: 'Week 1', impressions: 850000, clicks: 17000 },
    { date: 'Week 2', impressions: 920000, clicks: 18400 },
    { date: 'Week 3', impressions: 780000, clicks: 15600 },
    { date: 'Week 4', impressions: 950000, clicks: 19000 },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
    }
  }, [isAuthenticated]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignAPI.getAll({ limit: 100 });
      setCampaigns(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const success = await login(loginEmail, loginPassword);
    setIsLoggingIn(false);
    if (success) {
      toast.success('Welcome to the dashboard!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-96">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Campaign Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Login to access your campaigns</p>
          </div>
          
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="input-field mb-3"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="input-field mb-4"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm">Demo Credentials:</p>
            <p className="text-gray-600 dark:text-gray-400 text-center font-mono text-xs mt-1">
              Email: test@agency.com<br />
              Password: password123
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'campaigns' && 'Campaign Management'}
                {activeTab === 'clients' && 'Client Management'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'brief-builder' && 'Creative Brief Builder'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, {user?.name || 'Admin'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DateRangePicker onRangeChange={setDateRange} />
              <button
                onClick={fetchCampaigns}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                    <KPICard title="Impressions" value={kpis.impressions} color="blue" />
                    <KPICard title="Clicks" value={kpis.clicks} color="green" />
                    <KPICard title="CTR" value={kpis.ctr} color="purple" />
                    <KPICard title="Conversions" value={kpis.conversions} color="orange" />
                    <KPICard title="Spend" value={kpis.spend} color="red" />
                    <KPICard title="ROAS" value={kpis.roas} color="indigo" />
                  </div>

                  {/* Chart */}
                  <div className="card p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="impressions" stroke="#0ea5e9" name="Impressions" strokeWidth={2} />
                        <Line type="monotone" dataKey="clicks" stroke="#10b981" name="Clicks" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Campaign Table */}
                  <div className="card">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold">Campaigns</h3>
                    </div>
                    <CampaignTable campaigns={campaigns} />
                  </div>
                </>
              )}
            </>
          )}
          
          {activeTab === 'campaigns' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Campaign Management</h2>
              <CampaignTable campaigns={campaigns} />
            </div>
          )}
          
          {activeTab === 'clients' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Client Management</h2>
              <p className="text-gray-600">Client list coming soon...</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className={`mt-2 h-1 bg-gradient-to-r ${colors[color]} rounded-full`}></div>
    </div>
  );
};

export default Dashboard;