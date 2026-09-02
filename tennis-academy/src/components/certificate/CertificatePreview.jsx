import { useState } from 'react';
import { Download, Loader2, Award, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { triggerWorkflow } from '../../utils/api';
import { formatDate } from '../../utils/formatters';

const ENTITY_DISPLAY = {
  'the-club': 'The Club',
  'tots-tennis': "TOTS Tennis",
};

export default function CertificatePreview({
  studentName = '',
  courseName = '',
  completionDate = '',
  coachName = '',
  certificateId = '',
  entity = 'the-club',
  studentId,
  packageId,
  showDownload = true,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!studentId || !packageId) {
      toast.error('Missing student or package information');
      return;
    }

    setDownloading(true);
    try {
      const result = await triggerWorkflow('certificate.download', {
        student_id: studentId,
        package_id: packageId,
      });

      if (result.data?.signed_url) {
        window.open(result.data.signed_url, '_blank');
        toast.success('Certificate downloaded');
      } else {
        toast.error('Could not generate download link');
      }
    } catch (err) {
      toast.error('Failed to download certificate');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = completionDate ? formatDate(completionDate) : '';
  const entityLabel = ENTITY_DISPLAY[entity] || entity;

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {/* Scale container: A4 landscape 297x210 at ~2.5px per mm = 743x525 */}
        <div className="relative w-full" style={{ paddingBottom: '70.7%' }}>
          <div className="absolute inset-0 flex items-center justify-center bg-white p-4">
            <div className="relative w-full h-full max-w-[743px] max-h-[525px] flex flex-col rounded-lg overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="font-['Space_Grotesk'] text-[80px] sm:text-[120px] font-bold text-brand/5 -rotate-[15deg] tracking-[-0.04em] whitespace-nowrap">
                  AJTA
                </span>
              </div>

              {/* Entity badge */}
              <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[8px] sm:text-[10px] font-bold tracking-[0.05em] uppercase z-10">
                {entityLabel}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-8 pt-5 sm:pt-8 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[12px] bg-brand-50 flex items-center justify-center">
                    <span className="font-['Space_Grotesk'] text-sm sm:text-lg font-bold text-brand-600">AJ</span>
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-sm font-semibold text-ink leading-tight">
                      Tennis Academy Management
                    </div>
                    <div className="text-[8px] sm:text-[10px] font-medium text-ink-muted">
                      The Club &amp; TOTS Tennis
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7px] sm:text-[9px] font-semibold text-ink-faint tracking-[0.06em] uppercase">
                    Certificate No.
                  </div>
                  <div className="text-[11px] sm:text-[13px] font-bold text-ink">
                    {certificateId}
                  </div>
                </div>
              </div>

              {/* Top divider */}
              <div className="mx-5 sm:mx-8 mt-4 sm:mt-6 h-[2px] bg-gradient-to-r from-brand to-transparent relative z-10" />

              {/* Main content */}
              <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 relative z-10 text-center">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-50 text-brand-600 text-[8px] sm:text-[10px] font-bold tracking-[0.08em] uppercase mb-3 sm:mb-4">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  Certificate of Completion
                </div>

                <div className="font-['Space_Grotesk'] text-lg sm:text-2xl font-bold text-ink tracking-[-0.03em] mb-2">
                  Course Successfully Completed
                </div>

                <div className="text-[10px] sm:text-xs text-ink-muted mb-5 sm:mb-6 max-w-[340px] sm:max-w-[400px] leading-relaxed">
                  This certificate is proudly presented in recognition of the dedication,
                  hard work, and achievement demonstrated throughout the tennis program.
                </div>

                <div className="font-['Space_Grotesk'] text-xl sm:text-3xl font-bold text-brand tracking-[-0.03em] mb-6 sm:mb-8">
                  {studentName}
                </div>

                <div className="flex gap-6 sm:gap-10">
                  <div className="text-center min-w-[80px] sm:min-w-[100px]">
                    <div className="text-[8px] sm:text-[10px] font-semibold text-ink-faint uppercase tracking-[0.06em] mb-1">
                      Course
                    </div>
                    <div className="text-[11px] sm:text-sm font-semibold text-ink">
                      {courseName}
                    </div>
                  </div>
                  <div className="text-center min-w-[80px] sm:min-w-[100px]">
                    <div className="text-[8px] sm:text-[10px] font-semibold text-ink-faint uppercase tracking-[0.06em] mb-1">
                      Completion Date
                    </div>
                    <div className="text-[11px] sm:text-sm font-semibold text-ink">
                      {formattedDate}
                    </div>
                  </div>
                  <div className="text-center min-w-[80px] sm:min-w-[100px]">
                    <div className="text-[8px] sm:text-[10px] font-semibold text-ink-faint uppercase tracking-[0.06em] mb-1">
                      Coach
                    </div>
                    <div className="text-[11px] sm:text-sm font-semibold text-ink">
                      {coachName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom divider */}
              <div className="mx-5 sm:mx-8 h-[1px] bg-line relative z-10" />

              {/* Footer */}
              <div className="flex items-center justify-between px-5 sm:px-8 py-3 sm:py-4 relative z-10">
                <div className="text-[7px] sm:text-[9px] font-medium text-ink-faint leading-relaxed">
                  Tennis Academy Management<br />
                  The Club &amp; TOTS Tennis
                </div>
                <div className="text-right">
                  <div className="w-[100px] sm:w-[140px] h-[1px] bg-line mb-1 ml-auto" />
                  <div className="text-[8px] sm:text-[10px] font-semibold text-ink">
                    Tennis Academy
                  </div>
                  <div className="text-[7px] sm:text-[9px] font-medium text-ink-faint">
                    Head Coach &amp; Director
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDownload && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <CheckCircle className="w-3.5 h-3.5 text-ok" />
            Certificate generated
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-xs font-semibold hover:brightness-110 transition-all duration-150 shadow-[0_1px_3px_rgba(100,55,232,0.20)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloading ? 'Downloading...' : 'Download Certificate'}
          </button>
        </div>
      )}
    </div>
  );
}
