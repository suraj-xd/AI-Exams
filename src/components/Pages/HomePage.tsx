import React, { useState, useEffect } from "react";
import { BiGhost } from "react-icons/bi";
import { GoHome } from "react-icons/go";
import { IoTrophyOutline } from "react-icons/io5";
import Image from "next/image";
import useLoadingStore from "~/store/useLoadingStore";
import useJsonDataStore from "~/store/useJsonDataStore";
import Link from "next/link";
import SuccessRateMeter from "../SuccessRateMeter";
import { LuDice6 } from "react-icons/lu";
import { useActiveTabStore } from "~/store/useActivetabStore";
import Loader from "../Loader";
import { useEnhancedEduQuest } from "../../hooks/useEnhancedEduQuest";
import ReactJson from "react-json-view";
import toast from "react-hot-toast";
import SessionSidebar from "../SessionSidebar";
import useSessionStore from "../../store/useSessionStore";
import { FiSidebar, FiPlay, FiCheckCircle } from "react-icons/fi";
import { useRouter } from "next/router";

// Import the new minimal component
import { EduQuestPrompt } from "../EduQuestPrompt";
import PromptSuggestions from "../PromptSuggestions";
import { HomeSpinner } from "../ui/home-spinner";

const HomePage: React.FC = () => {
  const router = useRouter();
  const { activeTab, setActiveTab } = useActiveTabStore();
  const { isLoading } = useLoadingStore();
  const { jsonData } = useJsonDataStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { getRecentSessions } = useSessionStore();

  const handleSessionSelect = (sessionId: string) => {
    setSidebarOpen(false);
    router.push(`/interactive/${sessionId}`);
  };

  const recentSessions = getRecentSessions(3);

  return (
    <div className="mx-auto flex min-h-screen w-screen items-center justify-start bg-[#13151A] text-white">
      {/* Session Sidebar */}

      {/* Sidebar */}
      <div className="h-[100vh] w-[20%] bg-[#13151A]">
        <div className="mx-4 mt-5 flex flex-col items-center justify-center space-y-4">
          <button
            onClick={() => setActiveTab("Home")}
            className={`${activeTab === "Home" ? "bg-[#383942] text-white" : "text-[#9A9A9C]"} mx-auto flex w-full items-center justify-start space-x-2 rounded-md px-4 py-2 hover:bg-[#383942] hover:text-white`}
          >
            <GoHome />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab("Arcade")}
            className={`${activeTab === "Arcade" ? "bg-[#383942] text-white" : "text-[#9A9A9C]"} mx-auto flex w-full items-center justify-start space-x-2 rounded-md px-4 py-2 hover:bg-[#383942] hover:text-white`}
          >
            <BiGhost />
            <span>Arcade</span>
          </button>
          <button
            onClick={() => setActiveTab("Achievements")}
            className={`${activeTab === "Achievements" ? "bg-[#383942] text-white" : "text-[#9A9A9C]"} mx-auto flex w-full items-center justify-start space-x-2 rounded-md px-4 py-2 hover:bg-[#383942] hover:text-white`}
          >
            <IoTrophyOutline />
            <span>Achievements</span>
          </button>
          <SessionSidebar
            onClose={() => setSidebarOpen(false)}
            onSessionSelect={handleSessionSelect}
          />
        </div>
      </div>

      {/* Right Side */}
      {activeTab === "Home" && (
        <HomeContent
          recentSessions={recentSessions}
          onSessionSelect={handleSessionSelect}
        />
      )}
      {activeTab === "Arcade" && <Arcade />}
      {activeTab === "Achievements" && <Achievements />}
    </div>
  );
};

