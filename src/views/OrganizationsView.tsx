import React, { useState } from 'react';
import { Search, Building2, MapPin, Globe, Target, DollarSign, Award } from 'lucide-react';
import { MOCK_ORGANIZATIONS, Organization } from '../data/mockData';

interface OrganizationsViewProps {
  onSelectChallenge?: (challengeId: string) => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const orgTypes = ['All', 'University', 'Research Institute', 'Tech Enterprise', 'Non-Profit'];

  const filteredOrgs = MOCK_ORGANIZATIONS.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.focusAreas.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'All' || org.type === selectedType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#FAEDCD] p-6 rounded-2xl border border-[#DCD5BC] shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#342F27]">Research Organizations & Grantors</h1>
            <p className="text-xs text-[#6B6255] mt-1">
              Universities, institutes, tech enterprises, and non-profits publishing research challenges.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6255]" />
            <input
              type="text"
              placeholder="Search organizations or focus areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#FEFAE0] border border-[#DCD5BC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#D4A373] text-[#342F27]"
            />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {orgTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === type
                  ? 'bg-[#CCD5AE] text-[#342F27] font-bold border-[#B8C299] shadow-xs'
                  : 'bg-[#FEFAE0] text-[#6B6255] border-[#DCD5BC] hover:text-[#342F27] hover:bg-[#E9EDC9]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Organizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => (
          <div
            key={org.id}
            className="bg-[#FAEDCD] rounded-2xl p-6 border border-[#DCD5BC] hover:border-[#D4A373] shadow-2xs transition-all flex flex-col justify-between space-y-4 text-xs"
          >
            <div>
              <div className="flex items-start gap-3 mb-3">
                <img src={org.logo} alt={org.name} className="w-12 h-12 rounded-xl object-cover border border-[#DCD5BC] shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-[#342F27] bg-[#CCD5AE] px-2 py-0.5 rounded border border-[#B8C299] uppercase">
                    {org.type}
                  </span>
                  <h3 className="font-bold text-[#342F27] text-sm mt-1">{org.name}</h3>
                  <p className="text-[11px] text-[#6B6255] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#8B5E34]" />
                    <span>{org.location}</span>
                  </p>
                </div>
              </div>

              <p className="text-[#342F27] leading-relaxed bg-[#FEFAE0] p-3 rounded-xl border border-[#DCD5BC] line-clamp-3">
                {org.description}
              </p>

              {/* Focus Areas */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-[#6B6255] uppercase tracking-wider block mb-1">Focus Areas</span>
                <div className="flex flex-wrap gap-1">
                  {org.focusAreas.map((f) => (
                    <span key={f} className="text-[10px] bg-[#E9EDC9] text-[#342F27] px-2 py-0.5 rounded border border-[#DCD5BC] font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCD5BC] flex items-center justify-between font-mono text-[11px]">
              <div>
                <span className="text-[#6B6255] block text-[9px] font-sans font-bold uppercase">Active Challenges</span>
                <span className="font-bold text-[#342F27]">{org.activeChallengesCount}</span>
              </div>
              <div className="text-right">
                <span className="text-[#6B6255] block text-[9px] font-sans font-bold uppercase">Grants Awarded</span>
                <span className="font-bold text-[#287A50]">{org.totalGrantsAwarded}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
