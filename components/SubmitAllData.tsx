"use client";

import React, { useState } from "react";
import { BasicData, MedicalData, InterviewData } from "@/types/patient";


interface Props {
  basicData: BasicData;
  medicalData: MedicalData;
  interviewData: InterviewData;
}

export default function SubmitAllData({ basicData, medicalData, interviewData }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/savePatientData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ basicData, medicalData, interviewData }),
      });

      const result = await response.json();

      if (response.ok) {
        setAnalysis(result.analysis);
      } else {
        setError(result.message || "Błąd podczas generowania analizy.");
      }
    } catch (err: any) {
      setError("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {!analysis && !loading && (
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Wygeneruj analizę diety
        </button>
      )}

      {loading && (
        <div className="text-blue-600 font-semibold mt-4">
          Generowanie analizy... Proszę czekać.
        </div>
      )}

      {error && (
        <div className="text-red-600 font-semibold mt-4">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4 text-green-700">Analiza gotowa ✅</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-xl">
            {analysis}
          </pre>
        </div>
      )}
    </div>
  );
}
