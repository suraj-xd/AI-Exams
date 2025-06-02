import React, { useState } from "react";
import useSessionStore, { QuizSession } from "../store/useSessionStore";
import {
  FiClock,
  FiEdit3,
  FiTrash2,
  FiCheck,
  FiPlay,
  FiRefreshCw,
  FiCalendar,
  FiBarChart,
  FiPlus,
  FiFilter,
  FiSidebar,
} from "react-icons/fi";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface SessionSidebarProps {
  onClose: () => void;
  onSessionSelect: (sessionId: string) => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  onClose,
  onSessionSelect,
}) => {
  const {
    sessions,
    currentSession,
    deleteSession,
    resetSession,
    setCurrentSession,
    updateSessionName,
    getRecentSessions,
    getCompletedSessions,
    getIncompleteSessions,
  } = useSessionStore();

  const [filter, setFilter] = useState<
    "all" | "recent" | "completed" | "incomplete"
  >("recent");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const getFilteredSessions = () => {
    switch (filter) {
      case "recent":
        return getRecentSessions(10);
      case "completed":
        return getCompletedSessions();
      case "incomplete":
        return getIncompleteSessions();
      default:
        return sessions.sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime(),
        );
    }
  };

  const handleSessionSelect = (session: QuizSession) => {
    setCurrentSession(session.id);
    onSessionSelect(session.id);
  };

  const handleEditStart = (session: QuizSession) => {
    setEditingSessionId(session.id);
    setEditingName(session.name);
  };

  const handleEditSave = () => {
    if (editingSessionId && editingName.trim()) {
      updateSessionName(editingSessionId, editingName.trim());
    }
    setEditingSessionId(null);
    setEditingName("");
  };

  const handleEditCancel = () => {
    setEditingSessionId(null);
    setEditingName("");
  };

  const getStatusIcon = (session: QuizSession) => {
    if (session.isCompleted) {
      return <FiCheck className="text-green-500" size={16} />;
    }
    if (session.userAnswers.length > 0) {
      return <FiClock className="text-yellow-500" size={16} />;
    }
    return <FiPlay className="text-gray-400" size={16} />;
  };

  const getProgressPercentage = (session: QuizSession) => {
    if (session.questions.length === 0) return 0;
    return Math.round(
      (session.userAnswers.length / session.questions.length) * 100,
    );
  };

  return (
    <Sheet>
      <SheetTrigger className="w-full">
        <button
          className={`mx-auto flex w-full items-center justify-start space-x-2 rounded-md px-4 py-2 text-[#9A9A9C] hover:bg-[#383942] hover:text-white`}
        >
          <FiSidebar />
          <span>Sessions</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-80">
        <div className="relative flex w-full flex-col overflow-hidden bg-gray-900 text-white">
          {/* Header */}
          <div className="border-b border-gray-700 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Quiz Sessions</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "recent", label: "Recent", icon: FiClock },
                { key: "completed", label: "Completed", icon: FiCheck },
                { key: "incomplete", label: "In Progress", icon: FiPlay },
                { key: "all", label: "All", icon: FiFilter },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                    filter === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {getFilteredSessions().length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <FiBarChart size={48} className="mx-auto mb-2 opacity-50" />
                <p>No sessions found</p>
                <p className="mt-1 text-xs">Create a quiz to get started!</p>
              </div>
            ) : (
              <div className="p-2">
                {getFilteredSessions().map((session) => (
                  <div
                    key={session.id}
                    className={`mb-2 cursor-pointer rounded-lg border p-3 transition-all ${
                      currentSession?.id === session.id
                        ? "border-blue-600 bg-blue-900"
                        : "hover:bg-gray-750 border-gray-700 bg-gray-800"
                    }`}
                  >
                    {/* Session Header */}
                    <div className="mb-2 flex items-start justify-between">
                      <div
                        className="min-w-0 flex-1"
                        onClick={() => handleSessionSelect(session)}
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 rounded bg-gray-700 px-2 py-1 text-sm text-white"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditSave();
                                if (e.key === "Escape") handleEditCancel();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleEditSave}
                              className="text-green-400 hover:text-green-300"
                            >
                              <FiCheck size={14} />
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {getStatusIcon(session)}
                            <h3 className="truncate text-sm font-medium">
                              {session.name}
                            </h3>
                          </div>
                        )}
                      </div>

                      {editingSessionId !== session.id && (
                        <div className="ml-2 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(session);
                            }}
                            className="text-gray-400 hover:text-blue-400"
                          >
                            <FiEdit3 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetSession(session.id);
                            }}
                            className="text-gray-400 hover:text-yellow-400"
                          >
                            <FiRefreshCw size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Session Info */}
                    <div
                      className="space-y-1 text-xs text-gray-400"
                      onClick={() => handleSessionSelect(session)}
                    >
                      <div className="flex items-center gap-2">
                        <FiCalendar size={10} />
                        <span>
                          {format(new Date(session.createdAt), "MMM dd, yyyy")}
                        </span>
                        <span>•</span>
                        <span>{session.topic}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span>{session.questions.length} questions</span>
                        <span>•</span>
                        <span>{session.userAnswers.length} answered</span>
                        {session.analysis && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">
                              {session.analysis.percentage}% score
                            </span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-700">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            session.isCompleted ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${getProgressPercentage(session)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          <div className="border-t border-gray-700 bg-gray-800 p-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-medium text-white">{sessions.length}</div>
                <div className="text-gray-400">Total</div>
              </div>
              <div>
                <div className="font-medium text-green-400">
                  {getCompletedSessions().length}
                </div>
                <div className="text-gray-400">Completed</div>
              </div>
              <div>
                <div className="font-medium text-yellow-400">
                  {getIncompleteSessions().length}
                </div>
                <div className="text-gray-400">In Progress</div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionSidebar;
