import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

const MAX_MB = 10;

const EXTRACT = ['About', 'Skills', 'Experience', 'Projects', 'Education', 'Certifications'];

const PIPELINE = [
  'READING DOCUMENT',
  'EXTRACTING CONTENT',
  'IDENTIFYING SECTIONS',
  'STRUCTURING DATA',
  'PREPARING PORTFOLIO',
];

const FLOW_STEPS = ['UPLOAD', 'REVIEW', 'DESIGN', 'EXPORT'];

function isPdf(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export default function UploadPage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setStepIdx((i) => Math.min(i + 1, PIPELINE.length)), 550);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const prevent = (e) => {
      e.preventDefault();
    };
    document.addEventListener('dragover', prevent);
    document.addEventListener('drop', prevent);
    return () => {
      document.removeEventListener('dragover', prevent);
      document.removeEventListener('drop', prevent);
    };
  }, []);

  const acceptFile = (candidate) => {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      setFile(null);
      setError('Please choose a .pdf file. Other formats are not supported yet.');
      return;
    }
    if (candidate.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      setError(`That file is larger than ${MAX_MB} MB — try a smaller copy.`);
      return;
    }
    setFile(candidate);
    setError('');
  };

  const handleFileChange = (e) => acceptFile(e.target.files[0]);

  const openPicker = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || loading) return;

    setStepIdx(0);
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/api/resume/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate('/review', { state: { resumeData: response.data.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'The analysis failed to start — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sizeMb = file ? (file.size / 1024 / 1024).toFixed(1) : '0';
  const pct = Math.round((stepIdx / PIPELINE.length) * 100);

  return (
    <div className="flex-grow w-full bg-beige dark:bg-plum transition-colors duration-300">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">

        {/* Page header */}
        <header className="mb-10 md:mb-14">
          <p className="font-tech text-xs tracking-[.18em] text-rose">01 / UPLOAD</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.05] tracking-tight text-plum dark:text-coral">
            BUILD FROM YOUR
            <br />
            RESUME.
          </h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-mauve dark:text-mauve leading-relaxed">
            Upload your resume and let AI build the foundation of your portfolio — experience, projects, skills and education.
          </p>

          <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 font-tech text-[11px] tracking-[.14em]">
            {FLOW_STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className={i === 0 ? 'text-rose' : 'text-mauve/60 dark:text-mauve/70'}>0{i + 1} {label}</span>
                {i < FLOW_STEPS.length - 1 && <span className="text-mauve/40 dark:text-mauve/50">────</span>}
              </li>
            ))}
          </ol>
        </header>

        {/* Main grid */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">

          {/* Left — upload */}
          <section className="lg:col-span-7" aria-label="Resume upload">
            <div className={`rounded-[24px] border-2 border-dashed transition-all duration-300 ${
              loading
                ? 'border-rose/50 bg-coral'
                : dragActive
                  ? 'border-rose bg-[#F4D9D0]'
                  : 'border-mauve bg-coral'
            }`}>
              {!file && !loading && (
                <button
                  type="button"
                  onClick={openPicker}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    dragDepthRef.current += 1;
                    setDragActive(true);
                  }}
                  onDragLeave={() => {
                    dragDepthRef.current -= 1;
                    if (dragDepthRef.current <= 0) setDragActive(false);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="w-full cursor-pointer text-center px-8 py-14 sm:py-16 rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-rose select-none touch-manipulation"
                >
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-[18px] border border-rose/40 bg-white/70 text-rose shadow-sm shadow-plum/10">
                    <span className="relative">
                      <FileText className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                      <span className="absolute -right-3 -top-2 grid h-5 w-5 place-items-center rounded-md bg-rose text-coral">
                        <span className="h-3 w-px bg-coral" aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                  <span className="mt-6 block font-display text-xl font-semibold text-plum dark:text-coral">
                    {dragActive ? 'DROP IT HERE' : 'DROP YOUR RESUME HERE'}
                  </span>
                  <span className="mt-1.5 block text-sm text-mauve dark:text-mauve">or click to browse files</span>
                  {dragActive && (
                    <span className="mt-3 block font-tech text-[11px] tracking-[.16em] text-rose">READY TO ANALYZE</span>
                  )}
                  <span className="mt-6 inline-block font-tech text-[11px] tracking-[.16em] text-mauve dark:text-mauve">
                    PDF · MAX {MAX_MB}MB
                  </span>
                </button>
              )}

              {file && !loading && (
                <div className="animate-fade-up px-6 py-8 sm:px-8 sm:py-10">
                  <div className="flex items-center gap-4">
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-rose/40 bg-white/70 text-rose shadow-sm shadow-plum/10">
                      <FileText className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose text-coral">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-semibold text-plum dark:text-coral">{file.name}</p>
                      <p className="mt-0.5 font-tech text-xs tracking-[.14em] text-rose">✓ READY FOR ANALYSIS · {sizeMb} MB</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 font-tech text-xs tracking-[.12em]">
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setError('');
                      }}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-rose/50 px-4 py-2.5 text-rose hover:bg-white/50 transition-colors cursor-pointer disabled:opacity-50 touch-manipulation"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> REPLACE
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setError('');
                      }}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-[10px] border border-mauve/40 px-4 py-2.5 text-mauve hover:bg-white/50 transition-colors cursor-pointer disabled:opacity-50 touch-manipulation"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> REMOVE
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div role="status" aria-live="assertive" className="animate-fade-up px-6 py-8 sm:px-8 sm:py-10">
                  <p className="font-tech text-xs tracking-[.16em] text-rose">// RESUME_ANALYSIS</p>

                  <ol className="mt-5 space-y-2.5">
                    {PIPELINE.map((label, i) => {
                      const done = i < stepIdx;
                      const active = i === stepIdx;
                      return (
                        <li
                          key={label}
                          className={`flex items-center gap-3 font-tech text-[11px] tracking-[.14em] ${
                            done || active ? 'text-rose' : 'text-mauve/50 dark:text-mauve/60'
                          }`}
                        >
                          <span className="w-4 text-center">{done ? '✓' : active ? '●' : '○'}</span>
                          <span className={active ? 'animate-pulse' : ''}>{`${String(i + 1).padStart(2, '0')}  ${label}`}</span>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-6">
                    <div className="flex items-center justify-between font-tech text-[11px] tracking-[.14em] text-mauve dark:text-mauve">
                      <span>EXTRACTING INFORMATION</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mauve/20">
                      <div className="h-full rounded-full bg-rose transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3.5 text-sm font-semibold transition-colors cursor-pointer touch-manipulation focus-visible:ring-2 focus-visible:ring-rose focus-visible:outline-none ${
                  file && !loading
                    ? 'bg-rose text-coral hover:bg-plum shadow-lg shadow-rose/25'
                    : 'bg-mauve/30 text-beige cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> ANALYZING…
                  </>
                ) : (
                  <>
                    {file ? 'ANALYZE RESUME' : 'CONTINUE'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-sm text-mauve dark:text-mauve/80">
              Your resume is used only to generate your portfolio. You can remove it at any time.
            </p>

            <div aria-live="polite">
              {error && (
                <p role="alert" className="mt-4 text-sm font-medium text-rose">
                  {error}
                </p>
              )}
            </div>
          </section>

          {/* Right — what we extract + next */}
          <aside className="lg:col-span-5 space-y-10">
            <section aria-label="What we extract">
              <p className="font-tech text-xs tracking-[.18em] text-rose">// WE&apos;LL EXTRACT</p>
              <ul className="mt-4 space-y-2">
                {EXTRACT.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 rounded-[10px] bg-coral px-4 py-3 border border-rose/15"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-rose/15 text-rose">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-medium text-plum dark:text-coral">{item.toUpperCase()}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Next steps">
              <p className="font-tech text-xs tracking-[.18em] text-rose">// NEXT</p>
              <p className="mt-4 font-tech text-[11px] tracking-[.14em] text-mauve dark:text-mauve leading-loose">
                REVIEW → DESIGN → CODE
              </p>
            </section>
          </aside>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        aria-label="Choose resume PDF"
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileChange}
      />
    </div>
  );
}
