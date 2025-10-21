import { MapPin, Calendar, DollarSign, Clock, Bookmark, ExternalLink, CheckCircle, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Internship } from '../lib/mockData';
import { getCompanyLogo } from '../lib/companyLogos';

interface InternshipCardProps {
  internship: Internship;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}

export default function InternshipCard({ internship, isSaved, onToggleSave }: InternshipCardProps) {
  const [logoError, setLogoError] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDeadlineSoon = (dateString: string | null) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  };

  const companyName = internship.company_name || 'Unknown Company';
  const companyLogo = getCompanyLogo(companyName);

  // Get company initials for fallback
  const getCompanyInitials = (name: string) => {
    return name
      .split(/[\s&]+/)
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  };

  const companyInitials = getCompanyInitials(companyName);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-slate-200 hover:border-blue-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div className="bg-white rounded-lg p-2 flex items-center justify-center shadow-md border border-slate-200 w-16 h-16 flex-shrink-0">
              {companyLogo && !logoError ? (
                <img
                  src={companyLogo}
                  alt={`${companyName} logo`}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded text-white font-bold text-lg">
                  {companyInitials}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{internship.position_title}</h3>
              <p className="text-slate-600 font-medium">{companyName}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleSave(internship.id)}
          className={`p-2 rounded-lg transition-all ${
            isSaved
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save internship'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {internship.job_type}
        </span>
        {internship.eligible_years.map((year) => (
          <span
            key={year}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"
          >
            {year}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="truncate">{internship.location}</span>
        </div>
        {internship.pay_range && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span>{internship.pay_range}</span>
          </div>
        )}
        {internship.duration && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{internship.duration}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span
            className={`${
              isDeadlineSoon(internship.application_deadline)
                ? 'text-red-600 font-semibold'
                : 'text-slate-600'
            }`}
          >
            {formatDate(internship.application_deadline)}
          </span>
        </div>
      </div>

      {internship.requirements && internship.requirements.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-900 mb-2">Requirements:</p>
          <ul className="space-y-1">
            {internship.requirements.slice(0, 3).map((req, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={internship.application_url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        Apply Now
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
