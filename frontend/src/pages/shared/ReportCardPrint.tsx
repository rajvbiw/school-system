import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ReportCardData {
  school: { name: string; logoUrl?: string; primaryColor: string };
  student: { name: string; admissionNo: string; class: string; grade: string };
  examName: string;
  results: { subjectCode: string; subjectName: string; marksObtained: number; maxMarks: number; passMarks: number; grade: string; remarks: string }[];
  summary: { totalMarks: number; totalMax: number; percentage: number; gpa: string };
}

export const ReportCardPrint: React.FC = () => {
  const { student_id, exam_id } = useParams();

  const { data, isLoading, error } = useQuery<ReportCardData>({
    queryKey: ['printReportCard', student_id, exam_id],
    queryFn: async () => {
      const response = await axios.get(`/api/results/report-card/${student_id}/${exam_id}`);
      return response.data;
    },
    enabled: !!student_id && !!exam_id
  });

  useEffect(() => {
    if (data) {
      // Auto open print dialog when data is loaded
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Constructing Report Card...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-500 max-w-md mx-auto mt-20 border rounded-2xl bg-red-50">
        Failed to load report card details. Make sure student and exam identifiers are correct.
      </div>
    );
  }

  const { school, student, examName, results, summary } = data;

  return (
    <div className="bg-white min-h-screen p-8 max-w-4xl mx-auto space-y-8 print:p-0">
      
      {/* Letterhead Header */}
      <div className="border-b-4 border-double pb-6 flex justify-between items-center" style={{ borderColor: school.primaryColor }}>
        <div className="flex items-center space-x-4">
          {school.logoUrl ? (
            <img src={school.logoUrl} alt="Logo" className="w-16 h-16 object-cover rounded-xl" />
          ) : (
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-xl font-extrabold text-2xl text-slate-500">
              S
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black font-sans uppercase tracking-tight" style={{ color: school.primaryColor }}>
              {school.name}
            </h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-0.5">Official Student Transcript</p>
          </div>
        </div>

        {/* Print Button (hidden on print) */}
        <button 
          onClick={() => window.print()} 
          className="print:hidden px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all"
        >
          <Printer size={14} />
          <span>Print Document</span>
        </button>
      </div>

      {/* Student Details Metadata */}
      <div className="grid grid-cols-2 gap-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-xs font-semibold leading-relaxed">
        <div>
          <span className="text-slate-400">Student Name:</span>
          <span className="text-slate-800 ml-2">{student.name}</span>
        </div>
        <div>
          <span className="text-slate-400">Admission No:</span>
          <span className="text-slate-800 ml-2">{student.admissionNo}</span>
        </div>
        <div>
          <span className="text-slate-400">Class Section:</span>
          <span className="text-slate-800 ml-2">{student.class}</span>
        </div>
        <div>
          <span className="text-slate-400">Exam Details:</span>
          <span className="text-slate-800 ml-2">{examName}</span>
        </div>
      </div>

      {/* Results Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="p-4 font-bold text-slate-500 w-24">Code</th>
              <th className="p-4 font-bold text-slate-500">Subject</th>
              <th className="p-4 font-bold text-slate-500 text-center">Marks Obtained</th>
              <th className="p-4 font-bold text-slate-500 text-center">Max Marks</th>
              <th className="p-4 font-bold text-slate-500 text-center">Pass Marks</th>
              <th className="p-4 font-bold text-slate-500 text-center">Grade</th>
              <th className="p-4 font-bold text-slate-500 text-center">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/20">
                <td className="p-4 font-mono font-bold text-slate-400">{item.subjectCode}</td>
                <td className="p-4 font-bold text-slate-800">{item.subjectName}</td>
                <td className="p-4 text-center font-extrabold text-slate-800">{item.marksObtained}</td>
                <td className="p-4 text-center text-slate-500">{item.maxMarks}</td>
                <td className="p-4 text-center text-slate-500">{item.passMarks}</td>
                <td className="p-4 text-center"><span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">{item.grade}</span></td>
                <td className="p-4 text-center font-medium text-slate-500">{item.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Scores */}
      <div className="border-t border-slate-100 pt-6 flex justify-end">
        <div className="w-72 bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold">
          <div className="flex justify-between">
            <span className="text-slate-400">Aggregate Marks:</span>
            <span className="text-slate-800">{summary.totalMarks} / {summary.totalMax}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Percentage:</span>
            <span className="text-slate-800">{summary.percentage}%</span>
          </div>
          <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold">
            <span className="text-slate-500">GPA Grade Score:</span>
            <span className="text-slate-800">{summary.gpa}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="pt-20 grid grid-cols-2 text-center text-xs font-bold text-slate-400">
        <div className="w-48 border-t border-slate-200 pt-2 mx-auto">Class Teacher Signature</div>
        <div className="w-48 border-t border-slate-200 pt-2 mx-auto">Principal Signature</div>
      </div>
    </div>
  );
};
export default ReportCardPrint;
