"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface QuestionPreviewProps {
  text: string;
  type: "MCQ" | "TRUE_FALSE" | "NUMERICAL";
  options?: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
  points?: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  questionImage?: string | null;
  optionImages?: Record<string, string | null> | null;
  subjectName?: string;
  categoryName?: string;
  showCorrect?: boolean; // Highlight correct answer
}

export function QuestionPreview({
  text,
  type,
  options = {},
  correctAnswer,
  explanation,
  points = 1,
  difficulty = "MEDIUM",
  questionImage,
  optionImages,
  subjectName,
  categoryName,
  showCorrect = true,
}: QuestionPreviewProps) {
  
  const difficultyColors = {
    EASY: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HARD: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden relative">
      {/* Floating Preview Badge */}
      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-bold tracking-widest uppercase px-3 py-1 rounded-bl-lg shadow-sm z-10 animate-pulse">
        Live Preview
      </div>

      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className={difficultyColors[difficulty]}>
            {difficulty}
          </Badge>
          {subjectName && (
            <Badge variant="secondary" className="bg-slate-200 text-slate-700">
              {subjectName}
            </Badge>
          )}
          {categoryName && (
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
              {categoryName}
            </Badge>
          )}
          <Badge variant="outline" className="ml-auto text-slate-500 text-xs">
            {points} {points === 1 ? "Mark" : "Marks"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {/* Question Text */}
        <div className="space-y-3">
          <div className="text-slate-800 font-semibold leading-relaxed flex items-start gap-2.5">
            <span className="bg-indigo-50 text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              Q
            </span>
            <span className="whitespace-pre-line">{text || "Write your question text..."}</span>
          </div>

          {/* Question Image Attachment */}
          {questionImage && (
            <div className="relative border border-slate-150 rounded-xl overflow-hidden max-w-md bg-slate-50 p-2 flex items-center justify-center group">
              <div className="relative aspect-video w-full">
                <img
                  src={questionImage}
                  alt="Question Attachment"
                  className="rounded-lg object-contain w-full h-full max-h-56"
                />
              </div>
            </div>
          )}
        </div>

        {/* Options Rendering */}
        <div className="space-y-2.5 pt-2">
          {type === "MCQ" && (
            <div className="grid gap-3">
              {["A", "B", "C", "D"].map((key) => {
                const optText = options[key] || "";
                const isCorrect = correctAnswer === key;
                const optImg = optionImages ? optionImages[key] : null;

                return (
                  <div
                    key={key}
                    className={`flex flex-col p-3.5 rounded-xl border text-sm transition ${
                      showCorrect && isCorrect
                        ? "bg-emerald-50/50 border-emerald-500 text-emerald-900 shadow-sm shadow-emerald-500/5"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          showCorrect && isCorrect
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {key}
                      </span>
                      <span className="flex-1 font-medium">{optText || `Option ${key} content`}</span>
                      {showCorrect && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>

                    {/* Option Image Attachment */}
                    {optImg && (
                      <div className="mt-2.5 pl-9 max-w-[200px]">
                        <img
                          src={optImg}
                          alt={`Option ${key} Attachment`}
                          className="rounded-lg border border-slate-100 max-h-24 object-contain"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {type === "TRUE_FALSE" && (
            <div className="grid grid-cols-2 gap-3">
              {["true", "false"].map((val) => {
                const isCorrect = correctAnswer === val;
                return (
                  <div
                    key={val}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold justify-center capitalize transition ${
                      showCorrect && isCorrect
                        ? "bg-emerald-50/50 border-emerald-500 text-emerald-900"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{val}</span>
                    {showCorrect && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                );
              })}
            </div>
          )}

          {type === "NUMERICAL" && (
            <div className="space-y-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-400 text-sm font-mono flex items-center justify-between">
                <span>[Student text input box]</span>
                <FileText className="w-4 h-4" />
              </div>
              {showCorrect && correctAnswer && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 px-1.5">
                  <span className="font-semibold text-slate-700">Correct Value:</span>
                  <code className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-mono">
                    {correctAnswer}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100 text-slate-600 text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-700 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Explanation</span>
            </div>
            <p className="whitespace-pre-line">{explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
