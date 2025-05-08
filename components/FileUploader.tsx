import { ChangeEvent, useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileUploaderProps {
  onDataLoaded: (data: any[], headers: string[]) => void;
}

const FileUploader = ({ onDataLoaded }: FileUploaderProps) => {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const data = jsonData.slice(1) as any[];
        onDataLoaded(data, headers);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processCsvFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const data = results.data.slice(1) as any[];
        onDataLoaded(data, headers);
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (file.name.endsWith('.csv')) {
        processCsvFile(file);
      } else if (file.name.match(/\.(xlsx|xls)$/)) {
        processExcelFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      if (file.name.endsWith('.csv')) {
        processCsvFile(file);
      } else if (file.name.match(/\.(xlsx|xls)$/)) {
        processExcelFile(file);
      }
    }
  };

  return (
    <div
      className={`w-full border-2 border-dashed rounded-xl transition-colors duration-200 ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full py-8 cursor-pointer"
      >
        <div className="flex flex-col items-center justify-center px-4 text-center">
          <svg
            className={`w-10 h-10 mb-3 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className={`text-sm font-medium ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
            {fileName ? (
              <span className="text-blue-600">{fileName}</span>
            ) : (
              <>
                <span className="font-semibold">Click to upload</span> or drag and drop your CSV or Excel file
              </>
            )}
          </p>
          <p className={`text-xs mt-1 ${isDragging ? 'text-blue-500' : 'text-gray-500'}`}>
            Your data stays private and secure
          </p>
        </div>
        <input
          id="dropzone-file"
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
        />
      </label>
    </div>
  );
};

export default FileUploader; 