function HomeContent({
  recentSessions,
  onSessionSelect,
}: {
  recentSessions: any[];
  onSessionSelect: (sessionId: string) => void;
}) {
  const router = useRouter();
  const { isLoading } = useLoadingStore();
  const { jsonData, setJsonData } = useJsonDataStore();
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [questionConfig, setQuestionConfig] = useState({
    mcqs: 5,
    fillInBlanks: 5,
    trueFalse: 5,
    shortType: 3,
    longType: 2,
  });
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { generateWithContext, loading, error, clearError } =
    useEnhancedEduQuest();

  const handleGenerate = async (
    value: string,
    model: string,
    files: any[],
    questionConfig: any,
  ) => {
    if (files.length === 0 && !value.trim()) {
      toast.error("Please provide either files or a text prompt");
      return;
    }

    console.log("Generating questions with:", {
      filesCount: files.length,
      prompt: value.slice(0, 50) + "...",
      config: questionConfig,
      model: model,
    });

    const result = await generateWithContext(files, value, questionConfig);

    if (result) {
      setJsonData(result.questions);

      // Create session with the generated questions
      const { createSession } = useSessionStore.getState();
      const sessionId = createSession(
        `Quiz on ${value.slice(0, 30)}...` || "Generated Quiz",
        value || "Generated Questions",
        result.questions,
        questionConfig,
      );

      setSessionId(sessionId);
      console.log("Session created with ID:", sessionId);
      console.log("Questions data being passed:", result.questions);

      // Verify session was created
      const { getSessionById } = useSessionStore.getState();
      const createdSession = getSessionById(sessionId);
      console.log(
        "Session verification:",
        createdSession ? "Success" : "Failed",
      );
      console.log(
        "Created session questions count:",
        createdSession?.questions?.length || 0,
      );

      if (createdSession) {
        toast.success("Questions generated successfully! Redirecting...");

        // Use Next.js router for navigation with immediate redirect
        setTimeout(() => {
          router.push(`/interactive/${sessionId}`);
        }, 1500);
      } else {
        toast.error("Failed to create session. Please try again.");
      }
    } else if (error) {
      toast.error(error.message || "Failed to generate questions");
    }
  };

  const canGenerate = files.length > 0 || prompt.trim().length > 0;
  const totalQuestions = Object.values(questionConfig).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <div className="relative m-3 mb-0 h-[100vh] w-[78%] overflow-scroll rounded-[10px] bg-[#202329]">
      {/* Header */}
      <div className="sticky left-0 top-0 z-10 w-full border-b border-gray-700 bg-[#202329] py-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center space-x-3">
            <Image
              width={60}
              height={60}
              alt="EduQuest Logo"
              src={"/Subtract.svg"}
              className={`${(isLoading || loading) && "animate-pulse"}`}
            />
            <div>
              <h1 className="text-2xl font-bold text-white">EduQuest AI</h1>
              <p className="text-sm text-gray-400">
                Generate intelligent questions from any content
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mb-6 rounded-lg border border-red-500/50 bg-red-900/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-red-300">Error: {error.code}</h3>
              <p className="mt-1 text-red-200">{error.message}</p>
            </div>
            <button
              onClick={clearError}
              className="text-xl font-bold text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* Main Content - Centered and Minimal */}
      <div className="relative flex min-h-[calc(100vh-130px)] flex-col items-center justify-center overflow-hidden p-6">
        {!prompt && !loading && !jsonData && (
          <div className="mx-auto flex max-w-4xl items-center justify-center">
            <PromptSuggestions
              onSuggestionClick={(suggestion) => {
                setPrompt(suggestion);
              }}
            />
          </div>
        )}
        {/* Results Display */}
        {jsonData && (
          <div className="mx-6 mb-6 rounded-lg border border-gray-600 bg-[#383942] p-6">
            <div className="mb-4 flex items-center space-x-2 text-green-400">
              <FiCheckCircle size={20} />
              <h3 className="text-lg font-medium">Generated Questions</h3>
            </div>
            <ReactJson
              theme="twilight"
              src={jsonData}
              collapsed={1}
              displayDataTypes={false}
              displayObjectSize={false}
              name={false}
            />

            {sessionId && (
              <div className="mt-6">
                <Link href={`/interactive/${sessionId}`}>
                  <button className="flex items-center space-x-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-green-700">
                    <FiPlay />
                    <span>Start Interactive Mode</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
        <div className="absolute bottom-4 left-0 right-0 z-10 mx-[10%]">
          <EduQuestPrompt
            value={prompt}
            setValue={setPrompt}
            files={files}
            setFiles={setFiles}
            questionConfig={questionConfig}
            setQuestionConfig={setQuestionConfig}
            onSend={handleGenerate}
            loading={loading}
          />
        </div>
      </div>
      <HomeSpinner isLoading={loading} />
    </div>
  );
}

function Achievements() {
  const score =
    typeof window !== "undefined" ? localStorage.getItem("score") : null;
  const storedAccuracy =
    typeof window !== "undefined"
      ? localStorage.getItem("accuracyScore")
      : null;

  return (
    <div className="mt-10 grid h-[100vh] w-[78%] grid-cols-2">
      <div className="h-fit w-full">
        <h1 className="text-lg font-medium">Your achievements</h1>

        {/* Grids */}
        {score ? (
          <div className="my-10 grid h-fit w-full grid-cols-2 items-center justify-center gap-5">
            {parseInt(score, 10) >= 1 && (
              <div className="flex h-full w-full items-center justify-center">
                <Image
                  className="h-[220px] w-[180px]"
                  alt="Level 5 Badge"
                  width={180}
                  height={220}
                  src={"/Badge1.png"}
                />
              </div>
            )}
            {parseInt(score, 10) >= 5 && (
              <div className="flex h-full w-full items-center justify-center">
                <Image
                  className="h-[220px] w-[180px]"
                  alt="Level 10 Badge"
                  width={180}
                  height={220}
                  src={"/Badge2.png"}
                />
              </div>
            )}
            {parseInt(score, 10) >= 10 && (
              <div className="flex h-full w-full items-center justify-center">
                <Image
                  className="h-[220px] w-[180px]"
                  alt="Level 15 Badge"
                  width={180}
                  height={220}
                  src={"/Badge3.png"}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-5 text-gray-400">No Achievements to show</p>
        )}
      </div>
      <div className="h-fit w-full">
        <h1 className="mb-10 text-lg font-medium">Analysis Accuracy</h1>
        <SuccessRateMeter
          successRate={(100 - parseInt(storedAccuracy || "0", 10)).toString()}
          successCount={score || "0"}
          failCount={storedAccuracy || "0"}
        />
      </div>
    </div>
  );
}

function Arcade() {
  const [randomQuestion, setRandomQuestion] = useState<string | null>(null);
  const { getRandomQuestion } = useEnhancedEduQuest();

  const fetchRandomQuestion = async () => {
    const question = await getRandomQuestion();
    if (question) {
      setRandomQuestion(question);
    }
  };

  return (
    <div className="h-[100vh] w-[78%]">
      <div className="mt-5 flex w-full items-center justify-start rounded-[10px] bg-[#202329] py-5">
        <Image
          onClick={fetchRandomQuestion}
          className="h-[250px] w-[350px] cursor-pointer transition-transform hover:scale-105"
          alt="Random Game"
          width={350}
          height={250}
          src={"/RandomGame.svg"}
        />
        <div>
          <h1 className="ml-5 text-xl font-bold">Random Question</h1>
        </div>
      </div>

      {randomQuestion && (
        <div className="mt-6 rounded-lg bg-[#202329] p-6">
          <div className="mb-4 flex items-center justify-start gap-3 text-2xl">
            <LuDice6 />
            <h3 className="font-bold">Question</h3>
          </div>
          <p className="text-lg">{randomQuestion}</p>
        </div>
      )}
    </div>
  );
}

export default HomePage;
