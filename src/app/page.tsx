"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, FileText, MessageSquare, Hash } from "lucide-react";

const MIN_CHARACTERS = 120;

export default function ScriptInputPage() {
  const [script, setScript] = useState("");
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();

  // Load script from localStorage on mount
  useEffect(() => {
    const savedScript = localStorage.getItem("ai-shortform-script");
    if (savedScript) {
      setScript(savedScript);
    }
  }, []);

  // Validate script and update state
  useEffect(() => {
    setIsValid(script.length >= MIN_CHARACTERS);
  }, [script]);

  // Calculate text statistics
  const getTextStats = () => {
    const characters = script.length;
    const words = script.trim() ? script.trim().split(/\s+/).length : 0;
    const sentences = script.trim()
      ? script.split(/[.!?]+/).filter((s) => s.trim()).length
      : 0;

    return { characters, words, sentences };
  };

  const { characters, words, sentences } = getTextStats();

  const handleScriptChange = (value: string) => {
    setScript(value);
    // Auto-save to localStorage
    localStorage.setItem("ai-shortform-script", value);
  };

  const handleNavigateToMaker = () => {
    if (!isValid) {
      alert(
        `스크립트가 너무 짧습니다. 최소 ${MIN_CHARACTERS}자 이상 입력해주세요.`
      );
      return;
    }

    // Save to localStorage and navigate
    localStorage.setItem("ai-shortform-script", script);
    alert("스크립트 저장됨, 메이커 페이지로 이동합니다.");
    router.replace("/maker");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-card-foreground text-center">
            AI 숏폼 메이커
          </h1>
          <p className="text-muted-foreground text-center mt-2">
            스크립트를 입력하고 AI로 숏폼 비디오를 제작하세요
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              스크립트 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Textarea */}
            <div className="space-y-2">
              <Textarea
                placeholder="여기에 숏폼 비디오용 스크립트를 입력하세요. 최소 120자 이상 입력해주세요..."
                value={script}
                onChange={(e) => handleScriptChange(e.target.value)}
                className="min-h-[200px] resize-none text-base leading-relaxed"
              />

              {/* Character count warning */}
              {script.length > 0 && script.length < MIN_CHARACTERS && (
                <p className="text-sm text-destructive">
                  {MIN_CHARACTERS - script.length}자 더 입력해주세요
                </p>
              )}
            </div>

            {/* Text Statistics */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">글자:</span>
                <Badge
                  variant={
                    characters >= MIN_CHARACTERS ? "default" : "secondary"
                  }
                >
                  {characters}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">단어:</span>
                <Badge variant="outline">{words}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">문장:</span>
                <Badge variant="outline">{sentences}</Badge>
              </div>
            </div>

            {/* Navigation Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNavigateToMaker}
                disabled={!isValid}
                size="lg"
                className="gap-2"
              >
                메이커로 이동
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
