import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, 
  AlertCircle, 
  Settings, 
  Search, 
  Plus, 
  LogOut, 
  Filter, 
  Camera, 
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User as UserIcon,
  BarChart3,
  Users as UsersIcon,
  Download,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';
import { analyzeDefect, type DefectAnalysis, summarizeEscalations } from './services/geminiService';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'Sales Person' | 'Branch Head' | 'Unit Head' | 'Master';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  branch: string;
  unit: string;
  role: Role;
}

interface Escalation {
  id: string;
  case_id: string;
  title: string;
  description: string;
  reporter_name: string;
  reporter_email: string;
  branch: string;
  unit: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  photo_url: string | null;
  created_at: string;
  reporter_id: string;
  resolution?: string;
  resolved_at?: string;
}

// --- Components ---

const Auth = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [branch, setBranch] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [role, setRole] = useState<Role>('Sales Person');

  const branches = ["Mumbai", "Delhi", "Surat", "Ahmedabad", "Kolkata", "Jaipur", "Ulhasnagar", "Ludhiana", "Bangalore", "Tirupur"];
  const units = [
    "CURCULAR KNITTING UNIT",
    "CROCHET",
    "DAMAN ELASTIC",
    "DIGITAL PRINTING FABRIC",
    "DIGITAL PRINTING UNIT",
    "EMBROIDERY",
    "EYE HOOK UNIT",
    "HEKTOR",
    "MOLDING",
    "SACHIN KNITTING",
    "SUNSILK",
    "TAPE DYEING",
    "TORCHAN LACE",
    "UDHNA",
    "VALUE ADDITION",
    "WARP WEFT FABRICS"
  ];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              branch: (role === 'Unit Head' || role === 'Master') ? '' : branch,
              unit: selectedUnits.join(', '),
              role
            }
          }
        });
        if (signUpError) throw signUpError;
      }
      onAuthSuccess();
    } catch (err: any) {
      if (err.message.includes('Email rate limit exceeded')) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleUnit = (u: string) => {
    setSelectedUnits(prev => 
      prev.includes(u) ? prev.filter(item => item !== u) : [...prev, u]
    );
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <img 
              src="https://www.ginzalimited.com/cdn/shop/files/Ginza_logo.jpg?v=1668509673&width=500" 
              alt="GINZA Logo" 
              className="h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-gray-500 text-sm mb-8">
            Ginza Industries Ltd. Quality Escalation Center
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            )}
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {!isLogin && (
              <>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  required
                >
                  <option value="Sales Person">Sales Person</option>
                  <option value="Branch Head">Branch Head</option>
                  <option value="Unit Head">Unit Head</option>
                  <option value="Master">Master</option>
                </select>

                {role !== 'Unit Head' && role !== 'Master' && (
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}

                {role === 'Unit Head' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Select Assigned Units (Multiple)</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-xl bg-gray-50">
                      {units.map(u => (
                        <label key={u} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedUnits.includes(u)}
                            onChange={() => toggleUnit(u)}
                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                          />
                          <span className="text-sm text-gray-700">{u}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Selected: {selectedUnits.length} units</p>
                  </div>
                )}
              </>
            )}

            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, onLogout, user }: { activeTab: string, setActiveTab: (t: string) => void, onLogout: () => void, user: Profile | null }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports', icon: Filter },
  ];

  if (user?.role === 'Master') {
    menuItems.push({ id: 'users', label: 'User Management', icon: UserIcon });
  }

  menuItems.push({ id: 'settings', label: 'Settings', icon: Settings });

  return (
    <div className="w-64 bg-white border-r border-black/5 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <img 
          src="https://www.ginzalimited.com/cdn/shop/files/Ginza_logo.jpg?v=1668509673&width=500" 
          alt="GINZA Logo" 
          className="h-8 object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="font-bold text-sm tracking-tight">Escalation Center</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === item.id 
                ? "bg-black text-white shadow-lg shadow-black/10" 
                : "text-gray-500 hover:bg-gray-50 hover:text-black"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-black/5">
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-gray-500 truncate">
                  {user?.role} {user?.branch ? `• ${user.branch}` : user?.unit ? `• ${user.unit.split(',')[0]}...` : ''}
                </p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 border border-red-100 transition-all"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modals ---

const DetailModal = ({ 
  isOpen, 
  onClose, 
  escalation 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  escalation: Escalation | null
}) => {
  if (!isOpen || !escalation) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs font-bold text-gray-400">{escalation.case_id}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                escalation.status === 'Open' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                escalation.status === 'Closed' ? "bg-green-50 text-green-600 border border-green-100" :
                "bg-blue-50 text-blue-600 border border-blue-100"
              )}>
                {escalation.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{escalation.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reporter</p>
              <p className="text-sm font-bold text-gray-900">{escalation.reporter_name}</p>
              <p className="text-xs text-gray-500">{escalation.reporter_email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</p>
              <p className="text-sm font-bold text-gray-900">{escalation.unit}</p>
              <p className="text-xs text-gray-500">{escalation.branch}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{escalation.description}</p>
          </div>

          {escalation.photo_url && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Defect Photos</p>
              <div className="grid grid-cols-1 gap-4">
                {escalation.photo_url.split(',').map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    alt={`Defect ${idx + 1}`} 
                    className="w-full rounded-2xl border border-black/5 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    referrerPolicy="no-referrer"
                    onClick={() => {
                      // We can use the existing PhotoModal if we want, but for now just show them all
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {escalation.status === 'Closed' && escalation.resolution && (
            <div className="p-6 bg-green-50 rounded-3xl border border-green-100 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-700">Resolution / Solution</p>
              </div>
              <p className="text-sm text-green-800 leading-relaxed whitespace-pre-wrap">{escalation.resolution}</p>
              {escalation.resolved_at && (
                <p className="text-[10px] text-green-600 font-medium">Resolved on {format(new Date(escalation.resolved_at), 'MMM d, yyyy HH:mm')}</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-black/5 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

const PhotoModal = ({ isOpen, onClose, photoUrl }: { isOpen: boolean, onClose: () => void, photoUrl: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors">
          <X className="w-8 h-8" />
        </button>
        <img 
          src={photoUrl} 
          alt="Defect Detail" 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

const ResolutionModal = ({ 
  isOpen, 
  onClose, 
  escalation, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  escalation: Escalation | null,
  onSuccess: () => void
}) => {
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalation) return;
    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('escalations')
        .update({
          status: 'Closed',
          resolution: resolution,
          resolved_at: new Date().toISOString()
        })
        .eq('id', escalation.id);

      if (updateError) {
        console.error('Update Error:', updateError);
        throw updateError;
      }

      setSuccess(true);
      await onSuccess();
      setTimeout(() => {
        onClose();
        setResolution('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error('Full Error Object:', err);
      setError(err.message || 'An unexpected error occurred while updating the status.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !escalation) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Resolve Escalation</h3>
            <p className="text-xs text-gray-500 mt-1">Provide a solution to close Case {escalation.case_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Escalation Resolved</h3>
              <p className="text-gray-500">The status has been updated to Closed successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Issue Details</label>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-1">{escalation.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{escalation.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Solution / Reaction</label>
                <textarea
                  placeholder="Describe the solution or action taken..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[120px] text-sm"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg shadow-black/10"
                >
                  {loading ? 'Closing...' : 'Reply & Close'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const NewEscalationModal = ({ isOpen, onClose, user, onSuccess }: { isOpen: boolean, onClose: () => void, user: Profile | null, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<DefectAnalysis | null>(null);

  const handleAiAnalyze = async () => {
    if (!title || !description) {
      setError("Please provide a title and description for AI analysis.");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const analysis = await analyzeDefect(title, description);
      setAiAnalysis(analysis);
      // Optionally append to description
      // setDescription(prev => `${prev}\n\n--- AI ANALYSIS ---\nCategory: ${analysis.category}\nSeverity: ${analysis.severity}\nRoot Cause: ${analysis.rootCause}\nSuggested Action: ${analysis.suggestedAction}`);
    } catch (err: any) {
      setError("AI Analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const units = [
    "CURCULAR KNITTING UNIT",
    "CROCHET",
    "DAMAN ELASTIC",
    "DIGITAL PRINTING FABRIC",
    "DIGITAL PRINTING UNIT",
    "EMBROIDERY",
    "EYE HOOK UNIT",
    "HEKTOR",
    "MOLDING",
    "SACHIN KNITTING",
    "SUNSILK",
    "TAPE DYEING",
    "TORCHAN LACE",
    "UDHNA",
    "VALUE ADDITION",
    "WARP WEFT FABRICS"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let photoUrls: string[] = [];
      
      if (photos.length > 0) {
        for (const photo of photos) {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('escalation-photos')
            .upload(fileName, photo, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Photo upload failed: ${uploadError.message}`);
          }

          if (data) {
            const { data: { publicUrl } } = supabase.storage.from('escalation-photos').getPublicUrl(fileName);
            photoUrls.push(publicUrl);
          }
        }
      }

      const photoUrlString = photoUrls.length > 0 ? photoUrls.join(',') : null;
      const caseId = `CS-${Math.floor(1000 + Math.random() * 9000)}`;

      // Ensure profile exists before inserting escalation to avoid foreign key violation
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profileCheck) {
        const { error: profileInsertError } = await supabase.from('profiles').insert({
          id: user.id,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          branch: user.branch || '',
          unit: user.unit || '',
          role: user.role || 'Sales Person'
        });
        if (profileInsertError) throw new Error(`Profile sync failed: ${profileInsertError.message}`);
      }

      const { error: insertError } = await supabase
        .from('escalations')
        .insert({
          case_id: caseId,
          title,
          description,
          reporter_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          reporter_email: user.email,
          branch: user.branch || 'Not Specified',
          unit: unit,
          status: 'Open',
          photo_url: photoUrlString,
          reporter_id: user.id
        });

      if (insertError) {
        console.error('Insert Error:', insertError);
        if (insertError.code === '23503') {
          throw new Error("Submission failed: Your user profile is not synced with the database. Please refresh the page and try again.");
        }
        throw new Error(`Submission failed: ${insertError.message}.`);
      }
      
      // Send email notification (fire and forget, don't block UI)
      fetch('/api/notify-unit-head', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit,
          title,
          description,
          reporterName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          reporterEmail: user.email,
          caseId,
          photoUrls: photoUrls // Send array of URLs to server
        })
      }).catch(err => console.error('Notification failed:', err));

      await onSuccess();
      onClose();
      setTitle('');
      setDescription('');
      setUnit('');
      setPhotos([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">New Escalation</h3>
            <p className="text-sm text-gray-500">Report a new defect or issue to the management team.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Issue Title</label>
            <input
              type="text"
              placeholder="Brief title of the issue"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reporter Name</label>
              <input
                type="text"
                disabled
                value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Loading...'}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-900 font-bold cursor-not-allowed"
              />
            </div>
            {user?.role !== 'Unit Head' && user?.role !== 'Master' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Branch</label>
                <input
                  type="text"
                  disabled
                  value={user?.branch || 'Not Set'}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-900 font-bold cursor-not-allowed"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Unit</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 bg-white"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            >
              <option value="">Select Unit</option>
              {user?.role === 'Unit Head' && user.unit ? (
                user.unit.split(', ').map(u => (
                  <option key={u} value={u}>{u}</option>
                ))
              ) : (
                units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Detailed Description</label>
              <button
                type="button"
                onClick={handleAiAnalyze}
                disabled={aiLoading || !title || !description}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? (
                  <div className="w-3 h-3 border border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Smart Analyze
              </button>
            </div>
            <textarea
              placeholder="Provide as much detail as possible..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {aiAnalysis && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">AI Quality Analysis</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setAiAnalysis(null)}
                  className="text-indigo-400 hover:text-indigo-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase text-indigo-400 mb-0.5">Category</p>
                  <p className="text-xs font-bold text-indigo-900">{aiAnalysis.category}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-indigo-400 mb-0.5">Severity</p>
                  <p className={cn(
                    "text-xs font-bold",
                    aiAnalysis.severity === 'Critical' ? "text-red-600" :
                    aiAnalysis.severity === 'High' ? "text-orange-600" :
                    "text-indigo-900"
                  )}>{aiAnalysis.severity}</p>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-indigo-400 mb-0.5">Potential Root Cause</p>
                <p className="text-xs text-indigo-800 leading-relaxed">{aiAnalysis.rootCause}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDescription(prev => `${prev}\n\n--- AI ANALYSIS ---\nCategory: ${aiAnalysis.category}\nSeverity: ${aiAnalysis.severity}\nRoot Cause: ${aiAnalysis.rootCause}\nSuggested Action: ${aiAnalysis.suggestedAction}`);
                  setAiAnalysis(null);
                }}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors"
              >
                Apply to Report
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Upload Photos of Defect (Multiple)</label>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  if (e.target.files) {
                    setPhotos(Array.from(e.target.files));
                  }
                }}
              />
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 group-hover:border-black/20 transition-colors">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    {photos.length > 0 
                      ? `${photos.length} photo(s) selected` 
                      : 'Capture / Upload Multiple Photos'}
                  </p>
                  {photos.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {photos.map(p => p.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-lg shadow-black/10"
            >
              {loading ? 'Submitting...' : 'Submit Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Views ---

const ReportsView = ({ escalations }: { escalations: Escalation[] }) => {
  const statusData = [
    { name: 'Open', value: escalations.filter(e => e.status === 'Open').length },
    { name: 'In Progress', value: escalations.filter(e => e.status === 'In Progress').length },
    { name: 'Resolved', value: escalations.filter(e => e.status === 'Resolved').length },
    { name: 'Closed', value: escalations.filter(e => e.status === 'Closed').length },
  ];

  const unitData = Object.entries(
    escalations.reduce((acc, e) => {
      acc[e.unit] = (acc[e.unit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const COLORS = ['#F97316', '#8B5CF6', '#3B82F6', '#10B981'];

  const downloadCSV = () => {
    const headers = ['Case ID', 'Title', 'Description', 'Status', 'Reporter', 'Branch', 'Unit', 'Created At', 'Photo URL', 'Resolution', 'Resolved At'];
    const rows = escalations.map(e => [
      e.case_id,
      e.title,
      e.description.replace(/\n/g, ' '),
      e.status,
      e.reporter_name,
      e.branch,
      e.unit,
      format(new Date(e.created_at), 'yyyy-MM-dd HH:mm'),
      e.photo_url || '',
      e.resolution || '',
      e.resolved_at ? format(new Date(e.resolved_at), 'yyyy-MM-dd HH:mm') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ginza_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quality Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">Visual breakdown of production quality escalations.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-6">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{s.name}</p>
                  <p className="text-sm font-bold leading-none">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">Top Units by Escalations</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={140} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#000000" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersView = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) console.error(error);
      else setUsers(data || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-gray-500 text-sm">Manage access and roles for Ginza employees.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/30 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-black/5">
              <th className="px-8 py-4">Employee</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Branch / Unit</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading users...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{u.first_name} {u.last_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium">{u.branch || 'N/A'}</p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{u.unit || 'N/A'}</p>
                </td>
                <td className="px-8 py-4 text-right">
                  <button className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline">Edit Role</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsView = ({ user }: { user: Profile | null }) => {
  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-gray-500 text-sm">Manage your profile and application preferences.</p>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Profile Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</p>
            <p className="text-sm font-bold">{user?.first_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Name</p>
            <p className="text-sm font-bold">{user?.last_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email</p>
            <p className="text-sm font-bold">{user?.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</p>
            <p className="text-sm font-bold">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Notifications</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
            <div>
              <p className="text-sm font-bold">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive alerts when a new escalation is reported.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
          </label>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer">
            <div>
              <p className="text-sm font-bold">System Alerts</p>
              <p className="text-xs text-gray-500">Critical updates about the escalation center.</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
          </label>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleGenerateSummary = async () => {
    if (escalations.length === 0) return;
    setSummaryLoading(true);
    try {
      const res = await summarizeEscalations(escalations);
      setSummary(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Profile fetch error:', error);
      // Fallback to auth metadata if profile row is missing
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.id === userId) {
        const meta = authUser.user_metadata;
        const newProfile = {
          id: authUser.id,
          first_name: meta.first_name || '',
          last_name: meta.last_name || '',
          email: authUser.email || '',
          branch: meta.branch || '',
          unit: meta.unit || '',
          role: meta.role || 'Sales Person'
        };
        
        // Try to create the profile row in DB so foreign keys work
        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        if (insertError) console.error('Error creating profile row:', insertError);
        
        setUserProfile(newProfile);
      }
    } else {
      setUserProfile(data);
    }
  };

  const fetchEscalations = async () => {
    if (!userProfile) return;
    setLoading(true);
    
    let query = supabase.from('escalations').select('*').order('created_at', { ascending: false });

    // Role-based filtering
    if (userProfile.role === 'Branch Head') {
      query = query.eq('branch', userProfile.branch);
    } else if (userProfile.role === 'Unit Head') {
      const unitsArray = userProfile.unit.split(', ').filter(u => u.length > 0);
      if (unitsArray.length > 0) {
        query = query.in('unit', unitsArray);
      }
    } else if (userProfile.role === 'Sales Person') {
      query = query.eq('reporter_id', userProfile.id);
    }
    // Master sees all (no filter)

    const { data, error } = await query;
    if (error) console.error(error);
    else setEscalations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (userProfile) fetchEscalations();
  }, [userProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  const filteredEscalations = escalations.filter(e => 
    e.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.reporter_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Issues', value: escalations.length, icon: AlertCircle, color: 'bg-blue-50 text-blue-600' },
    { label: 'Open', value: escalations.filter(e => e.status === 'Open' || e.status === 'In Progress' || e.status === 'Resolved').length, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
    { label: 'Closed', value: escalations.filter(e => e.status === 'Closed').length, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F7F4] font-sans text-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        user={userProfile}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-black/5 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Case ID, Title or Reporter..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-black/10 focus:outline-none transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">System Operational</span>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <UserIcon className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-8 py-10">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">Escalation Center</h1>
                  <p className="text-gray-500">Monitor and manage quality defects across production units.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading || escalations.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    {summaryLoading ? (
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    AI Summary
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    New Escalation
                  </button>
                </div>
              </div>

              {summary && (
                <div className="mb-10 bg-indigo-600 text-white rounded-[32px] p-8 shadow-2xl shadow-indigo-200 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold">AI Executive Summary</h3>
                      </div>
                      <button 
                        onClick={() => setSummary(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none text-indigo-50 text-sm leading-relaxed">
                      <Markdown>{summary}</Markdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-black/5 shadow-sm hover:border-black/10 transition-all flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", stat.color)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-gray-400 leading-none mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight leading-none">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content */}
              <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-black/5 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-lg">Recent Escalations</h3>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors">
                      <Filter className="w-4 h-4" />
                      Filter
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/30 text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-black/5">
                        <th className="px-8 py-4">Case</th>
                        <th className="px-6 py-4">Issue Title</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Reporter</th>
                        <th className="px-6 py-4">Last Activity</th>
                        <th className="px-6 py-4">Defect Photo</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                              <p className="text-sm font-medium">Loading escalations...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredEscalations.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-8 py-20 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-gray-200" />
                              </div>
                              <p className="text-sm font-medium">No escalations found. Start by reporting a new issue.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEscalations.map((item) => (
                          <tr 
                            key={item.id} 
                            className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEscalation(item);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            <td className="px-8 py-5">
                              <span className="font-mono text-xs font-bold text-gray-400">{item.case_id}</span>
                            </td>
                            <td className="px-6 py-5">
                              <p className="font-bold text-sm text-gray-900">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{item.description}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                item.status === 'Open' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                item.status === 'Closed' ? "bg-green-50 text-green-600 border border-green-100" :
                                "bg-blue-50 text-blue-600 border border-blue-100"
                              )}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-3 h-3 text-gray-400" />
                                </div>
                                <span className="text-xs font-bold">{item.reporter_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-xs text-gray-500">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                            </td>
                            <td className="px-6 py-5">
                              {item.photo_url ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPhotoUrl(item.photo_url!);
                                    setIsPhotoModalOpen(true);
                                  }}
                                  className="group/photo relative w-12 h-12 rounded-lg overflow-hidden border border-black/5 hover:border-black/20 transition-all"
                                >
                                  <img 
                                    src={item.photo_url} 
                                    alt="Defect" 
                                    className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                    <Search className="w-3 h-3 text-white" />
                                  </div>
                                </button>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-gray-300" />
                                </div>
                              )}
                            </td>
                            <td className="px-8 py-5 text-right">
                              {(userProfile?.role === 'Unit Head' || userProfile?.role === 'Master') && item.status !== 'Closed' ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEscalation(item);
                                    setIsResolutionModalOpen(true);
                                  }}
                                  className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                                >
                                  Resolve
                                </button>
                              ) : item.status === 'Closed' ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEscalation(item);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                  Solved
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEscalation(item);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-black"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'reports' && <ReportsView escalations={escalations} />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'settings' && <SettingsView user={userProfile} />}
        </div>

        <footer className="max-w-7xl mx-auto px-8 py-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
            © 2026 Ginza Industries Ltd. Escalation Center. All rights reserved.
          </p>
        </footer>
      </main>

      <NewEscalationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        user={userProfile}
        onSuccess={fetchEscalations}
      />

      <ResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        escalation={selectedEscalation}
        onSuccess={fetchEscalations}
      />

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        photoUrl={selectedPhotoUrl}
      />

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        escalation={selectedEscalation}
      />
    </div>
  );
}
